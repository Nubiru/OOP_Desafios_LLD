import { ToolCommand } from "../commands/ToolCommand";
import { Context } from "../memory/Context";
import { Guardrail, Verdict } from "../guardrails/Guardrail";

/**
 * Receptor / gatekeeper del patrón Command.
 *
 * Intercepta cada comando: primero lo somete al guardrail (evaluación) y solo
 * lo ejecuta cuando la política lo permite. Separa "decidir si se puede" de
 * "hacerlo".
 */
export class ToolInvoker {
  constructor(private readonly guardrail: Guardrail) {}

  evaluate(command: ToolCommand): Verdict {
    return this.guardrail.evaluate(command);
  }

  execute(command: ToolCommand, context: Context): string {
    return command.execute(context);
  }
}
