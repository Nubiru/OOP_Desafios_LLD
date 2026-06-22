import { CoinBank } from "../models/CoinBank";
import { sum } from "../models/Money";
import { PaymentStrategy } from "./PaymentStrategy";

/**
 * Pago en EFECTIVO: acumula las monedas/billetes insertados y, al liquidar,
 * deposita esos fondos en la caja y retira el cambio exacto.
 */
export class CashPayment implements PaymentStrategy {
  readonly method = "efectivo";
  private coins: number[] = [];

  insert(amountCents: number): void {
    this.coins.push(amountCents);
  }

  inserted(): number {
    return sum(this.coins);
  }

  settle(priceCents: number, bank: CoinBank): number[] | null {
    // Los fondos insertados entran a la caja y quedan disponibles para el cambio.
    bank.deposit(this.coins);
    const change = bank.makeChange(this.inserted() - priceCents);
    if (change === null) {
      bank.remove(this.coins); // rollback: la venta no procede
      return null;
    }
    return change;
  }

  refund(): number[] {
    // Los fondos nunca se depositaron: se devuelven tal cual.
    return [...this.coins];
  }
}
