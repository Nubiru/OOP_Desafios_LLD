import { CoinBank } from "../models/CoinBank";
import { PaymentStrategy } from "./PaymentStrategy";

/**
 * Pago con TARJETA / contactless: cargo electrónico por el monto exacto.
 *
 * Demuestra la extensibilidad del patrón Strategy: se agregó sin tocar la
 * máquina de estados. Nunca genera cambio físico (cobra el importe justo) y no
 * afecta la caja de monedas.
 */
export class CardPayment implements PaymentStrategy {
  readonly method = "tarjeta";
  private charged = 0;

  insert(amountCents: number): void {
    this.charged += amountCents;
  }

  inserted(): number {
    return this.charged;
  }

  settle(_priceCents: number, _bank: CoinBank): number[] | null {
    // Cobro electrónico exacto: sin cambio, sin depósito de monedas.
    return [];
  }

  refund(): number[] {
    // Reversión de la autorización: nada físico que devolver.
    this.charged = 0;
    return [];
  }
}
