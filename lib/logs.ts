import { getDb } from "./db";
import { logs } from "./schema";
import { lt } from "drizzle-orm";

const LOGS_RETENTION_DAYS = 30;

export async function cleanupOldLogs() {
  try {
    const db = getDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - LOGS_RETENTION_DAYS);
    const cutoffISO = cutoffDate.toISOString();

    const result = await db.delete(logs).where(lt(logs.dataHora, cutoffISO));

    return result.rowsAffected || 0;
  } catch (error) {
    console.error("Erro ao limpar logs antigos:", error);
    return 0;
  }
}

export async function addLog(acao: string, detalhes: string) {
  try {
    const db = getDb();
    const id = crypto.randomUUID();
    const dataHora = new Date().toISOString();

    await db.insert(logs).values({ id, acao, detalhes, dataHora });

    if (Math.random() < 0.1) {
      cleanupOldLogs().catch((e) =>
        console.error("Limpeza de logs em background falhou:", e),
      );
    }
  } catch (error) {
    console.error("Erro ao adicionar log:", error);
  }
}
