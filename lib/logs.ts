import { turso } from "./turso-server";

export async function addLog(acao: string, detalhes: string) {
  try {
    const id = crypto.randomUUID();
    const dataHora = new Date().toISOString();

    await turso.execute({
      sql: "INSERT INTO logs (id, acao, detalhes, dataHora) VALUES (?, ?, ?, ?)",
      args: [id, acao, detalhes, dataHora],
    });
  } catch (error) {
    console.error("Erro ao adicionar log:", error);
  }
}
