import { DENOMINATIONS } from "./Money";

/**
 * Caja de seguridad interna: lleva la cuenta de las monedas/billetes disponibles
 * por denominación, y calcula el cambio exacto.
 *
 * Garantía de atomicidad: `makeChange` planifica primero sobre una copia y solo
 * confirma (commit) si logra el monto exacto; ante imposibilidad NO muta el
 * estado y devuelve `null`. Así, "dar el cambio" nunca deja la caja corrupta.
 */
export class CoinBank {
  private counts = new Map<number, number>();

  constructor(initial: Partial<Record<number, number>> = {}) {
    for (const d of DENOMINATIONS) {
      this.counts.set(d, initial[d] ?? 0);
    }
  }

  load(denomination: number, quantity: number): void {
    this.counts.set(denomination, (this.counts.get(denomination) ?? 0) + quantity);
  }

  /** Ingresa monedas a la caja (al concretarse una venta en efectivo). */
  deposit(coins: number[]): void {
    for (const c of coins) {
      this.counts.set(c, (this.counts.get(c) ?? 0) + 1);
    }
  }

  /** Revierte un depósito (rollback de la atomicidad). */
  remove(coins: number[]): void {
    for (const c of coins) {
      this.counts.set(c, Math.max(0, (this.counts.get(c) ?? 0) - 1));
    }
  }

  count(denomination: number): number {
    return this.counts.get(denomination) ?? 0;
  }

  total(): number {
    let acc = 0;
    for (const d of DENOMINATIONS) acc += d * this.count(d);
    return acc;
  }

  /**
   * Calcula el cambio para `amount` (centavos) usando un algoritmo voraz
   * limitado por el stock disponible de cada denominación.
   *
   * Devuelve la lista de denominaciones a entregar, o `null` si es imposible dar
   * el cambio exacto. (El voraz con stock limitado puede fallar en sets de
   * denominaciones no canónicas; el set por defecto sí es canónico.)
   */
  makeChange(amount: number): number[] | null {
    if (amount < 0) return null;
    if (amount === 0) return [];

    const working = new Map(this.counts);
    const plan: number[] = [];
    let remaining = amount;

    for (const d of DENOMINATIONS) {
      let available = working.get(d) ?? 0;
      while (remaining >= d && available > 0) {
        plan.push(d);
        remaining -= d;
        available -= 1;
      }
      working.set(d, available);
    }

    if (remaining !== 0) return null; // imposible: no se muta nada
    this.counts = working; // commit
    return plan;
  }

  /** Interfaz de administrador: extraer todos los fondos acumulados. */
  collectAll(): number {
    const collected = this.total();
    for (const d of DENOMINATIONS) this.counts.set(d, 0);
    return collected;
  }

  snapshot(): Record<number, number> {
    const snap: Record<number, number> = {};
    for (const d of DENOMINATIONS) snap[d] = this.count(d);
    return snap;
  }

}
