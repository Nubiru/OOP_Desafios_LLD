import { PaymentStrategy } from "./PaymentStrategy";
import { CashPayment } from "./CashPayment";
import { CardPayment } from "./CardPayment";

export type PaymentMethod = "cash" | "card";

/** Crea la estrategia de pago según el método elegido por el usuario. */
export function createPayment(method: PaymentMethod): PaymentStrategy {
  switch (method) {
    case "cash":
      return new CashPayment();
    case "card":
      return new CardPayment();
    default: {
      const _exhaustive: never = method;
      throw new Error(`Método de pago no soportado: ${_exhaustive}`);
    }
  }
}
