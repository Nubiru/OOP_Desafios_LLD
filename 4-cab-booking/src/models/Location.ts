/**
 * Coordenadas en un plano 2D (unidades ~ kilómetros). Es una simplificación de
 * lat/lng suficiente para modelar proximidad, ETA e indexación geoespacial.
 */
export interface Coordinates {
  x: number;
  y: number;
}

/** Velocidad media asumida para estimar tiempos de llegada (km/h). */
export const AVG_SPEED_KMH = 30;

/** Distancia euclidiana entre dos puntos (km). */
export function distance(a: Coordinates, b: Coordinates): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Tiempo estimado de llegada entre dos puntos (minutos). */
export function etaMinutes(a: Coordinates, b: Coordinates): number {
  return (distance(a, b) / AVG_SPEED_KMH) * 60;
}
