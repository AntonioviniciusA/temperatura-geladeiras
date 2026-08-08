export interface Geladeira {
  id: string;
  codigo: string;
  descricao: string;
  local: string;
  criadoEm: string;
  ordem: number;
}

export interface RegistroTemperatura {
  id: string;
  geladeiraId: string;
  temperatura: number;
  dataHora: string;
}

export interface MedicaoDiaria {
  data: string;
  concluida: boolean;
  registros: RegistroTemperatura[];
}

export interface Log {
  id: string;
  acao: string;
  detalhes: string;
  dataHora: string;
}

// ============================================
// Tipos para Sistema de Alertas e Anomalias
// ============================================

export type TipoAnomalia =
  | "temperatura_alta"
  | "temperatura_baixa"
  | "falha_comunicacao"
  | "consumo_anormal"
  | "porta_aberta"
  | "manutencao_vencida";

export type SeveridadeAlerta = "info" | "warning" | "critical";

export interface Anomalia {
  id: string;
  geladeiraId: string;
  tipo: TipoAnomalia;
  severidade: SeveridadeAlerta;
  titulo: string;
  descricao: string;
  valorAtual?: number;
  valorEsperado?: number;
  dataHora: string;
  resolvida: boolean;
  sugestao?: string;
}

export interface Alerta {
  id: string;
  tipo: TipoAnomalia;
  severidade: SeveridadeAlerta;
  titulo: string;
  mensagem: string;
  geladeira: Geladeira;
  temperatura?: number;
  dataHora: Date;
  lida: boolean;
}

export interface FiltroAlertas {
  tipo?: TipoAnomalia[];
  severidade?: SeveridadeAlerta[];
  local?: string[];
  unidade?: string[];
  apenasNaoLidas?: boolean;
}

// ============================================
// Tipos para Detalhes da Geladeira
// ============================================

export interface MetricaGeladeira {
  mediaTemperatura: number;
  minimaTemperatura: number;
  maximaTemperatura: number;
  totalRegistros: number;
  diasAtivo: number;
  taxaConformidade: number; // percentual dentro da faixa ideal
}

export interface EventoHistorico {
  id: string;
  tipo: "medicao" | "anomalia" | "manutencao" | "alerta";
  dataHora: string;
  detalhes: string;
  temperatura?: number;
  resolvido?: boolean;
}

// ============================================
// Tipos para Recuperação de Senha
// ============================================

export type StatusRecuperacao =
  | "idle"
  | "enviando"
  | "codigo_enviado"
  | "verificando"
  | "sucesso"
  | "erro";

export interface DadosRecuperacaoSenha {
  email?: string;
  codigo?: string;
  novaSenha?: string;
  status: StatusRecuperacao;
  mensagemErro?: string;
  tempoEsperaCodigo?: number; // segundos para reenviar
}

export interface RequisicaoRecuperacao {
  email: string;
}

export interface RequisicaoVerificacao {
  email: string;
  codigo: string;
}

export interface RequisicaoNovaSenha {
  email: string;
  codigo: string;
  novaSenha: string;
}
