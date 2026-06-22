import { ParkingManager } from "./ParkingManager";
import { PricingStrategy } from "./pricing/PricingStrategy";
import { Vehicle } from "./models/Vehicle";
import { Ticket, Receipt } from "./models/Ticket";
import { ParkingError } from "./errors";

/** Reloj inyectable (ms). Por defecto, el del sistema. */
export type Clock = () => number;

/**
 * Patrón FACADE — punto de entrada simplificado del sistema.
 *
 * Los clientes externos solo piden operaciones simples (`enter` / `exit`),
 * mientras la fachada absorbe y coordina la complejidad: el gestor de
 * disponibilidad (ParkingManager), el motor de precios (PricingStrategy) y la
 * emisión/validación de tickets.
 */
export class ParkingLot {
  private readonly tickets = new Map<string, Ticket>();
  private sequence = 0;

  constructor(
    private readonly manager: ParkingManager,
    private pricing: PricingStrategy,
    private readonly clock: Clock = () => Date.now(),
  ) {}

  /** Ingreso: asigna plaza óptima y emite un ticket. Lanza si no hay lugar. */
  enter(vehicle: Vehicle): Ticket {
    const spot = this.manager.assign(vehicle); // rechaza si no hay plaza compatible
    const ticket = new Ticket(
      `T${++this.sequence}`,
      vehicle.plate,
      spot.id,
      this.clock(),
    );
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  /** Salida: valida el ticket, cobra, libera la plaza y purga el registro. */
  exit(ticketId: string, exitMsOverride?: number): Receipt {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      throw new ParkingError(`Ticket inválido o ya utilizado: ${ticketId}.`);
    }
    const exitMs = exitMsOverride ?? this.clock();
    const feeCents = this.pricing.computeFee(ticket.entryMs, exitMs);

    this.manager.release(ticket.spotId);
    this.tickets.delete(ticketId); // evita reutilización fraudulenta del ticket

    return {
      ticket,
      exitMs,
      durationMs: exitMs - ticket.entryMs,
      feeCents,
      pricing: this.pricing.name,
    };
  }

  /** Cambia el motor de precios en caliente (Strategy intercambiable). */
  setPricing(pricing: PricingStrategy): void {
    this.pricing = pricing;
  }

  availability(): Record<string, number> {
    return this.manager.availability();
  }

  freeSpots(): number {
    return this.manager.freeCount();
  }

  activeTickets(): number {
    return this.tickets.size;
  }
}
