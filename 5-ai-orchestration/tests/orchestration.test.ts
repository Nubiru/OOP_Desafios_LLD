import { test } from "node:test";
import assert from "node:assert/strict";

import { Context } from "../src/memory/Context";
import { Guardrail, Verdict } from "../src/guardrails/Guardrail";
import { ApprovalGate } from "../src/guardrails/ApprovalGate";
import { ToolInvoker } from "../src/tools/ToolInvoker";
import { Orchestrator } from "../src/orchestrator/Orchestrator";
import { TriageAgent, BillingAgent, DataAgent, OpsAgent } from "../src/agents/Agents";
import { ToolFactory } from "../src/commands/ToolFactory";
import { RiskLevel } from "../src/commands/ToolCommand";
import {
  QueryDatabaseCommand,
  DeleteRecordsCommand,
  CallApiCommand,
  RunCodeCommand,
} from "../src/commands/Commands";
import { Task } from "../src/models/Task";

function buildChain() {
  const triage = new TriageAgent();
  triage.setNext(new BillingAgent()).setNext(new DataAgent()).setNext(new OpsAgent());
  return triage;
}

function orchestrator(approval = ApprovalGate.autoDeny()) {
  return new Orchestrator(buildChain(), new ToolInvoker(new Guardrail()), approval);
}

function dispatch(task: Task, approval = ApprovalGate.autoDeny()) {
  const context = new Context();
  const outcome = orchestrator(approval).dispatch(task, context);
  return { outcome, context };
}

// --- Chain of Responsibility -------------------------------------------------

test("CoR: el triaje resuelve una consulta general directamente", () => {
  const { outcome } = dispatch({ id: "T1", domain: "general", description: "que es X" });
  assert.equal(outcome.agent, "Triage");
  assert.equal(outcome.status, "COMPLETED");
});

test("CoR: handoff hasta el especialista de facturación", () => {
  const { outcome, context } = dispatch({
    id: "T2",
    domain: "billing",
    description: "refund",
    payload: { customer: "C1" },
  });
  assert.equal(outcome.agent, "Billing");
  assert.ok(context.trace.some((l) => l.includes("Triage deriva")));
  assert.ok(context.trace.some((l) => l.includes("Billing ACEPTA")));
});

test("CoR: dominio sin agente -> escalado (FAILED, agent null)", () => {
  const { outcome } = dispatch({ id: "T6", domain: "legal", description: "contrato" });
  assert.equal(outcome.agent, null);
  assert.equal(outcome.status, "FAILED");
});

// --- Command + Guardrails ----------------------------------------------------

test("Command/Guardrail: herramienta segura (API) se ejecuta (ALLOW)", () => {
  const { outcome } = dispatch({
    id: "T2",
    domain: "billing",
    description: "refund",
    payload: { customer: "C1" },
  });
  assert.equal(outcome.status, "COMPLETED");
  assert.match(outcome.output, /respuesta 200/);
});

test("Guardrail: SAFE->ALLOW, DESTRUCTIVE->REQUIRE_APPROVAL, FORBIDDEN->BLOCK", () => {
  const g = new Guardrail();
  assert.equal(g.evaluate(new QueryDatabaseCommand("t")), Verdict.ALLOW);
  assert.equal(g.evaluate(new DeleteRecordsCommand("t", "id=1")), Verdict.REQUIRE_APPROVAL);
  assert.equal(g.evaluate(new DeleteRecordsCommand("t")), Verdict.BLOCK); // sin filtro
});

test("destructivo con aprobación humana APROBADA -> se ejecuta", () => {
  const { outcome } = dispatch(
    { id: "T3", domain: "ops", description: "run", payload: { snippet: "x()" } },
    ApprovalGate.autoApprove(),
  );
  assert.equal(outcome.status, "COMPLETED");
  assert.match(outcome.output, /codigo ejecutado/);
});

test("destructivo con aprobación humana DENEGADA -> falla", () => {
  const { outcome, context } = dispatch(
    { id: "T4", domain: "data", description: "eliminar", payload: { table: "logs", filter: "old" } },
    ApprovalGate.autoDeny(),
  );
  assert.equal(outcome.status, "FAILED");
  assert.ok(context.trace.some((l) => l.includes("DENEGADO")));
});

test("FORBIDDEN: borrado masivo se BLOQUEA aun con auto-aprobación", () => {
  const { outcome } = dispatch(
    { id: "T5", domain: "data", description: "borrar todo", payload: { table: "prod_users" } },
    ApprovalGate.autoApprove(), // ni siquiera se ofrece a aprobar
  );
  assert.equal(outcome.status, "FAILED");
  assert.match(outcome.output, /BLOQUEADO/);
});

// --- State (ciclo de vida del Run) ------------------------------------------

test("State: la traza registra las transiciones del run", () => {
  const { context } = dispatch(
    { id: "T3", domain: "ops", description: "run", payload: { snippet: "x()" } },
    ApprovalGate.autoApprove(),
  );
  const trace = context.trace.join("\n");
  assert.match(trace, /PLANNING -> ACTING/);
  assert.match(trace, /ACTING -> AWAITING_APPROVAL/);
  assert.match(trace, /AWAITING_APPROVAL -> COMPLETED/);
});

test("State: consulta directa va PLANNING -> COMPLETED sin herramientas", () => {
  const { context } = dispatch({ id: "T1", domain: "general", description: "hola" });
  assert.match(context.trace.join("\n"), /PLANNING -> COMPLETED/);
});

// --- Factory + riesgos -------------------------------------------------------

test("ToolFactory materializa el comando correcto según la intención", () => {
  assert.ok(
    ToolFactory.create({ tool: "database", action: "query", args: { table: "t" } }) instanceof
      QueryDatabaseCommand,
  );
  assert.ok(
    ToolFactory.create({ tool: "database", action: "delete", args: { table: "t", filter: "id=1" } }) instanceof
      DeleteRecordsCommand,
  );
  assert.ok(ToolFactory.create({ tool: "api", action: "x", args: { endpoint: "/e" } }) instanceof CallApiCommand);
  assert.ok(ToolFactory.create({ tool: "code", action: "run", args: { snippet: "y" } }) instanceof RunCodeCommand);
});

test("riesgo de borrado: con filtro es DESTRUCTIVE; sobre infra protegida es FORBIDDEN", () => {
  assert.equal(new DeleteRecordsCommand("logs", "id=1").risk(), RiskLevel.DESTRUCTIVE);
  assert.equal(new DeleteRecordsCommand("shared_index", "id=1").risk(), RiskLevel.FORBIDDEN);
});

// --- Orquestación secuencial -------------------------------------------------

test("orquestación secuencial: procesa varias tareas compartiendo contexto", () => {
  const context = new Context();
  const outcomes = orchestrator().dispatchSequential(
    [
      { id: "S1", domain: "general", description: "a" },
      { id: "S2", domain: "billing", description: "refund", payload: { customer: "C1" } },
    ],
    context,
  );
  assert.equal(outcomes.length, 2);
  assert.equal(outcomes[0].status, "COMPLETED");
  assert.equal(outcomes[1].status, "COMPLETED");
});
