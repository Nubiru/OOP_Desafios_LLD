import { ToolCommand } from "../commands/ToolCommand";
import { Task } from "../models/Task";

/** Decisor humano (Human-in-the-Loop): aprueba o deniega una acción sensible. */
export type ApprovalDecider = (command: ToolCommand, task: Task) => boolean;

/**
 * Compuerta de aprobación Human-in-the-Loop.
 *
 * Cuando el guardrail exige supervisión, el flujo se transfiere a un operador
 * humano que dictamina la acción. El decisor es inyectable para poder simular
 * distintas políticas (y para las pruebas).
 */
export class ApprovalGate {
  constructor(private readonly decider: ApprovalDecider) {}

  decide(command: ToolCommand, task: Task): boolean {
    return this.decider(command, task);
  }

  /** Operador que aprueba todo (entornos de baja criticidad / pruebas). */
  static autoApprove(): ApprovalGate {
    return new ApprovalGate(() => true);
  }

  /** Operador que deniega todo (default seguro ante la duda). */
  static autoDeny(): ApprovalGate {
    return new ApprovalGate(() => false);
  }
}
