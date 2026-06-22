/**
 * Patrón STRATEGY — motor de precios intercambiable.
 *
 * Las reglas de facturación son notoriamente volátiles (tarifas escalonadas,
 * descuentos, surge pricing). Segregar el cálculo en estrategias permite migrar
 * dinámicamente sin refactorizar las rutas de salida de los clientes (OCP).
 */
export interface PricingStrategy {
  readonly name: string;
  /** Calcula la tarifa (en centavos) a partir de las marcas de tiempo (ms). */
  computeFee(entryMs: number, exitMs: number): number;
}

export const HOUR_MS = 3_600_000;

/** Horas de estadía redondeadas hacia arriba por fracción, con mínimo de 1. */
export function billableHours(entryMs: number, exitMs: number): number {
  const elapsed = Math.max(0, exitMs - entryMs);
  return Math.max(1, Math.ceil(elapsed / HOUR_MS));
}
