/**
 * Tarea/solicitud que ingresa al ecosistema de agentes. `domain` orienta el
 * enrutamiento (Chain of Responsibility); `payload` transporta los parámetros
 * que el agente usará para planificar la intención de herramienta.
 */
export interface Task {
  id: string;
  domain: string;
  description: string;
  payload?: Record<string, unknown>;
}
