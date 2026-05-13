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
