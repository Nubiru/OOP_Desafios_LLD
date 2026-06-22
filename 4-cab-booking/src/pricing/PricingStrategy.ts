/**
 * Patrón STRATEGY — motor de tarifas intercambiable.
 *
 * Los vectores de costo mutan por demanda zonal (surge), viajes compartidos o
 * tipo de vehículo. Encapsular el cálculo en estrategias permite aplicar la
 * política adecuada al contexto sin tocar el resto del sistema (OCP).
 */
export interface PricingStrategy {
  readonly name: string;
  /** Tarifa final en centavos a partir de la distancia (km) y la duración (min). */
  computeFare(distanceKm: number, durationMin: number): number;
}
