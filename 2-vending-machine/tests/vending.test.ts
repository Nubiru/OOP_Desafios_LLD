import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { VendingMachine } from "../src/VendingMachine";
import { Product } from "../src/models/Product";
import { VendingError } from "../src/errors";
import { sum } from "../src/models/Money";

/** Máquina fresca con catálogo y caja para cada prueba. */
function freshMachine(): VendingMachine {
  VendingMachine.reset();
  const m = VendingMachine.getInstance();
  m.addProduct(new Product("A1", "Agua", 75), 2);
  m.addProduct(new Product("A2", "Gaseosa", 150), 1);
  m.addProduct(new Product("A4", "Chicle", 30), 0); // agotado
  m.loadBank(100, 5);
  m.loadBank(25, 5);
  m.loadBank(10, 5);
  m.loadBank(5, 5);
  return m;
}

let m: VendingMachine;
beforeEach(() => {
  m = freshMachine();
});

test("Singleton: getInstance siempre devuelve la misma instancia", () => {
  assert.equal(VendingMachine.getInstance(), VendingMachine.getInstance());
});

test("compra en efectivo con cambio exacto: entrega producto y vuelto", () => {
  m.selectProduct("A2", "cash"); // $1.50
  assert.equal(m.currentState, "HAS_MONEY");
  m.insertMoney(100);
  m.insertMoney(100); // $2.00 -> dispensa automáticamente

  const r = m.lastDispense!;
  assert.equal(r.product.code, "A2");
  assert.equal(r.changeTotal, 50); // $0.50 de vuelto
  assert.equal(sum(r.change), 50);
  assert.equal(m.currentState, "IDLE");
  assert.equal(m.inventory.quantityOf("A2"), 0); // descontado
});

test("pago con tarjeta: cobro exacto, sin cambio", () => {
  m.selectProduct("A1", "card"); // $0.75
  m.insertMoney(75);
  const r = m.lastDispense!;
  assert.equal(r.product.code, "A1");
  assert.equal(r.changeTotal, 0);
  assert.equal(m.inventory.quantityOf("A1"), 1);
});

test("dispensación explícita tras alcanzar el monto", () => {
  m.selectProduct("A1", "cash"); // $0.75
  m.insertMoney(25);
  m.insertMoney(25);
  m.insertMoney(25); // exacto $0.75 -> auto-dispensa
  assert.equal(m.lastDispense!.product.code, "A1");
  assert.equal(m.currentState, "IDLE");
});

test("producto agotado: no se puede seleccionar", () => {
  assert.throws(() => m.selectProduct("A4"), VendingError);
  assert.equal(m.currentState, "IDLE");
});

test("producto inexistente: error", () => {
  assert.throws(() => m.selectProduct("Z9"), VendingError);
});

test("orden ilegal: insertar dinero en IDLE está bloqueado", () => {
  assert.throws(() => m.insertMoney(100), VendingError);
});

test("orden ilegal: re-seleccionar con transacción activa", () => {
  m.selectProduct("A1", "cash");
  assert.throws(() => m.selectProduct("A2"), VendingError);
});

test("fondos insuficientes: dispense explícito falla con mensaje", () => {
  m.selectProduct("A2", "cash"); // $1.50
  m.insertMoney(100); // $1.00
  assert.throws(() => m.dispense(), /insuficientes/i);
  assert.equal(m.currentState, "HAS_MONEY"); // sigue esperando
});

test("cancelación: reembolso íntegro y vuelta a IDLE", () => {
  m.selectProduct("A2", "cash");
  m.insertMoney(100);
  m.cancel();
  assert.equal(m.currentState, "IDLE");
  assert.equal(m.inventory.quantityOf("A2"), 1); // no se vendió
});

test("atomicidad: sin cambio disponible -> reembolso total, sin descuento de stock", () => {
  m.collectFunds(); // vacía la caja: no hay con qué dar vuelto
  m.selectProduct("A1", "cash"); // $0.75
  // pagar $1.00 requiere $0.25 de vuelto, imposible con caja vacía
  assert.throws(() => m.insertMoney(100), /cambio exacto/i);
  assert.equal(m.currentState, "IDLE");
  assert.equal(m.inventory.quantityOf("A1"), 2); // intacto
});

test("concurrencia: el bloqueo rechaza una segunda transacción simultánea", () => {
  m.selectProduct("A1", "cash"); // flujo 1 adquiere el lock transaccional
  // Un segundo flujo concurrente intenta iniciar otra transacción golpeando
  // directamente el punto de entrada: el TransactionLock lo rechaza.
  assert.throws(() => m.beginTransaction("A2", "cash"), /ocupada/i);
  // El estado del flujo 1 permanece intacto.
  assert.equal(m.currentState, "HAS_MONEY");
});

test("admin: restock incrementa stock; collectFunds vacía la caja", () => {
  m.restock("A4", 3);
  assert.equal(m.inventory.quantityOf("A4"), 3);
  const before = m.bankTotal();
  assert.ok(before > 0);
  const collected = m.collectFunds();
  assert.equal(collected, before);
  assert.equal(m.bankTotal(), 0);
});

test("la caja se actualiza correctamente tras una venta con cambio", () => {
  const before = m.bankTotal();
  m.selectProduct("A2", "cash"); // $1.50
  m.insertMoney(100);
  m.insertMoney(100); // paga $2.00, vuelto $0.50
  // la caja gana $2.00 y entrega $0.50 -> neto +$1.50
  assert.equal(m.bankTotal(), before + 150);
});
