import { sqliteTable, text, real, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Tabela de usuários
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Tabela de geladeiras
export const geladeiras = sqliteTable('geladeiras', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  nome: text('nome').notNull(),
  localizacao: text('localizacao'),
  temperatura: real('temperatura'),
  status: text('status').default('ativo'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Tabela de medicões
export const medicoes = sqliteTable('medicoes', {
  id: text('id').primaryKey(),
  geledeiraId: text('geladeira_id')
    .notNull()
    .references(() => geladeiras.id),
  temperatura: real('temperatura').notNull(),
  umidade: real('umidade'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

// Tabela de logs
export const logs = sqliteTable('logs', {
  id: text('id').primaryKey(),
  geledeiraId: text('geladeira_id').references(() => geladeiras.id),
  tipo: text('tipo').notNull(),
  mensagem: text('mensagem').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

// Relações
export const usuariosRelations = relations(users, ({ many }) => ({
  geladeiras: many(geladeiras),
}));

export const geladeiraasRelations = relations(geladeiras, ({ one, many }) => ({
  usuario: one(users, {
    fields: [geladeiras.userId],
    references: [users.id],
  }),
  medicoes: many(medicoes),
  logs: many(logs),
}));

export const medicoesRelations = relations(medicoes, ({ one }) => ({
  geladeira: one(geladeiras, {
    fields: [medicoes.geledeiraId],
    references: [geladeiras.id],
  }),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  geladeira: one(geladeiras, {
    fields: [logs.geledeiraId],
    references: [geladeiras.id],
  }),
}));
