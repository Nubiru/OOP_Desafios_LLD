import type { PaymentMethod } from "../payment/PaymentFactory";

/**
 * Patrón STATE — contrato de comportamiento de la máquina.
 *
 * Una máquina expendedora es, en esencia, un sistema impulsado por su estado.
 * Cada estado concreto codifica qué operaciones son legales y a qué estado se
 * transiciona, blindando el sistema contra secuencias ilegales (p. ej. dispensar
 * antes de pagar, o cancelar después de entregar). Las operaciones no permitidas
 * lanzan VendingError.
 */
export interface VendingState {
  readonly name: string;

  /** Seleccionar un producto por código (e iniciar la transacción). */
  selectProduct(code: string, method: PaymentMethod): void;

  /** Insertar fondos (centavos). */
  insertMoney(amountCents: number): void;

  /** Solicitar la dispensación explícita. */
  dispense(): void;

  /** Cancelar la transacción en curso y recuperar los fondos. */
  cancel(): void;
}
