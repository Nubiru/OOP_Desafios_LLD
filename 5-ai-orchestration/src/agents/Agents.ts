import { Agent } from "./Agent";
import { Task } from "../models/Task";
import { Context } from "../memory/Context";
import { ToolIntent } from "../commands/ToolCommand";

/**
 * Agente de triaje: primer eslabón. Resuelve consultas generales directamente
 * (sin herramientas) y deriva el resto a especialistas.
 */
export class TriageAgent extends Agent {
  constructor() {
    super("Triage", "general");
  }
  canHandle(task: Task): boolean {
    return task.domain === "general";
  }
  plan(_task: Task, _context: Context): ToolIntent | null {
    return null; // responde con su propio conocimiento
  }
}

/** Especialista en facturación: reembolsos (API) y consultas de cuentas (DB). */
export class BillingAgent extends Agent {
  constructor() {
    super("Billing", "billing");
  }
  canHandle(task: Task): boolean {
    return task.domain === "billing";
  }
  plan(task: Task, _context: Context): ToolIntent | null {
    const p = task.payload ?? {};
    if (/refund|reembolso/i.test(task.description)) {
      return { tool: "api", action: "refund", args: { endpoint: "/payments/refund", body: p } };
    }
    return { tool: "database", action: "query", args: { table: "invoices", filter: String(p.customer ?? "*") } };
  }
}

/** Especialista en datos: consultas y borrados (sujetos a guardrails). */
export class DataAgent extends Agent {
  constructor() {
    super("Data", "data");
  }
  canHandle(task: Task): boolean {
    return task.domain === "data";
  }
  plan(task: Task, _context: Context): ToolIntent | null {
    const p = task.payload ?? {};
    if (/delete|eliminar|borrar/i.test(task.description)) {
      return {
        tool: "database",
        action: "delete",
        args: { table: String(p.table ?? "records"), filter: p.filter as string | undefined },
      };
    }
    return { tool: "database", action: "query", args: { table: String(p.table ?? "records"), filter: String(p.filter ?? "*") } };
  }
}

/** Especialista de operaciones: ejecución de código (destructivo). */
export class OpsAgent extends Agent {
  constructor() {
    super("Ops", "ops");
  }
  canHandle(task: Task): boolean {
    return task.domain === "ops";
  }
  plan(task: Task, _context: Context): ToolIntent | null {
    const p = task.payload ?? {};
    return { tool: "code", action: "run", args: { snippet: String(p.snippet ?? "restart_service()") } };
  }
}
