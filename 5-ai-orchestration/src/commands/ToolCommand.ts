import { Context } from "../memory/Context";

/** Nivel de riesgo de una herramienta, evaluado por los guardrails. */
export enum RiskLevel {
  SAFE = "SAFE",
  DESTRUCTIVE = "DESTRUCTIVE",
  FORBIDDEN = "FORBIDDEN",
}

/**
 * Intención de herramienta expresada como DATOS (esquema JSON fuertemente
 * tipado). El agente solo declara *qué* quiere hacer; el framework la materializa
 * en un objeto Command concreto.
 */
export interface ToolIntent {
  tool: "database" | "api" | "code";
  action: string;
  args: Record<string, unknown>;
}

/**
 * Patrón COMMAND — encapsula la invocación de una herramienta del agente.
 *
 * Cuando el motor deductivo del agente decide invocar una consulta exógena (DB,
 * API, ejecución de código), el orquestador materializa esa intención en un
 * objeto Command concreto. El receptor (ToolInvoker) lo intercepta, lo somete a
 * los guardrails y, solo si procede, lo ejecuta.
 */
export interface ToolCommand {
  readonly name: string;
  describe(): string;
  risk(): RiskLevel;
  /** Materializa la acción en el mundo real (simulado) y devuelve el resultado. */
  execute(context: Context): string;
}
