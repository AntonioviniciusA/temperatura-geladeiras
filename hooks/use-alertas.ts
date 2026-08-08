// hooks/use-alertas.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Geladeira,
  RegistroTemperatura,
  Anomalia,
  Alerta,
  FiltroAlertas,
  TipoAnomalia,
  SeveridadeAlerta,
  MetricaGeladeira,
} from "@/lib/types";

interface UseAlertasOptions {
  geladeiras: Geladeira[];
  registros: RegistroTemperatura[];
  intervaloAtualizacao?: number; // em milissegundos, padrão 5 minutos
  onNovoAlerta?: (alerta: Alerta) => void;
}

interface UseAlertasReturn {
  alertas: Alerta[];
  anomalias: Anomalia[];
  alertasNaoLidas: number;
  filtrarAlertas: (filtros: FiltroAlertas) => Alerta[];
  marcarAlertaComoLida: (id: string) => void;
  marcarTodosComoLidos: () => void;
  dismissAlerta: (id: string) => void;
  estatatisticas: {
    total: number;
    criticos: number;
    avisos: number;
    infos: number;
  };
  locations: string[];
  unidades: string[];
  recarregar: () => void;
  isLoading: boolean;
  error: string | null;
}

// Constantes para detecção de anomalias
const FAIXAS_TEMPERATURA = {
  ideal: { min: -25, max: -15 },
  aceitavel: { min: -30, max: -10 },
  critico: { min: -35, max: 0 },
};

const INTERVALO_SEM_MEDICAO_PARA_FALHA = 6 * 60 * 60 * 1000; // 6 horas em ms
const DESVIO_TEMPERATURA_CRITICO = 10; // 10°C acima da média

function gerarSugestao(tipo: TipoAnomalia, geladeira: Geladeira): string {
  switch (tipo) {
    case "temperatura_alta":
      return `Verificar se a porta da ${geladeira.descricao} está bem fechada. Verificar o compressor e as juntas de vedação.`;
    case "temperatura_baixa":
      return `Ajustar o termostato da ${geladeira.descricao}. Verificar se não há objetos bloqueando a circulação de ar.`;
    case "falha_comunicacao":
      return `Verificar a conexão de energia e sinal do dispositivo em ${geladeira.local}. Reiniciar o equipamento se necessário.`;
    case "consumo_anormal":
      return `Inspecionar o compressor e as luzes internas da ${geladeira.descricao}. Verificar histórico de medições para identificar padrões.`;
    case "porta_aberta":
      return `Verificar se há objetos impedindo o fechamento completo da porta em ${geladeira.local}.`;
    case "manutencao_vencida":
      return `Agendar manutenção preventiva para a ${geladeira.descricao} em ${geladeira.local}.`;
    default:
      return "Contate o suporte técnico para avaliação.";
  }
}

