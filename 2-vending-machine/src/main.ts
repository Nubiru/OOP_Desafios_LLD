import { VendingMachine } from "./VendingMachine";
import { Product } from "./models/Product";
import { format } from "./models/Money";
import { VendingError } from "./errors";

/** Configura una máquina con catálogo y caja inicial. */
function setup(): VendingMachine {
  VendingMachine.reset();
  const machine = VendingMachine.getInstance();

  machine.addProduct(new Product("A1", "Agua", 75), 3);
  machine.addProduct(new Product("A2", "Gaseosa", 150), 2);
  machine.addProduct(new Product("A3", "Chocolate", 125), 1);
  machine.addProduct(new Product("A4", "Chicle", 30), 0); // agotado

  // Caja inicial para poder dar cambio.
  machine.loadBank(100, 5);
  machine.loadBank(25, 5);
  machine.loadBank(10, 5);
  machine.loadBank(5, 5);

  return machine;
}

function attempt(label: string, fn: () => void): void {
  try {
    fn();
    console.log(`✔ ${label}`);
  } catch (err) {
    const msg = err instanceof VendingError ? err.message : String(err);
    console.log(`✖ ${label} -> ${msg}`);
  }
}

const machine = setup();
console.log("=== Maquina expendedora (patron State + Singleton + Strategy) ===\n");

// 1) Compra en efectivo con cambio
console.log("-- Compra A2 ($1.50) pagando $2.00 en efectivo --");
machine.selectProduct("A2", "cash");
console.log("  estado:", machine.currentState);
machine.insertMoney(100);
machine.insertMoney(100); // alcanza el umbral -> dispensa automaticamente
{
  const r = machine.lastDispense!;
  console.log(
    `  entregado: ${r.product.name} | pago: ${format(r.paid)} | cambio: ${format(
      r.changeTotal,
    )} ${JSON.stringify(r.change)}`,
  );
  console.log("  estado:", machine.currentState, "\n");
}

// 2) Pago con tarjeta (sin cambio)
console.log("-- Compra A1 ($0.75) con tarjeta --");
machine.selectProduct("A1", "card");
machine.insertMoney(75); // un tap por el importe exacto
console.log(
  `  entregado: ${machine.lastDispense!.product.name} | cambio: ${format(
    machine.lastDispense!.changeTotal,
  )}\n`,
);

// 3) Cancelacion con reembolso
console.log("-- Selecciona A3, inserta $1.00 y cancela --");
machine.selectProduct("A3", "cash");
machine.insertMoney(100);
machine.cancel();
console.log("  cancelado: reembolso entregado, estado:", machine.currentState, "\n");

// 4) Errores de uso (orden ilegal, agotado, sin cambio)
console.log("-- Operaciones invalidas --");
attempt("insertar dinero sin seleccionar", () => machine.insertMoney(100));
attempt("seleccionar producto agotado (A4)", () => machine.selectProduct("A4"));
attempt("seleccionar producto inexistente (Z9)", () => machine.selectProduct("Z9"));

// 5) Sin cambio disponible -> reembolso total
console.log("\n-- Sin cambio: vaciar caja y pagar A1 ($0.75) con $1.00 --");
machine.collectFunds(); // admin extrae todo
attempt("comprar A1 sin cambio en caja", () => {
  machine.selectProduct("A1", "cash");
  machine.insertMoney(100); // intenta dispensar; no hay 25 de vuelto
});
console.log("  estado tras reembolso:", machine.currentState);
console.log("  stock A1 (no debe descontarse):", machine.inventory.quantityOf("A1"));

// 6) Admin
console.log("\n-- Administracion --");
machine.restock("A4", 4);
console.log("  A4 reabastecido ->", machine.inventory.quantityOf("A4"), "unidades");
console.log("  total en caja:", format(machine.bankTotal()));
