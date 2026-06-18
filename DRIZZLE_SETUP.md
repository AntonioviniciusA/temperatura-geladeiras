# Drizzle ORM Setup

O projeto agora usa **Drizzle ORM** para gerenciar o banco de dados SQLite via Turso/LibSQL.

## Configuração

### Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
TURSO_CONNECTION_URL=libsql://seu-banco-aqui.turso.io
TURSO_AUTH_TOKEN=seu-token-aqui
```

## Scripts Disponíveis

- `npm run db:generate` - Gera migrações baseado nas mudanças no schema
- `npm run db:migrate` - Executa as migrações pendentes
- `npm run db:studio` - Abre o Drizzle Studio para visualizar/editar dados

## Estrutura

### Schema (`lib/schema.ts`)
Define todas as tabelas e relações do banco de dados:
- **users** - Usuários do sistema
- **geladeiras** - Equipamentos de refrigeração
- **medicoes** - Leituras de temperatura
- **logs** - Histórico de eventos

### Database Client (`lib/db.ts`)
Exporta a instância `db` para usar em toda a aplicação.

## Exemplo de Uso

```typescript
import { db } from '@/lib/db';
import { geladeiras } from '@/lib/schema';

// Buscar todas as geladeiras
const todasAsGeladeiras = await db.query.geladeiras.findMany();

// Buscar geladeira específica com medicões
const geladeira = await db.query.geladeiras.findFirst({
  where: (table) => eq(table.id, '123'),
  with: { medicoes: true }
});

// Inserir nova medição
await db.insert(medicoes).values({
  id: 'med-' + Date.now(),
  geledeiraId: '123',
  temperatura: 4.5,
  timestamp: new Date(),
});
```

## Próximos Passos

1. Defina as variáveis de ambiente
2. Execute `npm run db:generate` para criar as migrações
3. Execute `npm run db:migrate` para aplicar ao banco
4. Atualize as rotas da API para usar `db` em vez de SQL direto
