/**
 * Memoria/estado GLOBAL compartido del ecosistema (un "blackboard").
 *
 * Un flujo agentic nunca puede ser amnésico: conserva la semántica del problema,
 * serializa los pasos/observaciones y mantiene una traza auditable. Esa traza es
 * la que habilita trazabilidad, rebobinado y reejecución de flujos defectuosos.
 */
export class Context {
  private readonly store = new Map<string, unknown>();
  /** Bitácora cronológica e inmutable hacia afuera (auditoría/replay). */
  private readonly entries: string[] = [];

  log(entry: string): void {
    this.entries.push(entry);
  }

  get trace(): readonly string[] {
    return this.entries;
  }

  set(key: string, value: unknown): void {
    this.store.set(key, value);
  }

  get<T = unknown>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }
}
