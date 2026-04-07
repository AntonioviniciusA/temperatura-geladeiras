CREATE TABLE IF NOT EXISTS geladeiras (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  local TEXT NOT NULL,
  criadoEm TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS registros_temperatura (
  id TEXT PRIMARY KEY,
  geladeiraId TEXT NOT NULL,
  temperatura REAL NOT NULL,
  dataHora TEXT NOT NULL,
  FOREIGN KEY (geladeiraId) REFERENCES geladeiras(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medicoes_diarias (
  data TEXT PRIMARY KEY,
  concluida INTEGER NOT NULL DEFAULT 0
);

-- Os registros de cada medição ficam na tabela registros_temperatura,
-- então não precisamos de uma tabela separada para os registros da medição diária.
-- A medição diária é derivada: data, concluida (se todos os registros do dia estão presentes).