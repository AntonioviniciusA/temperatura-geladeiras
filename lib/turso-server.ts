import { createClient } from "@libsql/client";

export const turso = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
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

    // Adicionar coluna ordem se não existir (para geladeiras)
    try {
      await turso.execute("ALTER TABLE geladeiras ADD COLUMN ordem INTEGER DEFAULT 0");
    } catch (err) {
      // Ignore se coluna já existir
    }

    // Atualizar ordem para geladeiras que não têm (usar criadoEm)
    const result = await turso.execute("SELECT id FROM geladeiras WHERE ordem IS NULL ORDER BY criadoEm ASC");
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows[i] as any;
      await turso.execute({
        sql: "UPDATE geladeiras SET ordem = ? WHERE id = ?",
        args: [i, row.id],
      });
    }
  } catch (error) {
    console.error("Erro ao criar/migrar tabelas:", error);
  }
}
