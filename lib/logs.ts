import { getDb } from "./db";
import { logs } from "./schema";

export async function addLog(acao: string, detalhes: string) {
  try {
    const db = getDb();
    const id = crypto.randomUUID();
    const dataHora = new Date().toISOString();

    await db.insert(logs).values({ id, acao, detalhes, dataHora });
  } catch (error) {
    console.error("Erro ao adicionar log:", error);
  }
}
