import { Context } from "../memory/Context";
import { ToolCommand, RiskLevel } from "./ToolCommand";

/** Consulta de lectura a la base de datos. Segura. */
export class QueryDatabaseCommand implements ToolCommand {
  readonly name = "db.query";

  constructor(
    private readonly table: string,
    private readonly filter: string = "*",
  ) {}

  describe(): string {
    return `SELECT * FROM ${this.table} WHERE ${this.filter}`;
  }
  risk(): RiskLevel {
    return RiskLevel.SAFE;
  }
  execute(context: Context): string {
    context.log(`[tool] ${this.describe()}`);
    return `filas de ${this.table} (filtro: ${this.filter})`;
  }
}

/** Llamada a una API externa de solo lectura/efecto controlado. Segura. */
export class CallApiCommand implements ToolCommand {
  readonly name = "api.call";

  constructor(
    private readonly endpoint: string,
    private readonly args: Record<string, unknown> = {},
  ) {}

  describe(): string {
    return `POST ${this.endpoint} ${JSON.stringify(this.args)}`;
  }
  risk(): RiskLevel {
    return RiskLevel.SAFE;
  }
  execute(context: Context): string {
    context.log(`[tool] ${this.describe()}`);
    return `respuesta 200 de ${this.endpoint}`;
  }
}

/** Ejecución autónoma de código. Destructiva: requiere aprobación humana. */
export class RunCodeCommand implements ToolCommand {
  readonly name = "code.run";

  constructor(private readonly snippet: string) {}

  describe(): string {
    return `ejecutar codigo: \`${this.snippet}\``;
  }
  risk(): RiskLevel {
    return RiskLevel.DESTRUCTIVE;
  }
  execute(context: Context): string {
    context.log(`[tool] ${this.describe()}`);
    return `codigo ejecutado: ${this.snippet}`;
  }
}

/**
 * Borrado de registros. Destructivo por defecto; FORBIDDEN (irreversible y no
 * autorizable) si es masivo (sin filtro) o sobre infraestructura protegida.
 */
export class DeleteRecordsCommand implements ToolCommand {
  readonly name = "db.delete";

  constructor(
    private readonly table: string,
    private readonly filter?: string,
  ) {}

  describe(): string {
    return `DELETE FROM ${this.table} WHERE ${this.filter ?? "(sin filtro)"}`;
  }

  risk(): RiskLevel {
    const protectedTable = /prod|shared|index/i.test(this.table);
    if (!this.filter || protectedTable) return RiskLevel.FORBIDDEN;
    return RiskLevel.DESTRUCTIVE;
  }

  execute(context: Context): string {
    context.log(`[tool] ${this.describe()}`);
    return `registros eliminados de ${this.table}`;
  }
}
