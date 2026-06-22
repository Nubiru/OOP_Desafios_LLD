import { VendingState } from "./VendingState";
import { VendingError } from "../errors";

/**
 * Estado DISPENSANDO: fase transitoria crítica.
 *
 * Las entradas físicas del usuario quedan temporalmente suprimidas para impedir
 * dobles dispensaciones o cancelaciones tardías. La lógica atómica de entrega la
 * ejecuta la máquina (executeDispense) durante la transición; al concluir, el
 * contexto vuelve a IDLE.
 */
export class DispenseState implements VendingState {
  readonly name = "DISPENSING";

  private static busy(): never {
    throw new VendingError("Dispensando, espere por favor.");
  }

  selectProduct(): void {
    DispenseState.busy();
  }

  insertMoney(): void {
    DispenseState.busy();
  }

  dispense(): void {
    DispenseState.busy();
  }

  cancel(): void {
    DispenseState.busy();
  }
}
