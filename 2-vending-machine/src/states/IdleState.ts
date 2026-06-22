import { VendingState } from "./VendingState";
import { VendingError } from "../errors";
import type { VendingMachine } from "../VendingMachine";
import type { PaymentMethod } from "../payment/PaymentFactory";

/**
 * Estado INACTIVO (predeterminado). Aguarda la interacción inicial.
 *
 * Solo permite seleccionar un producto. Cualquier intento prematuro de insertar
 * fondos, cancelar o dispensar es bloqueado.
 */
export class IdleState implements VendingState {
  readonly name = "IDLE";

  constructor(private readonly machine: VendingMachine) {}

  selectProduct(code: string, method: PaymentMethod): void {
    this.machine.beginTransaction(code, method);
  }

  insertMoney(): void {
    throw new VendingError("Seleccione un producto antes de insertar dinero.");
  }

  dispense(): void {
    throw new VendingError("Seleccione y pague un producto primero.");
  }

  cancel(): void {
    throw new VendingError("No hay ninguna transacción para cancelar.");
  }
}
