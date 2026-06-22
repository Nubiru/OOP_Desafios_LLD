import { ToolCommand, RiskLevel } from "../commands/ToolCommand";

/** Veredicto determinista del guardrail sobre un comando. */
export enum Verdict {
  ALLOW = "ALLOW",
  REQUIRE_APPROVAL = "REQUIRE_APPROVAL",
  BLOCK = "BLOCK",
}

/**
 * Guardrail determinista: barrera de seguridad perimetral.
 *
 * Dado que las redes neuronales pueden "alucinar", las decisiones de la IA no se
 * ejecutan a ciegas. Esta capa, hecha de reglas fijas, traduce el riesgo del
 * comando en un veredicto:
 *  - SAFE        → ALLOW (se ejecuta)
 *  - DESTRUCTIVE → REQUIRE_APPROVAL (Human-in-the-Loop)
 *  - FORBIDDEN   → BLOCK (acción irreversible/no autorizada: se interrumpe)
 */
export class Guardrail {
  evaluate(command: ToolCommand): Verdict {
    switch (command.risk()) {
      case RiskLevel.SAFE:
        return Verdict.ALLOW;
      case RiskLevel.DESTRUCTIVE:
        return Verdict.REQUIRE_APPROVAL;
      case RiskLevel.FORBIDDEN:
        return Verdict.BLOCK;
    }
  }
}
