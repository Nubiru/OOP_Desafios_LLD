import { VendingState } from "./VendingState";
import { VendingError } from "../errors";
import { format } from "../models/Money";
import type { VendingMachine } from "../VendingMachine";

/**
 * Estado CON DINERO / LISTO. Un producto fue retenido lógicamente.
 *
 * Acumula y valida los pagos secuenciales. Cuando el saldo alcanza o supera el
 * precio, transiciona automáticamente a la dispensación. Permite cancelar,
 * orquestando la devolución del dinero.
 */
export class HasMoneyState implements VendingState {
  readonly name = "HAS_MONEY";

  constructor(private readonly machine: VendingMachine) {}

  selectProduct(): void {
    throw new VendingError("Ya hay un producto seleccionado. Cancele para cambiarlo.");
  }

  insertMoney(amountCents: number): void {
    this.machine.addFunds(amountCents);
  }

  dispense(): void {
    const price = this.machine.currentPrice();
    const balance = this.machine.balance();
    if (balance < price) {
      throw new VendingError(`Fondos insuficientes: faltan ${format(price - balance)}.`);
    }
    this.machine.executeDispense();
  }

  cancel(): void {
    this.machine.cancelTransaction();
  }
}
