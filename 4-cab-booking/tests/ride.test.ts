import { test } from "node:test";
import assert from "node:assert/strict";

import { GridIndex } from "../src/matching/GridIndex";
import { DriverMatcher } from "../src/matching/DriverMatcher";
import { RideService } from "../src/RideService";
import { Driver, DriverStatus } from "../src/models/Driver";
import { Rider } from "../src/models/Rider";
import { Trip } from "../src/models/Trip";
import { RequestedState } from "../src/states/TripStates";
import { StandardPricing } from "../src/pricing/StandardPricing";
import { SurgePricing } from "../src/pricing/SurgePricing";
import { PooledPricing } from "../src/pricing/PooledPricing";
import { RiderLocationTracker } from "../src/observers/RiderLocationTracker";
import { TripError } from "../src/errors";

const PICKUP = { x: 0, y: 0 };
const DROPOFF = { x: 3, y: 4 }; // distancia 5

function buildService() {
  const matcher = new DriverMatcher(new GridIndex(2));
  const service = new RideService(matcher, new StandardPricing(250, 100, 10));
  return { matcher, service };
}

function rider() {
  return new Rider("U1", "Pasajero", PICKUP);
}

test("matchmaking: empareja al conductor más cercano", () => {
  const { service } = buildService();
  const near = new Driver("D1", "Cerca", { x: 1, y: 0 });
  const far = new Driver("D2", "Lejos", { x: 9, y: 9 });
  service.registerDriver(far);
  service.registerDriver(near);
  const trip = service.requestRide(rider(), PICKUP, DROPOFF);
  assert.equal(trip.driver?.id, "D1");
});

test("matchmaking: desempata por tasa de aceptación a igual distancia", () => {
  const { service } = buildService();
  const low = new Driver("D1", "Baja", { x: 1, y: 0 }, 0.6);
  const high = new Driver("D2", "Alta", { x: 1, y: 0 }, 0.95);
  service.registerDriver(low);
  service.registerDriver(high);
  const trip = service.requestRide(rider(), PICKUP, DROPOFF);
  assert.equal(trip.driver?.id, "D2");
});

test("sin conductores cercanos: la solicitud se rechaza", () => {
  const { service } = buildService();
  service.registerDriver(new Driver("D1", "Lejano", { x: 50, y: 50 }));
  assert.throws(() => service.requestRide(rider(), PICKUP, DROPOFF), TripError);
});

test("al asignar, el conductor queda ASSIGNED y no se reempareja", () => {
  const { service } = buildService();
  const d1 = new Driver("D1", "Uno", { x: 1, y: 0 });
  service.registerDriver(d1);
  service.requestRide(rider(), PICKUP, DROPOFF);
  assert.equal(d1.status, DriverStatus.ASSIGNED);
  // No quedan disponibles para una segunda solicitud.
  assert.throws(() => service.requestRide(rider(), PICKUP, DROPOFF), TripError);
});

test("Observer: el pasajero recibe las actualizaciones de ubicación", () => {
  const { service } = buildService();
  const d1 = new Driver("D1", "Uno", { x: 2, y: 0 });
  service.registerDriver(d1);
  const trip = service.requestRide(rider(), PICKUP, DROPOFF);
  assert.equal(trip.tracker?.updateCount, 0);
  service.updateDriverLocation(d1, { x: 1, y: 0 });
  service.updateDriverLocation(d1, { x: 0.5, y: 0 });
  assert.equal(trip.tracker?.updateCount, 2);
  assert.deepEqual(trip.tracker?.lastLocation, { x: 0.5, y: 0 });
});

test("Observer: al completar se cierra el canal de telemetría", () => {
  const { service } = buildService();
  const d1 = new Driver("D1", "Uno", { x: 1, y: 0 });
  service.registerDriver(d1);
  const trip = service.requestRide(rider(), PICKUP, DROPOFF);
  assert.equal(d1.subscriberCount, 1);
  service.startTrip(trip.id);
  service.completeTrip(trip.id);
  assert.equal(d1.subscriberCount, 0);
});

test("State: ciclo de vida feliz REQUESTED→ASSIGNED→IN_PROGRESS→COMPLETED", () => {
  const { service } = buildService();
  service.registerDriver(new Driver("D1", "Uno", { x: 1, y: 0 }));
  const trip = service.requestRide(rider(), PICKUP, DROPOFF);
  assert.equal(trip.status, "DRIVER_ASSIGNED");
  service.startTrip(trip.id);
  assert.equal(trip.status, "IN_PROGRESS");
  service.completeTrip(trip.id);
  assert.equal(trip.status, "COMPLETED");
});

test("State: no se puede iniciar un viaje recién solicitado (sin asignar)", () => {
  const trip = new Trip("R1", rider(), PICKUP, DROPOFF, new RequestedState());
  assert.throws(() => trip.start(), /No se puede iniciar/);
});

test("State: no se puede completar antes de iniciar", () => {
  const { service } = buildService();
  service.registerDriver(new Driver("D1", "Uno", { x: 1, y: 0 }));
  const trip = service.requestRide(rider(), PICKUP, DROPOFF);
  assert.throws(() => trip.complete(new StandardPricing(0, 0, 0)), /completar/);
});

test("State: no se puede cancelar un viaje ya completado", () => {
  const { service } = buildService();
  service.registerDriver(new Driver("D1", "Uno", { x: 1, y: 0 }));
  const trip = service.requestRide(rider(), PICKUP, DROPOFF);
  service.startTrip(trip.id);
  service.completeTrip(trip.id);
  assert.throws(() => service.cancelTrip(trip.id), /cancelar/);
});

test("State: cancelar antes de iniciar libera al conductor", () => {
  const { service } = buildService();
  const d1 = new Driver("D1", "Uno", { x: 1, y: 0 });
  service.registerDriver(d1);
  const trip = service.requestRide(rider(), PICKUP, DROPOFF);
  service.cancelTrip(trip.id);
  assert.equal(trip.status, "CANCELLED");
  assert.equal(d1.status, DriverStatus.AVAILABLE);
});

test("Strategy: tarifa estándar = base + km + min", () => {
  // distancia 5 km, duración eta = (5/30)*60 = 10 min
  const p = new StandardPricing(250, 100, 10);
  assert.equal(p.computeFare(5, 10), 250 + 500 + 100); // 850
});

test("Strategy: surge multiplica la base", () => {
  const base = new StandardPricing(250, 100, 10);
  const surge = new SurgePricing(base, 2);
  assert.equal(surge.computeFare(5, 10), 1700);
});

test("Strategy: pool aplica descuento", () => {
  const base = new StandardPricing(250, 100, 10); // 850
  const pool = new PooledPricing(base, 0.7);
  assert.equal(pool.computeFare(5, 10), Math.round(850 * 0.7)); // 595
});

test("integración: el ETA del tracker se recalcula con la última posición", () => {
  const tracker = new RiderLocationTracker(rider(), { x: 0, y: 0 });
  assert.equal(tracker.etaMinutes(), null); // sin datos aún
  tracker.onLocationUpdate("D1", { x: 30, y: 0 }); // 30 km a 30 km/h = 60 min
  assert.equal(tracker.etaMinutes(), 60);
});
