// components/geladeira-detalhes.tsx
"use client";

import { useMemo } from "react";
import type {
  Geladeira,
  RegistroTemperatura,
  MetricaGeladeira,
  EventoHistorico,
  Anomalia,
} from "@/lib/types";
import { calcularMetricas, gerarSugestao } from "@/hooks/use-alertas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Thermometer,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Wrench,
  Lightbulb,
} from "lucide-react";

interface GeladeiraDetalhesProps {
  geladeira: Geladeira;
  registros: RegistroTemperatura[];
  anomalias?: Anomalia[];
  onVoltar: () => void;
  onNovaMedicao?: () => void;
}

const FAIXAS_TEMPERATURA = {
  ideal: { min: -25, max: -15, label: "Ideal", color: "text-primary" },
  aceitavel: { min: -30, max: -10, label: "Aceitável", color: "text-accent" },
  atencao: { min: -35, max: 0, label: "Atenção", color: "text-warning" },
  critico: { min: -40, max: 5, label: "Crítico", color: "text-destructive" },
};

function getStatusTemperatura(
  temp: number,
): { color: string; label: string; icon: React.ReactNode } {
  if (temp >= FAIXAS_TEMPERATURA.ideal.min && temp <= FAIXAS_TEMPERATURA.ideal.max) {
    return {
      color: "text-primary",
      label: "Ideal",
      icon: <CheckCircle className="w-4 h-4" />,
    };
  }
  if (temp >= FAIXAS_TEMPERATURA.aceitavel.min && temp <= FAIXAS_TEMPERATURA.aceitavel.max) {
    return {
      color: "text-accent",
      label: "Aceitável",
      icon: <Activity className="w-4 h-4" />,
    };
  }
  if (temp >= FAIXAS_TEMPERATURA.atencao.min && temp <= FAIXAS_TEMPERATURA.atencao.max) {
    return {
      color: "text-warning",
      label: "Atenção",
      icon: <AlertTriangle className="w-4 h-4" />,
    };
  }
  return {
    color: "text-destructive",
    label: "Crítico",
    icon: <AlertTriangle className="w-4 h-4" />,
  };
}

