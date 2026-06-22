import { Product } from "./Product";
import { VendingError } from "../errors";

interface Slot {
  product: Product;
  quantity: number;
}

/**
 * Inventario de productos, indexado por código para búsquedas O(1).
 *
 * (En un entorno multihilo real se emplearía una estructura concurrente —
 *  ConcurrentHashMap — para tolerar auditorías/reabastecimientos simultáneos.
 *  En Node, de un solo hilo, la atomicidad se garantiza vía el bloqueo
 *  transaccional de la máquina; ver TransactionLock.)
 */
export class Inventory {
  private readonly slots = new Map<string, Slot>();

  add(product: Product, quantity: number): void {
    const existing = this.slots.get(product.code);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.slots.set(product.code, { product, quantity });
    }
  }

  get(code: string): Product {
    const slot = this.slots.get(code);
    if (!slot) throw new VendingError(`Producto inexistente: ${code}`);
    return slot.product;
  }

  isAvailable(code: string): boolean {
    const slot = this.slots.get(code);
    return !!slot && slot.quantity > 0;
  }

  quantityOf(code: string): number {
    return this.slots.get(code)?.quantity ?? 0;
  }

  /** Descuenta una unidad. Lanza si no hay stock (no debería ocurrir tras validar). */
  decrement(code: string): void {
    const slot = this.slots.get(code);
    if (!slot || slot.quantity <= 0) {
      throw new VendingError(`Sin stock: ${code}`);
    }
    slot.quantity -= 1;
  }

  /** Interfaz de administrador: reabastecer. */
  restock(code: string, quantity: number): void {
    const slot = this.slots.get(code);
    if (!slot) throw new VendingError(`Producto inexistente: ${code}`);
    slot.quantity += quantity;
  }

  list(): ReadonlyArray<Readonly<Slot>> {
    return [...this.slots.values()];
  }
}
