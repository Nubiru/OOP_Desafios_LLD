import { GridIndex } from "./matching/GridIndex";
import { DriverMatcher } from "./matching/DriverMatcher";
import { RideService } from "./RideService";
import { Driver } from "./models/Driver";
import { Rider } from "./models/Rider";
import { StandardPricing } from "./pricing/StandardPricing";
import { SurgePricing } from "./pricing/SurgePricing";
import { TripError } from "./errors";

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const matcher = new DriverMatcher(new GridIndex(2));
const standard = new StandardPricing(250, 120, 20); // base $2.50 + $1.20/km + $0.20/min
const service = new RideService(matcher, standard);

// Flota de conductores con distintas posiciones y tasas de aceptación.
const ana = new Driver("D1", "Ana", { x: 1, y: 1 }, 0.9);
const beto = new Driver("D2", "Beto", { x: 8, y: 8 }, 0.95);
const cami = new Driver("D3", "Cami", { x: 2, y: 0 }, 0.7);
[ana, beto, cami].forEach((d) => service.registerDriver(d));

const rider = new Rider("U1", "Pasajero", { x: 0, y: 0 });

console.log("=== Cab Booking (Observer + Strategy + State) ===\n");

// 1) Solicitud -> emparejamiento por proximidad (Ana y Cami están cerca).
const trip = service.requestRide(rider, { x: 0, y: 0 }, { x: 5, y: 4 });
console.log(`Viaje ${trip.id}: conductor asignado = ${trip.driver?.name} (estado ${trip.status})`);

// 2) Telemetría en vivo: el conductor se acerca; el pasajero la recibe (Observer).
console.log("\n-- Telemetria en vivo (Observer) --");
service.updateDriverLocation(trip.driver!, { x: 0.6, y: 0.6 });
service.updateDriverLocation(trip.driver!, { x: 0.2, y: 0.2 });
console.log(
  `  updates recibidos por el pasajero: ${trip.tracker?.updateCount}, ` +
    `ETA a recogida: ${trip.tracker?.etaMinutes()?.toFixed(1)} min`,
);

// 3) Inicio del viaje.
service.startTrip(trip.id);
console.log("\nViaje iniciado, estado:", trip.status);

// 4) Completar con tarifa estándar.
const fare = service.completeTrip(trip.id);
console.log(`Viaje completado: tarifa ${money(fare)} (estado ${trip.status})`);
console.log("  canal de telemetria cerrado, suscriptores del conductor:", trip.driver?.subscriberCount);

// 5) Transición ilegal: no se puede cancelar un viaje ya completado.
try {
  service.cancelTrip(trip.id);
} catch (err) {
  console.log("\nIntento de cancelar completado:", err instanceof TripError ? err.message : err);
}

// 6) Surge pricing en hora pico para un nuevo viaje (mismo trayecto, x2).
console.log("\n-- Surge pricing (Strategy en caliente) --");
service.setPricing(new SurgePricing(standard, 2));
const trip2 = service.requestRide(rider, { x: 0, y: 0 }, { x: 5, y: 4 });
service.startTrip(trip2.id);
const fare2 = service.completeTrip(trip2.id);
console.log(`Mismo trayecto con surge x2 -> ${money(fare2)}`);
