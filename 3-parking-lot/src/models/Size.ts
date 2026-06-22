/**
 * Tamaños de vehículo y de plaza. El valor ordinal codifica el orden físico
 * (pequeño < mediano < grande) y habilita la regla de compatibilidad.
 */
export enum Size {
  SMALL = 0,
  MEDIUM = 1,
  LARGE = 2,
}

export const ALL_SIZES: readonly Size[] = [Size.SMALL, Size.MEDIUM, Size.LARGE];

/**
 * Compatibilidad unidireccional: un vehículo entra en una plaza de su tamaño o
 * mayor. Una motocicleta (SMALL) cabe en cualquier plaza; un camión (LARGE) solo
 * en una plaza LARGE.
 */
export function fitsIn(vehicleSize: Size, spotSize: Size): boolean {
  return spotSize >= vehicleSize;
}

export function sizeName(size: Size): string {
  return Size[size];
}
