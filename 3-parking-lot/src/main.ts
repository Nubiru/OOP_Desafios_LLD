import { GarageBuilder } from "./factories/GarageBuilder";
import { StandardGarageFactory } from "./factories/ParkingSpotFactory";
import { ParkingManager } from "./ParkingManager";
import { ParkingLot } from "./ParkingLot";
import { HourlyPricing } from "./pricing/HourlyPricing";
import { SurgePricing } from "./pricing/SurgePricing";
import { HOUR_MS } from "./pricing/PricingStrategy";
import { Motorcycle, Car, Truck } from "./models/Vehicle";
import { ParkingError } from "./errors";

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Reloj simulado para una demo determinista.
let now = 0;
const clock = () => now;

// 1) Construcción de la topología vía Abstract Factory + Builder.
const spots = new GarageBuilder(new StandardGarageFactory()).build({
  floors: 1,
  compactPerFloor: 2,
  standardPerFloor: 2,
  oversizePerFloor: 1,
});
const lot = new ParkingLot(new ParkingManager(spots), new HourlyPricing(200), clock);

console.log("=== Estacionamiento (Facade + Strategy + Abstract Factory) ===");
console.log("Plazas iniciales:", lot.availability(), "\n");

// 2) Ingresos: best-fit por tamaño.
const moto = lot.enter(new Motorcycle("MOTO-1")); // -> plaza SMALL
const auto = lot.enter(new Car("AUTO-1")); // -> plaza MEDIUM
const camion = lot.enter(new Truck("CAM-1")); // -> plaza LARGE (única)
console.log("Ingreso moto   ->", moto.spotId);
console.log("Ingreso auto   ->", auto.spotId);
console.log("Ingreso camion ->", camion.spotId);
console.log("Disponibilidad:", lot.availability(), "\n");

// 3) Un segundo camión no tiene plaza grande -> rechazado.
try {
  lot.enter(new Truck("CAM-2"));
} catch (err) {
  console.log("Segundo camion:", err instanceof ParkingError ? err.message : err, "\n");
}

// 4) Salida del auto tras 90 min con tarifa por hora (redondea a 2 h).
now = 90 * 60 * 1000;
const r1 = lot.exit(auto.id);
console.log(
  `Salida auto: ${(r1.durationMs / HOUR_MS).toFixed(2)} h -> ${money(r1.feeCents)} (${r1.pricing})`,
);

// 5) La plaza liberada se reutiliza: el segundo camión... sigue sin entrar (era LARGE),
//    pero un auto nuevo sí toma la MEDIUM liberada.
const auto2 = lot.enter(new Car("AUTO-2"));
console.log("Reutilizacion de plaza MEDIUM ->", auto2.spotId, "\n");

// 6) Surge pricing en caliente: el camión sale en hora pico (x2.5).
now = 3 * HOUR_MS;
lot.setPricing(new SurgePricing(200, 2.5));
const r2 = lot.exit(camion.id);
console.log(`Salida camion (surge): 3 h -> ${money(r2.feeCents)} (${r2.pricing})`);

// 7) Reutilizar un ticket ya usado es inválido (anti-fraude).
try {
  lot.exit(camion.id);
} catch (err) {
  console.log("Reuso de ticket:", err instanceof ParkingError ? err.message : err);
}
