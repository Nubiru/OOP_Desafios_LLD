/** Error de dominio del sistema de orquestación de agentes. */
export class AgentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentError";
  }
}
