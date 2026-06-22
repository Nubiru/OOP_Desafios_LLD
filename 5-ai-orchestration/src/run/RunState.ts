import type { Run } from "./Run";

/**
 * Patrón STATE — contrato del ciclo de vida de una ejecución (Run).
 *
 * El "pensamiento → acción" del agente se modela como una máquina de estados
 * auditable (PLANNING → ACTING → AWAITING_APPROVAL → COMPLETED | FAILED). Esto
 * blinda la orquestación y habilita trazabilidad y reejecución de flujos.
 */
export interface RunState {
  readonly name: string;
  /** Avanza la ejecución un paso, mutando el Run y/o transicionando de estado. */
  step(run: Run): void;
}
