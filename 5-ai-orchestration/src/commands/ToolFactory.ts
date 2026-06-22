import { ToolCommand, ToolIntent } from "./ToolCommand";
import {
  QueryDatabaseCommand,
  CallApiCommand,
  RunCodeCommand,
  DeleteRecordsCommand,
} from "./Commands";
import { AgentError } from "../errors";

/**
 * Materializa una intención (datos/JSON) en un objeto Command concreto.
 *
 * Este es el corazón del "Tool Gatekeeping": la deducción semántica del agente
 * se convierte en una manifestación tipada y verificable antes de tocar el mundo
 * real.
 */
export class ToolFactory {
  static create(intent: ToolIntent): ToolCommand {
    const args = intent.args;
    switch (intent.tool) {
      case "database":
        if (intent.action === "delete") {
          return new DeleteRecordsCommand(String(args.table), args.filter as string | undefined);
        }
        return new QueryDatabaseCommand(String(args.table), args.filter as string | undefined);
      case "api":
        return new CallApiCommand(String(args.endpoint), (args.body as Record<string, unknown>) ?? {});
      case "code":
        return new RunCodeCommand(String(args.snippet));
      default: {
        const _exhaustive: never = intent.tool;
        throw new AgentError(`Herramienta desconocida: ${String(_exhaustive)}`);
      }
    }
  }
}
