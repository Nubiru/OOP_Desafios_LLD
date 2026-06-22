import { VendingError } from "./errors";

/**
 * Bloqueo transaccional (mutex lógico).
 *
 * Garantiza que se procese estrictamente UNA transacción a la vez. Aunque Node
 * es de un solo hilo, este bloqueo modela explícitamente la prevención de
 * condiciones de carrera: si dos flujos intentan iniciar una compra a la vez,
 * el segundo es rechazado en lugar de corromper el estado compartido.
 */
export class TransactionLock {
  private locked = false;

  acquire(): void {
    if (this.locked) {
      throw new VendingError("Máquina ocupada: hay una transacción en curso.");
    }
    this.locked = true;
  }

  release(): void {
    this.locked = false;
  }

  get isLocked(): boolean {
    return this.locked;
  }
}
