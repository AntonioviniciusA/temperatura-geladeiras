import { createClient } from "@libsql/client";

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Helper to ensure tables exist (can be called on app start or in specific routes)
export async function ensureTables() {
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        acao TEXT NOT NULL,
        detalhes TEXT NOT NULL,
        dataHora TEXT NOT NULL
      )
    `);
  } catch (error) {
    console.error("Erro ao criar tabela de logs:", error);
  }
}
