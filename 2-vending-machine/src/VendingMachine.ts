import { Inventory } from "./models/Inventory";
import { CoinBank } from "./models/CoinBank";
import { Product } from "./models/Product";
import { format, sum } from "./models/Money";
import { TransactionLock } from "./TransactionLock";
import { VendingError } from "./errors";

import { VendingState } from "./states/VendingState";
import { IdleState } from "./states/IdleState";
import { HasMoneyState } from "./states/HasMoneyState";
import { DispenseState } from "./states/DispenseState";

import { PaymentStrategy } from "./payment/PaymentStrategy";
import { createPayment, PaymentMethod } from "./payment/PaymentFactory";

/** Resultado de una venta concretada. */
export interface DispenseResult {
  product: Product;
  /** Denominaciones devueltas como cambio (centavos). */
  change: number[];
  changeTotal: number;
  /** Total pagado por el usuario (centavos). */
  paid: number;
}

/**
 * VendingMachine — CONTEXTO del patrón State y SINGLETON del sistema.
 *
 * El hardware es un recurso singular: el patrón Singleton asegura un único punto
 * de acceso global, evitando controladores paralelos con estados contradictorios.
 *
 * La máquina delega TODO comportamiento al estado actual (State). Los métodos
 * `beginTransaction`/`addFunds`/`executeDispense`/`cancelTransaction` son la
 * API interna que invocan los estados; la API pública (`selectProduct`,
 * `insertMoney`, `dispense`, `cancel`) solo reenvía al estado vigente.
 */
export class VendingMachine {
  private static instance: VendingMachine | null = null;

  readonly inventory = new Inventory();
  readonly bank = new CoinBank();
  private readonly lock = new TransactionLock();

  private readonly idleState: VendingState;
  private readonly hasMoneyState: VendingState;
  private readonly dispenseState: VendingState;
  private state: VendingState;

  private selectedCode: string | null = null;
  private payment: PaymentStrategy | null = null;
  private lastResult: DispenseResult | null = null;

  private constructor() {
    this.idleState = new IdleState(this);
    this.hasMoneyState = new HasMoneyState(this);
    this.dispenseState = new DispenseState();
    this.state = this.idleState;
  }

  static getInstance(): VendingMachine {
    if (!this.instance) this.instance = new VendingMachine();
    return this.instance;
  }

  /** Reinicia el Singleton (uso exclusivo de pruebas). */
  static reset(): void {
    this.instance = null;
  }

  // ---------------------------------------------------------------------------
  // API pública (reenvía al estado actual)
  // ---------------------------------------------------------------------------

  selectProduct(code: string, method: PaymentMethod = "cash"): void {
    this.state.selectProduct(code, method);
  }

  insertMoney(amountCents: number): void {
    this.state.insertMoney(amountCents);
  }

  dispense(): void {
    this.state.dispense();
  }

  cancel(): void {
    this.state.cancel();
  }

  // ---------------------------------------------------------------------------
  // API interna usada por los estados
  // ---------------------------------------------------------------------------

  beginTransaction(code: string, method: PaymentMethod): void {
    this.lock.acquire(); // una transacción a la vez
    try {
      if (!this.inventory.isAvailable(code)) {
        throw new VendingError(`Producto agotado o inexistente: ${code}.`);
      }
    } catch (err) {
      this.lock.release();
      throw err;
    }
    this.selectedCode = code;
    this.payment = createPayment(method);
    this.transitionTo(this.hasMoneyState);
  }

  addFunds(amountCents: number): void {
    if (!this.payment) throw new VendingError("Estado inválido: sin pago activo.");
    this.payment.insert(amountCents);
    if (this.payment.inserted() >= this.currentPrice()) {
      this.executeDispense(); // umbral alcanzado: dispensa automáticamente
    }
  }

  /** Lógica de negocio ATÓMICA de la dispensación. */
  executeDispense(): DispenseResult {
    this.transitionTo(this.dispenseState); // suprime entradas durante la entrega
    const code = this.selectedCode;
    const payment = this.payment;
    if (!code || !payment) throw new VendingError("Estado inválido para dispensar.");

    const product = this.inventory.get(code);
    const change = payment.settle(product.priceCents, this.bank);

    if (change === null) {
      // No se puede dar cambio exacto: reembolso íntegro, no se entrega el producto.
      const refunded = payment.refund();
      this.resetToIdle();
      throw new VendingError(
        `No hay cambio exacto disponible. Reembolso de ${format(sum(refunded))}.`,
      );
    }

    this.inventory.decrement(code);
    const result: DispenseResult = {
      product,
      change,
      changeTotal: sum(change),
      paid: payment.inserted(),
    };
    this.lastResult = result;
    this.resetToIdle();
    return result;
  }

  cancelTransaction(): number[] {
    const refunded = this.payment ? this.payment.refund() : [];
    this.resetToIdle();
    return refunded;
  }

  // ---------------------------------------------------------------------------
  // Interfaz de administrador
  // ---------------------------------------------------------------------------

  addProduct(product: Product, quantity: number): void {
    this.inventory.add(product, quantity);
  }

  restock(code: string, quantity: number): void {
    this.inventory.restock(code, quantity);
  }

  loadBank(denomination: number, quantity: number): void {
    this.bank.load(denomination, quantity);
  }

  collectFunds(): number {
    if (this.lock.isLocked) {
      throw new VendingError("No se pueden extraer fondos durante una transacción.");
    }
    return this.bank.collectAll();
  }

  // ---------------------------------------------------------------------------
  // Observación / consultas
  // ---------------------------------------------------------------------------

  get currentState(): string {
    return this.state.name;
  }

  get lastDispense(): DispenseResult | null {
    return this.lastResult;
  }

  balance(): number {
    return this.payment?.inserted() ?? 0;
  }

  currentPrice(): number {
    if (!this.selectedCode) throw new VendingError("No hay producto seleccionado.");
    return this.inventory.get(this.selectedCode).priceCents;
  }

  bankTotal(): number {
    return this.bank.total();
  }

  // ---------------------------------------------------------------------------
  // Transiciones internas
  // ---------------------------------------------------------------------------

  private transitionTo(state: VendingState): void {
    this.state = state;
  }

  private resetToIdle(): void {
    this.selectedCode = null;
    this.payment = null;
    this.transitionTo(this.idleState);
    this.lock.release();
  }
}
