import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

function createDbClient() {
  const url =
    process.env.TURSO_CONNECTION_URL ??
    process.env.TURSO_DATABASE_URL ??
    process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN ?? process.env.AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error(
      'TURSO_CONNECTION_URL, TURSO_DATABASE_URL or DATABASE_URL and TURSO_AUTH_TOKEN or AUTH_TOKEN must be provided in the environment',
    );
  }

  return createClient({ url, authToken });
}

export function getDb() {
  return drizzle(createDbClient(), { schema });
}

export async function ensureTables() {
  try {
    const client = createDbClient();

    await client.execute(`
      CREATE TABLE IF NOT EXISTS geladeiras (
        id TEXT PRIMARY KEY,
        codigo TEXT NOT NULL,
        descricao TEXT NOT NULL,
        local TEXT NOT NULL,
        criadoEm TEXT NOT NULL,
        ordem INTEGER DEFAULT 0
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS registros_temperatura (
        id TEXT PRIMARY KEY,
        geladeiraId TEXT NOT NULL,
        temperatura REAL NOT NULL,
        dataHora TEXT NOT NULL,
        FOREIGN KEY (geladeiraId) REFERENCES geladeiras(id)
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        acao TEXT NOT NULL,
        detalhes TEXT NOT NULL,
        dataHora TEXT NOT NULL
      )
    `);

    try {
      await client.execute('ALTER TABLE geladeiras ADD COLUMN ordem INTEGER DEFAULT 0');
    } catch (error) {
      // coluna já existe ou não aplicável
    }
  } catch (error) {
    console.error('Erro ao criar/migrar tabelas:', error);
  }
}