function calcularMetricas(
  geladeiraId: string,
  registros: RegistroTemperatura[],
): MetricaGeladeira | null {
  const registrosGeladeira = registros
    .filter((r) => r.geladeiraId === geladeiraId)
    .sort(
      (a, b) =>
        new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
    );

  if (registrosGeladeira.length === 0) {
    return null;
  }

  const temperaturas = registrosGeladeira.map((r) => r.temperatura);
  const soma = temperaturas.reduce((acc, t) => acc + t, 0);
  const media = soma / temperaturas.length;
  const minima = Math.min(...temperaturas);
  const maxima = Math.max(...temperaturas);

  // Calcular taxa de conformidade (% dentro da faixa ideal)
  const dentroFaixa = temperaturas.filter(
    (t) => t >= FAIXAS_TEMPERATURA.ideal.min && t <= FAIXAS_TEMPERATURA.ideal.max,
  ).length;
  const taxaConformidade = (dentroFaixa / temperaturas.length) * 100;

  // Calcular dias ativo baseado no primeiro registro
  const primeiroRegistro = registrosGeladeira[registrosGeladeira.length - 1];
  const diasAtivo = Math.ceil(
    (Date.now() - new Date(primeiroRegistro.dataHora).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return {
    mediaTemperatura: Math.round(media * 10) / 10,
    minimaTemperatura: minima,
    maximaTemperatura: maxima,
    totalRegistros: registrosGeladeira.length,
    diasAtivo,
    taxaConformidade: Math.round(taxaConformidade * 10) / 10,
  };
}

function detectarAnomalias(
  geladeiras: Geladeira[],
  registros: RegistroTemperatura[],
): Anomalia[] {
  const anomalias: Anomalia[] = [];
  const agora = Date.now();

  geladeiras.forEach((geladeira) => {
    const metricas = calcularMetricas(geladeira.id, registros);
    const registrosGeladeira = registros
      .filter((r) => r.geladeiraId === geladeira.id)
      .sort(
        (a, b) =>
          new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
      );

    // 1. Verificar temperatura atual
    const ultimaMedicao = registrosGeladeira[0];
    if (ultimaMedicao) {
      const diffMs = agora - new Date(ultimaMedicao.dataHora).getTime();

      // Verificar se está fora da faixa
      if (ultimaMedicao.temperatura > FAIXAS_TEMPERATURA.critico.max) {
        anomalias.push({
          id: `${geladeira.id}-temp-alta-${ultimaMedicao.dataHora}`,
          geladeiraId: geladeira.id,
          tipo: "temperatura_alta",
          severidade: "critical",
          titulo: "Temperatura Elevada",
          descricao: `Temperatura atual de ${ultimaMedicao.temperatura}°C está acima do limite crítico (${FAIXAS_TEMPERATURA.critico.max}°C)`,
          valorAtual: ultimaMedicao.temperatura,
          valorEsperado: FAIXAS_TEMPERATURA.ideal.max,
          dataHora: ultimaMedicao.dataHora,
          resolvida: false,
          sugestao: gerarSugestao("temperatura_alta", geladeira),
        });
      } else if (ultimaMedicao.temperatura > FAIXAS_TEMPERATURA.ideal.max) {
        anomalias.push({
          id: `${geladeira.id}-temp-aceitavel-${ultimaMedicao.dataHora}`,
          geladeiraId: geladeira.id,
          tipo: "temperatura_alta",
          severidade: "warning",
          titulo: "Temperatura Acima do Ideal",
          descricao: `Temperatura de ${ultimaMedicao.temperatura}°C está acima da faixa ideal (${FAIXAS_TEMPERATURA.ideal.min}°C a ${FAIXAS_TEMPERATURA.ideal.max}°C)`,
          valorAtual: ultimaMedicao.temperatura,
          valorEsperado: FAIXAS_TEMPERATURA.ideal.max,
          dataHora: ultimaMedicao.dataHora,
          resolvida: false,
          sugestao: gerarSugestao("temperatura_alta", geladeira),
        });
      }

      // Verificar temperatura muito baixa
      if (ultimaMedicao.temperatura < FAIXAS_TEMPERATURA.critico.min) {
        anomalias.push({
          id: `${geladeira.id}-temp-baixa-${ultimaMedicao.dataHora}`,
          geladeiraId: geladeira.id,
          tipo: "temperatura_baixa",
          severidade: "critical",
          titulo: "Temperatura Muito Baixa",
          descricao: `Temperatura de ${ultimaMedicao.temperatura}°C está abaixo do limite crítico`,
          valorAtual: ultimaMedicao.temperatura,
          valorEsperado: FAIXAS_TEMPERATURA.ideal.min,
          dataHora: ultimaMedicao.dataHora,
          resolvida: false,
          sugestao: gerarSugestao("temperatura_baixa", geladeira),
        });
      }

      // Verificar desvio significativo da média
      if (metricas && metricas.mediaTemperatura !== undefined) {
        const diff = ultimaMedicao.temperatura - metricas.mediaTemperatura;
        if (diff > DESVIO_TEMPERATURA_CRITICO) {
          anomalias.push({
            id: `${geladeira.id}-desvio-critico-${ultimaMedicao.dataHora}`,
            geladeiraId: geladeira.id,
            tipo: "consumo_anormal",
            severidade: "critical",
            titulo: "Desvio de Temperatura Crítico",
            descricao: `Temperatura atual está ${diff.toFixed(1)}°C acima da média histórica (${metricas.mediaTemperatura}°C)`,
            valorAtual: ultimaMedicao.temperatura,
            valorEsperado: metricas.mediaTemperatura,
            dataHora: ultimaMedicao.dataHora,
            resolvida: false,
            sugestao: gerarSugestao("consumo_anormal", geladeira),
          });
        }
      }

      // 2. Verificar falha de comunicação (sem medição há mais de 6 horas)
      if (diffMs > INTERVALO_SEM_MEDICAO_PARA_FALHA) {
        anomalias.push({
          id: `${geladeira.id}-falha-com-${agora}`,
          geladeiraId: geladeira.id,
          tipo: "falha_comunicacao",
          severidade: "warning",
          titulo: "Falha de Comunicação",
          descricao: `Nenhuma medição recebida há mais de 6 horas. Última medição em ${new Date(ultimaMedicao.dataHora).toLocaleString("pt-BR")}`,
          dataHora: new Date(agora).toISOString(),
          resolvida: false,
          sugestao: gerarSugestao("falha_comunicacao", geladeira),
        });
      }
    } else {
      // Sem nenhum registro - anomalia crítica
      anomalias.push({
        id: `${geladeira.id}-sem-medicao-${agora}`,
        geladeiraId: geladeira.id,
        tipo: "falha_comunicacao",
        severidade: "critical",
        titulo: "Sem Registros",
        descricao: `Nenhum registro encontrado para ${geladeira.descricao}`,
        dataHora: new Date(agora).toISOString(),
        resolvida: false,
        sugestao: gerarSugestao("falha_comunicacao", geladeira),
      });
    }

    // 3. Verificar manutenção vencida (simulado - em produção viria do banco)
    // Aqui você adicionaria lógica para verificar data de última manutenção
  });

  return anomalias;
}

export function useAlertas({
  geladeiras,
  registros,
  intervaloAtualizacao = 5 * 60 * 1000,
  onNovoAlerta,
}: UseAlertasOptions): UseAlertasReturn {
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [alertasLidas, setAlertasLidas] = useState<Set<string>>(new Set());
  const [dismissedAlertas, setDismissedAlertas] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimoAlertasCount, setUltimoAlertasCount] = useState(0);

  const detectar = useCallback(() => {
    try {
      const anomaliasDetectadas = detectarAnomalias(geladeiras, registros);
      setAnomalias(anomaliasDetectadas);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao detectar anomalias");
    }
  }, [geladeiras, registros]);

  // Executar detecção quando geladeiras ou registros mudam
  useEffect(() => {
    detectar();
  }, [detectar]);

  // Auto-refresh a cada X minutos
  useEffect(() => {
    const interval = setInterval(detectar, intervaloAtualizacao);
    return () => clearInterval(interval);
  }, [detectar, intervaloAtualizacao]);

  // Notificar novos alertas
  useEffect(() => {
    if (anomalias.length > ultimoAlertasCount && onNovoAlerta) {
      const novosAlertas = anomalias.filter(
        (a) => !alertasLidas.has(a.id) && !dismissedAlertas.has(a.id),
      );
      if (novosAlertas.length > 0) {
        onNovoAlerta(novosAlertas[0]);
      }
    }
    setUltimoAlertasCount(anomalias.length);
  }, [anomalias, ultimoAlertasCount, alertasLidas, dismissedAlertas, onNovoAlerta]);

  // Converter anomalias em alertas formatados
  const alertas: Alerta[] = useMemo(() => {
    return anomalias
      .filter((a) => !dismissedAlertas.has(a.id))
      .map((anomalia) => {
        const geladeira = geladeiras.find((g) => g.id === anomalia.geladeiraId);
        return {
          id: anomalia.id,
          tipo: anomalia.tipo,
          severidade: anomalia.severidade,
          titulo: anomalia.titulo,
          mensagem: anomalia.descricao,
          geladeira: geladeira!,
          temperatura: anomalia.valorAtual,
          dataHora: new Date(anomalia.dataHora),
          lida: alertasLidas.has(anomalia.id),
        };
      })
      .filter((a) => a.geladeira);
  }, [anomalias, alertasLidas, dismissedAlertas, geladeiras]);

  const alertasNaoLidas = useMemo(
    () => alertas.filter((a) => !a.lida).length,
    [alertas],
  );

  const estatatisticas = useMemo(
    () => ({
      total: alertas.length,
      criticos: alertas.filter((a) => a.severidade === "critical").length,
      avisos: alertas.filter((a) => a.severidade === "warning").length,
      infos: alertas.filter((a) => a.severidade === "info").length,
    }),
    [alertas],
  );

  // Extrair locais e unidades únicos para filtros
  const locations = useMemo(
    () => [...new Set(geladeiras.map((g) => g.local))],
    [geladeiras],
  );

  const unidades = useMemo(
    () => [...new Set(geladeiras.map((g) => g.codigo.split("-")[0]))],
    [geladeiras],
  );

  const filtrarAlertas = useCallback(
    (filtros: FiltroAlertas): Alerta[] => {
      return alertas.filter((alerta) => {
        if (filtros.tipo && filtros.tipo.length > 0) {
          if (!filtros.tipo.includes(alerta.tipo)) return false;
        }
        if (filtros.severidade && filtros.severidade.length > 0) {
          if (!filtros.severidade.includes(alerta.severidade)) return false;
        }
        if (filtros.local && filtros.local.length > 0) {
          if (!filtros.local.includes(alerta.geladeira.local)) return false;
        }
        if (filtros.unidade && filtros.unidade.length > 0) {
          if (!filtros.unidade.includes(alerta.geladeira.codigo)) return false;
        }
        if (filtros.apenasNaoLidas) {
          if (alerta.lida) return false;
        }
        return true;
      });
    },
    [alertas],
  );

  const marcarAlertaComoLida = useCallback((id: string) => {
    setAlertasLidas((prev) => new Set(prev).add(id));
  }, []);

  const marcarTodosComoLidos = useCallback(() => {
    setAlertasLidas(new Set(alertas.map((a) => a.id)));
  }, [alertas]);

  const dismissAlerta = useCallback((id: string) => {
    setDismissedAlertas((prev) => new Set(prev).add(id));
  }, []);

  const recarregar = useCallback(() => {
    setIsLoading(true);
    detectar();
    setIsLoading(false);
  }, [detectar]);

  return {
    alertas,
    anomalias,
    alertasNaoLidas,
    filtrarAlertas,
    marcarAlertaComoLida,
    marcarTodosComoLidos,
    dismissAlerta,
    estatatisticas,
    locations,
    unidades,
    recarregar,
    isLoading,
    error,
  };
}

export { calcularMetricas, gerarSugestao, detectarAnomalias };
