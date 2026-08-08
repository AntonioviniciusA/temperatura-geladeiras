"use client";

import { useState, useMemo, useEffect } from "react";
import type { Geladeira, RegistroTemperatura } from "@/lib/types";
import { Thermometer, X, ChevronLeft, ChevronRight, Calendar, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  format,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  getMonth,
  getYear,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface PublicRegistro extends RegistroTemperatura {
  geladeiraCodigo?: string;
  geladeiraDescricao?: string;
  geladeiraLocal?: string;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function PublicoPage() {
  const [geladeiras, setGeladeiras] = useState<Geladeira[]>([]);
  const [registros, setRegistros] = useState<PublicRegistro[]>([]);
  const [geradoEm, setGeradoEm] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mesSelecionado, setMesSelecionado] = useState<string | null>(null);
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear());
  const [filtroGeladeira, setFiltroGeladeira] = useState<string>("todos");
  const [filtroDia, setFiltroDia] = useState<string>("todos");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);
      const res = await fetch("/api/public");
      if (!res.ok) throw new Error("Erro ao carregar dados");
      const data = await res.json();
      setGeladeiras(data.geladeiras || []);
      setRegistros(data.registros || []);
      setGeradoEm(data.geradoEm);
    } catch (err: any) {
      setErro(err.message || "Erro desconhecido");
    } finally {
      setCarregando(false);
    }
  }

  const mediasPorGeladeira = useMemo(() => {
    const medias = new Map<string, number>();
    geladeiras.forEach((g) => {
      const registrosGeladeira = registros.filter((r) => r.geladeiraId === g.id);
      if (registrosGeladeira.length > 0) {
        const soma = registrosGeladeira.reduce((acc, r) => acc + r.temperatura, 0);
        medias.set(g.id, soma / registrosGeladeira.length);
      }
    });
    return medias;
  }, [geladeiras, registros]);

  const anosDisponiveis = useMemo(() => {
    const anos = new Set<number>();
    registros.forEach((r) => anos.add(getYear(parseISO(r.dataHora))));
    return Array.from(anos).sort((a, b) => a - b);
  }, [registros]);

  const mesesDisponiveis = useMemo(() => {
    const meses = new Set<number>();
    registros.forEach((r) => {
      const data = parseISO(r.dataHora);
      if (getYear(data) === anoSelecionado) meses.add(getMonth(data));
    });
    return Array.from(meses).sort((a, b) => a - b);
  }, [registros, anoSelecionado]);

  const diasDisponiveis = useMemo(() => {
    if (!mesSelecionado) return [];
    const dias = new Set<number>();
    const mesIndex = MESES.indexOf(mesSelecionado);
    registros.forEach((r) => {
      const data = parseISO(r.dataHora);
      if (getYear(data) === anoSelecionado && getMonth(data) === mesIndex) {
        dias.add(data.getDate());
      }
    });
    return Array.from(dias).sort((a, b) => a - b);
  }, [registros, mesSelecionado, anoSelecionado]);

  const getStatus = (temp: number, geladeiraId: string) => {
    const media = mediasPorGeladeira.get(geladeiraId);
    if (media === undefined) {
      if (temp <= -15) return { variant: "default" as const, label: "Ideal" };
      if (temp <= -10) return { variant: "secondary" as const, label: "Aceitável" };
      if (temp <= 0) return { variant: "warning" as const, label: "Atenção" };
      return { variant: "destructive" as const, label: "Crítico" };
    }
    const diff = temp - media;
    if (diff <= 2) return { variant: "default" as const, label: "Ideal" };
    if (diff <= 5) return { variant: "secondary" as const, label: "Aceitável" };
    if (diff <= 10) return { variant: "warning" as const, label: "Atenção" };
    return { variant: "destructive" as const, label: "Crítico" };
  };

  const registrosFiltrados = useMemo(() => {
    if (!mesSelecionado) return [];
    const mesIndex = MESES.indexOf(mesSelecionado);
    const inicioMes = startOfMonth(new Date(anoSelecionado, mesIndex, 1));
    const fimMes = endOfMonth(inicioMes);
    return registros
      .filter((r) => {
        const data = parseISO(r.dataHora);
        if (!isWithinInterval(data, { start: inicioMes, end: fimMes })) return false;
        if (filtroGeladeira !== "todos" && r.geladeiraId !== filtroGeladeira) return false;
        if (filtroDia !== "todos" && data.getDate() !== parseInt(filtroDia)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  }, [registros, mesSelecionado, anoSelecionado, filtroGeladeira, filtroDia]);

  const resumoMensal = useMemo(() => {
    if (!mesSelecionado) return { total: 0, media: null, min: null, max: null };
    const mesIndex = MESES.indexOf(mesSelecionado);
    const inicioMes = startOfMonth(new Date(anoSelecionado, mesIndex, 1));
    const fimMes = endOfMonth(inicioMes);
    const noMes = registros.filter((r) => {
      const data = parseISO(r.dataHora);
      return isWithinInterval(data, { start: inicioMes, end: fimMes }) &&
        (filtroGeladeira === "todos" || r.geladeiraId === filtroGeladeira);
    });
    if (noMes.length === 0) return { total: 0, media: null, min: null, max: null };
    const temps = noMes.map((r) => r.temperatura);
    return {
      total: noMes.length,
      media: temps.reduce((a, b) => a + b, 0) / temps.length,
      min: Math.min(...temps),
      max: Math.max(...temps),
    };
  }, [registros, mesSelecionado, anoSelecionado, filtroGeladeira]);

  const handleAnoAnterior = () => {
    const idx = anosDisponiveis.indexOf(anoSelecionado);
    if (idx > 0) {
      setAnoSelecionado(anosDisponiveis[idx - 1]);
      setMesSelecionado(null);
      setFiltroGeladeira("todos");
      setFiltroDia("todos");
    }
  };

  const handleAnoProximo = () => {
    const idx = anosDisponiveis.indexOf(anoSelecionado);
    if (idx < anosDisponiveis.length - 1) {
      setAnoSelecionado(anosDisponiveis[idx + 1]);
      setMesSelecionado(null);
      setFiltroGeladeira("todos");
      setFiltroDia("todos");
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2 text-muted-foreground">
          <Thermometer className="w-6 h-6 animate-spin" />
          <span>Carregando registros...</span>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p className="font-semibold mb-2">Erro ao carregar</p>
              <p className="text-sm text-muted-foreground mb-4">{erro}</p>
              <Button onClick={carregarDados}>Tentar novamente</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Registro de Temperaturas</h1>
              <p className="text-xs text-muted-foreground">
                Visualização pública para fiscalização
              </p>
            </div>
          </div>
          {geradoEm && (
            <div className="text-xs text-muted-foreground text-right hidden sm:block">
              Dados atualizados em
              <br />
              {format(parseISO(geradoEm), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {mesSelecionado && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Registros</p>
                <p className="text-xl font-bold">{resumoMensal.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Média</p>
                <p className="text-xl font-bold">
                  {resumoMensal.media !== null ? `${resumoMensal.media.toFixed(1)}°C` : "-"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Mínima</p>
                <p className="text-xl font-bold text-primary">
                  {resumoMensal.min !== null ? `${resumoMensal.min.toFixed(1)}°C` : "-"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Máxima</p>
                <p className="text-xl font-bold text-destructive">
                  {resumoMensal.max !== null ? `${resumoMensal.max.toFixed(1)}°C` : "-"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAnoAnterior}
                disabled={anosDisponiveis.indexOf(anoSelecionado) <= 0}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <CardTitle className="text-xl font-bold">{anoSelecionado}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAnoProximo}
                disabled={anosDisponiveis.indexOf(anoSelecionado) >= anosDisponiveis.length - 1}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!mesSelecionado ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {MESES.map((mes, index) => {
                  const temRegistros = mesesDisponiveis.includes(index);
                  return (
                    <Button
                      key={mes}
                      variant={temRegistros ? "default" : "ghost"}
                      disabled={!temRegistros}
                      onClick={() => {
                        setMesSelecionado(mes);
                        setFiltroGeladeira("todos");
                        setFiltroDia("todos");
                      }}
                      className={`h-16 text-lg ${!temRegistros ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {mes}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-6">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2"
                  onClick={() => {
                    setMesSelecionado(null);
                    setFiltroGeladeira("todos");
                    setFiltroDia("todos");
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar para meses
                </Button>

                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium mb-1">
                      Filtrar por Geladeira
                    </label>
                    <Select value={filtroGeladeira} onValueChange={setFiltroGeladeira}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as geladeiras" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas as geladeiras</SelectItem>
                        {geladeiras.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.codigo} - {g.descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-medium mb-1">
                      Filtrar por Dia
                    </label>
                    <Select value={filtroDia} onValueChange={setFiltroDia}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os dias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os dias</SelectItem>
                        {diasDisponiveis.map((dia) => (
                          <SelectItem key={dia} value={dia.toString()}>
                            Dia {dia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setFiltroGeladeira("todos");
                      setFiltroDia("todos");
                    }}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Limpar filtros
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Geladeira</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead>Temperatura</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrosFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Nenhum registro encontrado para os filtros selecionados
                          </TableCell>
                        </TableRow>
                      ) : (
                        registrosFiltrados.map((registro) => {
                          const status = getStatus(registro.temperatura, registro.geladeiraId);
                          return (
                            <TableRow key={registro.id}>
                              <TableCell>
                                {format(parseISO(registro.dataHora), "dd/MM/yyyy HH:mm", {
                                  locale: ptBR,
                                })}
                              </TableCell>
                              <TableCell className="font-medium">
                                {registro.geladeiraCodigo}
                              </TableCell>
                              <TableCell className="text-sm">{registro.geladeiraDescricao}</TableCell>
                              <TableCell className="text-sm">{registro.geladeiraLocal}</TableCell>
                              <TableCell className="font-semibold">{registro.temperatura}°C</TableCell>
                              <TableCell>
                                <Badge variant={status.variant}>{status.label}</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground pb-8">
          <Calendar className="w-4 h-4 inline mr-1" />
          Sistema de Controle de Temperatura de Geladeiras
          {geradoEm && ` • Dados de ${format(parseISO(geradoEm), "dd/MM/yyyy", { locale: ptBR })}`}
        </div>
      </div>
    </main>
  );
}
