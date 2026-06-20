import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const geladeiras = sqliteTable('geladeiras', {
  id: text('id').primaryKey(),
  codigo: text('codigo').notNull(),
  descricao: text('descricao').notNull(),
  local: text('local').notNull(),
  criadoEm: text('criadoEm').notNull(),
  ordem: integer('ordem').notNull().default(0),
});

export const registrosTemperatura = sqliteTable('registros_temperatura', {
  id: text('id').primaryKey(),
  geladeiraId: text('geladeiraId').notNull().references(() => geladeiras.id),
  temperatura: real('temperatura').notNull(),
  dataHora: text('dataHora').notNull(),
});

export const logs = sqliteTable('logs', {
  id: text('id').primaryKey(),
  acao: text('acao').notNull(),
  detalhes: text('detalhes').notNull(),
  dataHora: text('dataHora').notNull(),
});

export const geladeirasRelations = relations(geladeiras, ({ many }) => ({
  registros: many(registrosTemperatura),
}));

export const registrosRelations = relations(registrosTemperatura, ({ one }) => ({
  geladeira: one(geladeiras, {
    fields: [registrosTemperatura.geladeiraId],
    references: [geladeiras.id],
  }),
}));
