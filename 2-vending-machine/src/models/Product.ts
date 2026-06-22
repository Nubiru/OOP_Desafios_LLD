/** Entidad de datos: un producto del catálogo. */
export class Product {
  constructor(
    public readonly code: string,
    public readonly name: string,
    /** Precio en centavos. */
    public readonly priceCents: number,
  ) {}
}
