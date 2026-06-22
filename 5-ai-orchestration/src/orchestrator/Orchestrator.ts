import { Task } from "../models/Task";
import { Context } from "../memory/Context";
import { Agent } from "../agents/Agent";
import { ToolInvoker } from "../tools/ToolInvoker";
import { ApprovalGate } from "../guardrails/ApprovalGate";
import { Run } from "../run/Run";

export interface RunOutcome {
  taskId: string;
  agent: string | null;
  status: "COMPLETED" | "FAILED";
  output: string;
}

/** Cota dura de pasos por ejecución (evita bucles agentic descontrolados). */
const MAX_STEPS = 16;

/**
 * Orquestador del ecosistema multiagente.
 *
 * Integra los patrones: usa la CHAIN OF RESPONSIBILITY para elegir al agente
 * (Handoff), crea un Run (máquina de STATE) y lo conduce paso a paso hasta un
 * estado terminal, mientras el COMMAND + guardrails median cada herramienta.
 */
export class Orchestrator {
  constructor(
    private readonly chainHead: Agent,
    private readonly invoker: ToolInvoker,
    private readonly approval: ApprovalGate,
  ) {}

  dispatch(task: Task, context: Context): RunOutcome {
    const agent = this.chainHead.route(task, context);
    if (!agent) {
      context.log(`[${task.id}] sin agente capaz: escalado a un humano`);
      return { taskId: task.id, agent: null, status: "FAILED", output: "Sin agente capaz (escalado)" };
    }

    const run = new Run(task, agent, context, this.invoker, this.approval);
    let steps = 0;
    while (!run.done && steps++ < MAX_STEPS) {
      run.step();
    }
    if (!run.done) {
      return { taskId: task.id, agent: agent.name, status: "FAILED", output: "Excedido el limite de pasos" };
    }

    return {
      taskId: task.id,
      agent: agent.name,
      status: run.status === "COMPLETED" ? "COMPLETED" : "FAILED",
      output: run.output,
    };
  }

  /**
   * Orquestación SECUENCIAL: procesa una lista de tareas compartiendo el mismo
   * contexto (la salida de cada paso queda disponible para el siguiente).
   */
  dispatchSequential(tasks: Task[], context: Context): RunOutcome[] {
    return tasks.map((task) => this.dispatch(task, context));
  }
}
