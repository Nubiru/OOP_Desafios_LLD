import { CoinBank } from "../models/CoinBank";

/**
 * Patrón STRATEGY — pasarela de pago intercambiable.
 *
 * Permite integrar nuevos métodos (tarjeta, contactless, billeteras, APIs) SIN
 * modificar la intrincada máquina de estados central: solo se agrega una nueva
 * clase que implemente este contrato (Open/Closed).
 */
export interface PaymentStrategy {
  readonly method: string;

  /** Registra fondos ingresados (centavos). Efectivo: una moneda; tarjeta: un cargo. */
  insert(amountCents: number): void;

  /** Total ingresado/autorizado hasta el momento (centavos). */
  inserted(): number;

  /**
   * Liquida una venta de `priceCents`. Devuelve el cambio físico a entregar
   * (denominaciones), o `null` si es imposible dar cambio exacto.
   * Operación atómica: deposita los fondos y retira el cambio, o no hace nada.
   */
  settle(priceCents: number, bank: CoinBank): number[] | null;

  /** Cancelación: devuelve al usuario los fondos retenidos (sin afectar la caja). */
  refund(): number[];
}
