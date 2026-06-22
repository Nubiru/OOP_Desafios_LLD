/**
 * Todo el dinero se modela en CENTAVOS (enteros) para garantizar precisión
 * impecable y evitar los errores de redondeo de los números de punto flotante.
 */

/** Denominaciones aceptadas por la máquina, en centavos (mayor a menor). */
export const DENOMINATIONS = [1000, 500, 100, 25, 10, 5] as const;

export type Denomination = (typeof DENOMINATIONS)[number];

/** Suma de una lista de denominaciones (centavos). */
export function sum(coins: number[]): number {
  return coins.reduce((acc, c) => acc + c, 0);
}

/** Formatea centavos como "$X.XX" para la consola. */
export function format(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
