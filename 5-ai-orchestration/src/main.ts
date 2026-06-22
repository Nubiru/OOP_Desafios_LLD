import { Context } from "./memory/Context";
import { Guardrail } from "./guardrails/Guardrail";
import { ApprovalGate } from "./guardrails/ApprovalGate";
import { ToolInvoker } from "./tools/ToolInvoker";
import { Orchestrator } from "./orchestrator/Orchestrator";
import { TriageAgent, BillingAgent, DataAgent, OpsAgent } from "./agents/Agents";
import { Task } from "./models/Task";

// Cadena de agentes (Chain of Responsibility): Triage -> Billing -> Data -> Ops.
const triage = new TriageAgent();
triage.setNext(new BillingAgent()).setNext(new DataAgent()).setNext(new OpsAgent());

const invoker = new ToolInvoker(new Guardrail());

function runWith(label: string, approval: ApprovalGate, task: Task): void {
  const context = new Context();
  const orchestrator = new Orchestrator(triage, invoker, approval);
  const outcome = orchestrator.dispatch(task, context);
  console.log(`\n### ${label}`);
  console.log(`  tarea ${outcome.taskId} | agente: ${outcome.agent} | ${outcome.status}`);
  console.log(`  salida: ${outcome.output}`);
  console.log("  traza:");
  for (const line of context.trace) console.log("    -", line);
}

console.log("=== Orquestacion de Agentes IA (Command + State + Chain of Responsibility) ===");

// 1) Consulta general -> Triage la resuelve directamente (sin herramientas).
runWith("Consulta general (Triage, directo)", ApprovalGate.autoDeny(), {
  id: "T1",
  domain: "general",
  description: "Que es SOLID?",
});

// 2) Reembolso -> handoff a Billing -> API segura -> ALLOW.
runWith("Reembolso (handoff a Billing, herramienta segura)", ApprovalGate.autoDeny(), {
  id: "T2",
  domain: "billing",
  description: "Procesar refund al cliente",
  payload: { customer: "C-42", amount: 1500 },
});

// 3) Ejecucion de codigo -> Ops -> DESTRUCTIVE -> Human-in-the-Loop APRUEBA.
runWith("Ejecutar codigo (Ops, requiere aprobacion -> APROBADO)", ApprovalGate.autoApprove(), {
  id: "T3",
  domain: "ops",
  description: "Reiniciar el servicio de cobros",
  payload: { snippet: "restart('billing')" },
});

// 4) Borrado con filtro -> Data -> DESTRUCTIVE -> Human-in-the-Loop DENIEGA.
runWith("Borrado con filtro (Data, aprobacion -> DENEGADO)", ApprovalGate.autoDeny(), {
  id: "T4",
  domain: "data",
  description: "eliminar registros temporales",
  payload: { table: "temp_logs", filter: "older_than_30d" },
});

// 5) Borrado masivo sobre infra protegida -> FORBIDDEN -> BLOQUEADO (ni se ofrece a aprobar).
runWith("Borrado masivo en produccion (FORBIDDEN -> BLOQUEADO)", ApprovalGate.autoApprove(), {
  id: "T5",
  domain: "data",
  description: "borrar toda la tabla",
  payload: { table: "prod_users" },
});

// 6) Dominio sin agente -> escalado.
runWith("Dominio sin agente (escalado a humano)", ApprovalGate.autoDeny(), {
  id: "T6",
  domain: "legal",
  description: "Revisar contrato",
});