export function GeladeiraDetalhes({
  geladeira,
  registros,
  anomalias = [],
  onVoltar,
  onNovaMedicao,
}: GeladeiraDetalhesProps) {
  const metricas = useMemo(
    () => calcularMetricas(geladeira.id, registros),
    [geladeira.id, registros],
  );

  const historicoOrdenado = useMemo(
    () =>
      [...registros]
        .filter((r) => r.geladeiraId === geladeira.id)
        .sort(
          (a, b) =>
            new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
        ),
    [geladeira.id, registros],
  );

  const ultimaTemperatura = historicoOrdenado[0];
  const status = ultimaTemperatura
    ? getStatusTemperatura(ultimaTemperatura.temperatura)
    : null;

  const anomaliasAtivas = anomalias.filter(
    (a) => a.geladeiraId === geladeira.id && !a.resolvida,
  );

  // Construir eventos históricos combinados
  const eventos: EventoHistorico[] = useMemo(() => {
    const eventosMedicoes = historicoOrdenado.slice(0, 50).map((r) => ({
      id: r.id,
      tipo: "medicao" as const,
      dataHora: r.dataHora,
      detalhes: `Medição registrada: ${r.temperatura}°C`,
      temperatura: r.temperatura,
    }));

    const eventosAnomalias = anomalias
      .filter((a) => a.geladeiraId === geladeira.id)
      .map((a) => ({
        id: a.id,
        tipo: (a.tipo.includes("temperatura")
          ? "anomalia"
          : a.tipo === "manutencao_vencida"
            ? "manutencao"
            : "anomalia") as "medicao" | "anomalia" | "manutencao" | "alerta",
        dataHora: a.dataHora,
        detalhes: a.descricao,
        temperatura: a.valorAtual,
        resolvido: a.resolvida,
      }));

    return [...eventosMedicoes, ...eventosAnomalias]
      .sort(
        (a, b) =>
          new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
      )
      .slice(0, 100);
  }, [geladeira.id, historicoOrdenado, anomalias]);

  // Sugestões baseadas nas anomalias ativas
  const sugestoes = useMemo(() => {
    if (anomaliasAtivas.length === 0) {
      return [
        {
          tipo: "prevencao",
          mensagem: "Manter rotinas de medição em dia para garantir o monitoramento contínuo.",
        },
      ];
    }

    return anomaliasAtivas.map((a) => ({
      tipo: a.tipo,
      mensagem: gerarSugestao(a.tipo, geladeira),
      severidade: a.severidade,
    }));
  }, [anomaliasAtivas, geladeira]);

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={onVoltar} className="mb-2">
            ← Voltar
          </Button>
          <h2 className="text-2xl font-bold">{geladeira.descricao}</h2>
          <div className="flex items-center gap-3 text-muted-foreground mt-1">
            <Badge variant="outline">{geladeira.codigo}</Badge>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {geladeira.local}
            </span>
          </div>
        </div>

        {onNovaMedicao && (
          <Button onClick={onNovaMedicao}>
            <Thermometer className="w-4 h-4 mr-2" />
            Nova Medição
          </Button>
        )}
      </div>

      {/* Status e Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Thermometer className="w-4 h-4" />
              Temperatura Atual
            </div>
            {ultimaTemperatura ? (
              <div className={`text-2xl font-bold mt-1 ${status?.color}`}>
                {ultimaTemperatura.temperatura}°C
              </div>
            ) : (
              <div className="text-2xl font-bold mt-1 text-muted-foreground">
                --
              </div>
            )}
            {status && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${status.color}`}>
                {status.icon}
                {status.label}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Activity className="w-4 h-4" />
              Média
            </div>
            <div className="text-2xl font-bold mt-1">
              {metricas?.mediaTemperatura !== undefined
                ? `${metricas.mediaTemperatura}°C`
                : "--"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="w-4 h-4" />
              Máxima
            </div>
            <div className="text-2xl font-bold mt-1">
              {metricas?.maximaTemperatura !== undefined
                ? `${metricas.maximaTemperatura}°C`
                : "--"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingDown className="w-4 h-4" />
              Mínima
            </div>
            <div className="text-2xl font-bold mt-1">
              {metricas?.minimaTemperatura !== undefined
                ? `${metricas.minimaTemperatura}°C`
                : "--"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomalias Ativas */}
      {anomaliasAtivas.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              Alertas Ativos ({anomaliasAtivas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {anomaliasAtivas.map((anomalia) => (
              <div
                key={anomalia.id}
                className="p-3 bg-background rounded-lg border"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{anomalia.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {anomalia.descricao}
                    </p>
                  </div>
                  <Badge
                    variant={
                      anomalia.severidade === "critical"
                        ? "destructive"
                        : "warning"
                    }
                  >
                    {anomalia.severidade}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs: Métricas, Histórico, Sugestões */}
      <Tabs defaultValue="historico" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="sugestoes">
            <Lightbulb className="w-4 h-4 mr-1" />
            Sugestões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historico" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {eventos.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum registro encontrado
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead className="text-right">Temperatura</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventos.slice(0, 50).map((evento) => (
                        <TableRow
                          key={evento.id}
                          className={
                            evento.tipo !== "medicao"
                              ? "bg-muted/50"
                              : undefined
                          }
                        >
                          <TableCell className="text-sm">
                            {formatarData(evento.dataHora)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {evento.tipo === "medicao" && (
                                <Thermometer className="w-4 h-4 text-primary" />
                              )}
                              {evento.tipo === "anomalia" && (
                                <AlertTriangle className="w-4 h-4 text-destructive" />
                              )}
                              {evento.tipo === "manutencao" && (
                                <Wrench className="w-4 h-4 text-warning" />
                              )}
                              {evento.resolvido !== undefined && (
                                <Badge
                                  variant={
                                    evento.resolvido
                                      ? "secondary"
                                      : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {evento.resolvido ? "Resolvido" : "Pendente"}
                                </Badge>
                              )}
                              <span className="text-sm">{evento.detalhes}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {evento.temperatura !== undefined ? (
                              <Badge variant="outline">
                                {evento.temperatura}°C
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metricas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Estatísticas Detalhadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Total de Registros
                  </p>
                  <p className="text-2xl font-bold">
                    {metricas?.totalRegistros ?? 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Dias Ativo</p>
                  <p className="text-2xl font-bold">{metricas?.diasAtivo ?? 0}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Taxa de Conformidade</span>
                  <span className="font-medium">
                    {metricas?.taxaConformidade ?? 0}%
                  </span>
                </div>
                <Progress
                  value={metricas?.taxaConformidade ?? 0}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  % das medições dentro da faixa ideal (-25°C a -15°C)
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Faixas de Temperatura</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(FAIXAS_TEMPERATURA).map(([key, faixa]) => (
                    <div
                      key={key}
                      className="p-3 rounded-lg border bg-card"
                    >
                      <div className={`text-lg font-bold ${faixa.color}`}>
                        {faixa.label}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {faixa.min}°C a {faixa.max}°C
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sugestoes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sugestoes.map((sugestao, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    sugestao.severidade === "critical"
                      ? "border-destructive/50 bg-destructive/5"
                      : sugestao.severidade === "warning"
                        ? "border-warning/50 bg-warning/5"
                        : "bg-card"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Lightbulb
                      className={`w-5 h-5 mt-0.5 ${
                        sugestao.severidade === "critical"
                          ? "text-destructive"
                          : sugestao.severidade === "warning"
                            ? "text-warning"
                            : "text-primary"
                      }`}
                    />
                    <p className="text-sm">{sugestao.mensagem}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
