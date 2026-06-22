/**
 * Objeto inmutable de transferencia de datos (DTO). Acumula los metadatos de la
 * transacción: identificador único, patente, plaza asignada y marca temporal de
 * ingreso (en milisegundos).
 */
export class Ticket {
  constructor(
    public readonly id: string,
    public readonly plate: string,
    public readonly spotId: string,
    public readonly entryMs: number,
  ) {}
}

/** Comprobante de salida emitido por la fachada al liberar el vehículo. */
export interface Receipt {
  ticket: Ticket;
  exitMs: number;
  durationMs: number;
  /** Tarifa final en centavos. */
  feeCents: number;
  /** Nombre de la estrategia de precios aplicada. */
  pricing: string;
}
