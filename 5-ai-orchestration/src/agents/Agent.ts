import { Task } from "../models/Task";
import { Context } from "../memory/Context";
import { ToolIntent } from "../commands/ToolCommand";

/**
 * Patrón CHAIN OF RESPONSIBILITY — base de los agentes (Handoff).
 *
 * Cada agente evalúa si puede resolver la tarea según sus capacidades. Si puede,
 * asume la responsabilidad; si no, deriva (handoff) la consulta al siguiente
 * agente de mayor especialización. Si nadie puede, la cadena devuelve null
 * (escalamiento).
 */
export abstract class Agent {
  private next: Agent | null = null;

  constructor(
    public readonly name: string,
    public readonly domain: string,
  ) {}

  /** Encadena el siguiente eslabón y lo devuelve (para encadenar con fluidez). */
  setNext(agent: Agent): Agent {
    this.next = agent;
    return agent;
  }

  /** Recorre la cadena y devuelve el agente que acepta la tarea (o null). */
  route(task: Task, context: Context): Agent | null {
    if (this.canHandle(task)) {
      context.log(`[handoff] ${this.name} ACEPTA la tarea ${task.id}`);
      return this;
    }
    context.log(`[handoff] ${this.name} deriva la tarea ${task.id}`);
    return this.next ? this.next.route(task, context) : null;
  }

  abstract canHandle(task: Task): boolean;

  /**
   * Planifica la intención de herramienta para la tarea, o null si el agente la
   * resuelve directamente (sin tocar herramientas externas).
   */
  abstract plan(task: Task, context: Context): ToolIntent | null;
}
