import { Task } from "../models/Task";
import { Context } from "../memory/Context";
import { Agent } from "../agents/Agent";
import { ToolInvoker } from "../tools/ToolInvoker";
import { ApprovalGate } from "../guardrails/ApprovalGate";
import { ToolCommand, ToolIntent } from "../commands/ToolCommand";
import { RunState } from "./RunState";
import { PlanningState } from "./RunStates";

export type RunStatus = "RUNNING" | "COMPLETED" | "FAILED";

/**
 * Run — CONTEXTO del patrón State. Representa la ejecución de UNA tarea por el
 * agente que la aceptó, integrando los tres patrones:
 *  - STATE: su ciclo de vida (PLANNING/ACTING/...).
 *  - COMMAND: la intención se materializa y se invoca vía ToolInvoker.
 *  - (la cadena que lo creó usó CHAIN OF RESPONSIBILITY para elegir al agente).
 */
export class Run {
  private state: RunState = new PlanningState();
  intent: ToolIntent | null = null;
  command: ToolCommand | null = null;
  output = "";
  status: RunStatus = "RUNNING";

  constructor(
    public readonly task: Task,
    public readonly agent: Agent,
    public readonly context: Context,
    public readonly invoker: ToolInvoker,
    public readonly approval: ApprovalGate,
  ) {}

  step(): void {
    this.state.step(this);
  }

  get stateName(): string {
    return this.state.name;
  }

  get done(): boolean {
    return this.status !== "RUNNING";
  }

  // --- Mutadores usados por los estados --------------------------------------

  setState(state: RunState): void {
    this.context.log(`[${this.task.id}] estado: ${this.state.name} -> ${state.name}`);
    this.state = state;
  }

  setIntent(intent: ToolIntent): void {
    this.intent = intent;
  }

  setCommand(command: ToolCommand): void {
    this.command = command;
  }
}
