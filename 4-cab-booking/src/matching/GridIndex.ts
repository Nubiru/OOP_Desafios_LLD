import { Coordinates } from "../models/Location";
import { Driver } from "../models/Driver";

/**
 * Índice geoespacial por cuadrículas (geo-grid).
 *
 * Buscar los conductores cercanos analizando TODO el registro es inviable a
 * escala. La grilla sectoriza el área en celdas; cada conductor se ubica en una
 * celda según su posición. Buscar candidatos cercanos pasa a inspeccionar solo
 * las celdas del entorno, en lugar de O(n) sobre toda la flota.
 */
export class GridIndex {
  private readonly cells = new Map<string, Set<Driver>>();
  private readonly driverCell = new Map<string, string>();

  constructor(private readonly cellSize: number = 2) {}

  private keyOf(loc: Coordinates): string {
    return `${Math.floor(loc.x / this.cellSize)},${Math.floor(loc.y / this.cellSize)}`;
  }

  private bucket(key: string): Set<Driver> {
    let set = this.cells.get(key);
    if (!set) {
      set = new Set();
      this.cells.set(key, set);
    }
    return set;
  }

  add(driver: Driver): void {
    const key = this.keyOf(driver.location);
    this.bucket(key).add(driver);
    this.driverCell.set(driver.id, key);
  }

  /** Reubica al conductor si cambió de celda tras moverse. */
  update(driver: Driver): void {
    const newKey = this.keyOf(driver.location);
    const oldKey = this.driverCell.get(driver.id);
    if (oldKey === newKey) return;
    if (oldKey) this.cells.get(oldKey)?.delete(driver);
    this.bucket(newKey).add(driver);
    this.driverCell.set(driver.id, newKey);
  }

  remove(driver: Driver): void {
    const key = this.driverCell.get(driver.id);
    if (key) this.cells.get(key)?.delete(driver);
    this.driverCell.delete(driver.id);
  }

  /**
   * Conductores en las celdas dentro de `ring` celdas (radio Chebyshev) del
   * punto dado, incluyendo su propia celda.
   */
  nearby(loc: Coordinates, ring: number): Driver[] {
    const cx = Math.floor(loc.x / this.cellSize);
    const cy = Math.floor(loc.y / this.cellSize);
    const found: Driver[] = [];
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dy = -ring; dy <= ring; dy++) {
        const set = this.cells.get(`${cx + dx},${cy + dy}`);
        if (set) found.push(...set);
      }
    }
    return found;
  }
}
