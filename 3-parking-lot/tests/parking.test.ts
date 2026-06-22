import { test } from "node:test";
import assert from "node:assert/strict";

import { GarageBuilder } from "../src/factories/GarageBuilder";
import {
  StandardGarageFactory,
  PremiumGarageFactory,
} from "../src/factories/ParkingSpotFactory";
import { ParkingManager } from "../src/ParkingManager";
import { ParkingLot } from "../src/ParkingLot";
import { HourlyPricing } from "../src/pricing/HourlyPricing";
import { FlatRatePricing } from "../src/pricing/FlatRatePricing";
import { SurgePricing } from "../src/pricing/SurgePricing";
import { HOUR_MS } from "../src/pricing/PricingStrategy";
import { Motorcycle, Car, Truck } from "../src/models/Vehicle";
import { Size } from "../src/models/Size";
import { ParkingError } from "../src/errors";

const standardConfig = {
  floors: 1,
  compactPerFloor: 1,
  standardPerFloor: 1,
  oversizePerFloor: 1,
};

function buildManager(config = standardConfig, factory = new StandardGarageFactory()) {
  return new ParkingManager(new GarageBuilder(factory).build(config));
}

/** Lot con reloj controlable; devuelve [lot, setNow]. */
function buildLot(config = standardConfig) {
  let now = 0;
  const lot = new ParkingLot(buildManager(config), new HourlyPricing(200), () => now);
  return { lot, setNow: (ms: number) => (now = ms) };
}

test("best-fit: la moto ocupa la plaza SMALL", () => {
  const m = buildManager();
  const spot = m.assign(new Motorcycle("M1"));
  assert.equal(spot.size, Size.SMALL);
});

test("compatibilidad: el auto no entra en SMALL, toma MEDIUM", () => {
  // Solo hay una SMALL y una MEDIUM; el auto debe ir a MEDIUM.
  const m = buildManager();
  const spot = m.assign(new Car("A1"));
  assert.equal(spot.size, Size.MEDIUM);
});

test("compatibilidad: el camión solo entra en LARGE", () => {
  const m = buildManager();
  const spot = m.assign(new Truck("C1"));
  assert.equal(spot.size, Size.LARGE);
});

test("best-fit deja las plazas grandes libres para vehículos grandes", () => {
  // 1 de cada tamaño. La moto debe tomar SMALL (no malgastar la LARGE).
  const m = buildManager();
  m.assign(new Motorcycle("M1"));
  assert.equal(m.freeCount(Size.SMALL), 0);
  assert.equal(m.freeCount(Size.LARGE), 1); // intacta
});

test("rechazo: sin plaza compatible para un camión", () => {
  // Garaje sin plazas grandes.
  const m = buildManager({
    floors: 1,
    compactPerFloor: 1,
    standardPerFloor: 1,
    oversizePerFloor: 0,
  });
  assert.throws(() => m.assign(new Truck("C1")), /Sin plazas compatibles/);
});

test("overflow: más vehículos que plazas -> el sobrante se rechaza", () => {
  const { lot } = buildLot({
    floors: 1,
    compactPerFloor: 0,
    standardPerFloor: 0,
    oversizePerFloor: 1,
  });
  lot.enter(new Truck("C1"));
  assert.throws(() => lot.enter(new Truck("C2")), ParkingError);
});

test("no hay doble asignación: dos camiones reciben plazas distintas", () => {
  const m = buildManager({
    floors: 1,
    compactPerFloor: 0,
    standardPerFloor: 0,
    oversizePerFloor: 2,
  });
  const s1 = m.assign(new Truck("C1"));
  const s2 = m.assign(new Truck("C2"));
  assert.notEqual(s1.id, s2.id);
});

test("ciclo completo: ingreso y salida liberan la plaza para reutilización", () => {
  const { lot, setNow } = buildLot({
    floors: 1,
    compactPerFloor: 0,
    standardPerFloor: 0,
    oversizePerFloor: 1,
  });
  const t = lot.enter(new Truck("C1"));
  assert.equal(lot.freeSpots(), 0);
  setNow(HOUR_MS);
  lot.exit(t.id);
  assert.equal(lot.freeSpots(), 1);
  // La plaza vuelve a estar disponible.
  assert.doesNotThrow(() => lot.enter(new Truck("C2")));
});

test("tarifa por hora: 90 min redondea a 2 horas", () => {
  const { lot, setNow } = buildLot();
  const t = lot.enter(new Car("A1"));
  setNow(90 * 60 * 1000);
  const r = lot.exit(t.id);
  assert.equal(r.feeCents, 400); // 2 h * $2.00
});

test("tarifa plana: importe fijo sin importar la duración", () => {
  let now = 0;
  const lot = new ParkingLot(buildManager(), new FlatRatePricing(500), () => now);
  const t = lot.enter(new Car("A1"));
  now = 10 * HOUR_MS;
  assert.equal(lot.exit(t.id).feeCents, 500);
});

test("surge pricing intercambiable en caliente (x2.5)", () => {
  const { lot, setNow } = buildLot();
  const t = lot.enter(new Car("A1"));
  lot.setPricing(new SurgePricing(200, 2.5));
  setNow(HOUR_MS);
  assert.equal(lot.exit(t.id).feeCents, 500); // 1 h * 200 * 2.5
});

test("anti-fraude: reusar un ticket ya utilizado es inválido", () => {
  const { lot, setNow } = buildLot();
  const t = lot.enter(new Car("A1"));
  setNow(HOUR_MS);
  lot.exit(t.id);
  assert.throws(() => lot.exit(t.id), /inválido o ya utilizado/);
});

test("Abstract Factory: el garaje premium equipa cargador EV; el estándar no", () => {
  const premium = new GarageBuilder(new PremiumGarageFactory()).build(standardConfig);
  const standard = new GarageBuilder(new StandardGarageFactory()).build(standardConfig);
  const premiumMedium = premium.find((s) => s.size === Size.MEDIUM)!;
  const standardMedium = standard.find((s) => s.size === Size.MEDIUM)!;
  assert.ok(premiumMedium.features.includes("cargador-ev"));
  assert.equal(standardMedium.features.length, 0);
});

test("GarageBuilder produce la cantidad correcta de plazas", () => {
  const spots = new GarageBuilder(new StandardGarageFactory()).build({
    floors: 2,
    compactPerFloor: 3,
    standardPerFloor: 2,
    oversizePerFloor: 1,
  });
  assert.equal(spots.length, 2 * (3 + 2 + 1)); // 12
});
