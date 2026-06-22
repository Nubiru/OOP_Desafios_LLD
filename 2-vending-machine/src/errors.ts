/**
 * Error de dominio de la máquina expendedora.
 *
 * Toda operación ilegal (orden de estados inválido, sin stock, sin cambio,
 * máquina ocupada, etc.) se señaliza con esta excepción, manteniendo el sistema
 * en un estado coherente.
 */
export class VendingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VendingError";
  }
}
