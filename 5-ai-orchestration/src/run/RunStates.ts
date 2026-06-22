import { RunState } from "./RunState";
import type { Run } from "./Run";
import { ToolFactory } from "../commands/ToolFactory";
import { Verdict } from "../guardrails/Guardrail";

/**
 * PLANNING: el agente decide la intención de herramienta. Si no necesita
 * herramientas, responde directamente y completa.
 */
export class PlanningState implements RunState {
  readonly name = "PLANNING";

  step(run: Run): void {
    const intent = run.agent.plan(run.task, run.context);
    if (!intent) {
      run.context.log(`[${run.task.id}] ${run.agent.name} resuelve directamente (sin herramientas)`);
      run.output = `Respuesta directa de ${run.agent.name}`;
      run.status = "COMPLETED";
      run.setState(new CompletedState());
      return;
    }
    run.setIntent(intent);
    run.setState(new ActingState());
  }
}

/**
 * ACTING: materializa el comando y lo somete al guardrail. Según el veredicto:
 * ejecuta, espera aprobación humana, o falla por bloqueo.
 */
export class ActingState implements RunState {
  readonly name = "ACTING";

  step(run: Run): void {
    const command = ToolFactory.create(run.intent!);
    run.setCommand(command);

    const verdict = run.invoker.evaluate(command);
    run.context.log(`[${run.task.id}] guardrail(${command.name}) = ${verdict}`);

    switch (verdict) {
      case Verdict.ALLOW:
        run.output = run.invoker.execute(command, run.context);
        run.status = "COMPLETED";
        run.setState(new CompletedState());
        break;
      case Verdict.REQUIRE_APPROVAL:
        run.setState(new AwaitingApprovalState());
        break;
      case Verdict.BLOCK:
        run.output = `BLOQUEADO por guardrail: ${command.describe()}`;
        run.status = "FAILED";
        run.setState(new FailedState());
        break;
    }
  }
}

/**
 * AWAITING_APPROVAL: Human-in-the-Loop. El operador aprueba (se ejecuta) o
 * deniega (falla).
 */
export class AwaitingApprovalState implements RunState {
  readonly name = "AWAITING_APPROVAL";

  step(run: Run): void {
    const command = run.command!;
    const approved = run.approval.decide(command, run.task);
    run.context.log(`[${run.task.id}] Human-in-the-Loop: ${approved ? "APROBADO" : "DENEGADO"}`);

    if (approved) {
      run.output = run.invoker.execute(command, run.context);
      run.status = "COMPLETED";
      run.setState(new CompletedState());
    } else {
      run.output = `Aprobacion denegada para ${command.name}`;
      run.status = "FAILED";
      run.setState(new FailedState());
    }
  }
}

/** Estado final COMPLETED. */
export class CompletedState implements RunState {
  readonly name = "COMPLETED";
  step(_run: Run): void {
    /* terminal: sin transiciones */
  }
}

/** Estado final FAILED. */
export class FailedState implements RunState {
  readonly name = "FAILED";
  step(_run: Run): void {
    /* terminal: sin transiciones */
  }
}
