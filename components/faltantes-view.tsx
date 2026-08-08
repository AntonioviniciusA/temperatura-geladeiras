"use client";

import { useState, useMemo } from "react";
import type { Geladeira, RegistroTemperatura } from "@/lib/types";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Edit3,
  Check,
  Sparkles,
  Thermometer,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  getMonth,
  getYear,
  addDays,
  subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

interface FaltantesViewProps {
  geladeiras: Geladeira[];
  registros: RegistroTemperatura[];
  onClose: () => void;
  onRegistrar: (
    geladeiraId: string,
    temp: number,
    dataHora?: string,
  ) => Promise<void>;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function FaltantesView({
  geladeiras,
  registros,
  onClose,
  onRegistrar,
}: FaltantesViewProps) {
  const hoje = new Date();
  const ontem = subDays(hoje, 1);

  const [anoSelecionado, setAnoSelecionado] = useState<number>(ontem.getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState<number>(ontem.getMonth());
  const [filtroGeladeira, setFiltroGeladeira] = useState<string>("todos");
  const [editandoDia, setEditandoDia] = useState<{ gid: string; dataISO: string } | null>(null);
  const [editValor, setEditValor] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingDay, setSavingDay] = useState<string | null>(null);
  const { toast } = useToast();

  const anosDisponiveis = useMemo(() => {
    const anos = new Set<number>();
    if (registros.length === 0) return [hoje.getFullYear()];
    registros.forEach((r) => anos.add(getYear(parseISO(r.dataHora))));
    anos.add(hoje.getFullYear());
    anos.add(ontem.getFullYear());
    return Array.from(anos).sort((a, b) => a - b);
  }, [registros]);

  const getTemperaturaDia = (gid: string, data: Date) => {
    const diaISO = data.toISOString().split("T")[0];
    const encontrados = registros.filter((r) => {
      if (r.geladeiraId !== gid) return false;
      return r.dataHora.startsWith(diaISO);
    });
    if (encontrados.length === 0) return null;
    return encontrados.reduce((acc, r) => acc + r.temperatura, 0) / encontrados.length;
  };

  const getSugestaoMedia = (gid: string, data: Date) => {
    const diaAnterior = subDays(data, 1);
    const diaPosterior = addDays(data, 1);
    const tAnterior = getTemperaturaDia(gid, diaAnterior);
    const tPosterior = getTemperaturaDia(gid, diaPosterior);
    const vizinhos: number[] = [];
    if (tAnterior !== null) vizinhos.push(tAnterior);
    if (tPosterior !== null) vizinhos.push(tPosterior);
    if (vizinhos.length === 0) return null;
    return vizinhos.reduce((a, b) => a + b, 0) / vizinhos.length;
  };

  const dadosMes = useMemo(() => {
    if (geladeiras.length === 0) return [];
    const inicio = startOfMonth(new Date(anoSelecionado, mesSelecionado, 1));
    const fim = endOfMonth(inicio);
    const diasDoMes = eachDayOfInterval({ start: inicio, end: fim });
    const geladeirasFiltradas = filtroGeladeira === "todos"
      ? geladeiras
      : geladeiras.filter((g) => g.id === filtroGeladeira);
    const resultado: Array<{
      data: Date;
      dataISO: string;
      porGeladeira: Array<{
        geladeira: Geladeira;
        temperatura: number | null;
        sugestao: number | null;
        idRow: string;
      }>;
      faltantesNoDia: number;
      totalNoDia: number;
    }> = [];
    for (const d of diasDoMes) {
      if (d > ontem) break;
      const porGeladeira = geladeirasFiltradas.map((g) => ({
        geladeira: g,
        temperatura: getTemperaturaDia(g.id, d),
        sugestao: getSugestaoMedia(g.id, d),
        idRow: `${g.id}-${d.toISOString().split("T")[0]}`,
      }));
      const faltantesNoDia = porGeladeira.filter((p) => p.temperatura === null).length;
      resultado.push({
        data: d,
        dataISO: d.toISOString().split("T")[0],
        porGeladeira,
        faltantesNoDia,
        totalNoDia: porGeladeira.length,
      });
    }
    return resultado;
  }, [geladeiras, registros, anoSelecionado, mesSelecionado, filtroGeladeira]);

  const totalRegistrosFaltantes = useMemo(() => {
    return dadosMes.reduce((acc, dia) => acc + dia.faltantesNoDia, 0);
  }, [dadosMes]);

  const totalDiasComFaltantes = useMemo(() => {
    return dadosMes.filter((d) => d.faltantesNoDia > 0).length;
  }, [dadosMes]);

  const diasComFaltantes = useMemo(() => {
    return dadosMes.filter((d) => d.faltantesNoDia > 0);
  }, [dadosMes]);

  const handleAnoAnterior = () => {
    const idx = anosDisponiveis.indexOf(anoSelecionado);
    if (idx > 0) {
      setAnoSelecionado(anosDisponiveis[idx - 1]);
    }
  };

  const handleAnoProximo = () => {
    const idx = anosDisponiveis.indexOf(anoSelecionado);
    if (idx < anosDisponiveis.length - 1) {
      setAnoSelecionado(anosDisponiveis[idx + 1]);
    }
  };

  const handleMesAnterior = () => {
    if (mesSelecionado === 0) {
      if (anosDisponiveis.includes(anoSelecionado - 1)) {
        setMesSelecionado(11);
        setAnoSelecionado(anoSelecionado - 1);
      }
    } else {
      setMesSelecionado(mesSelecionado - 1);
    }
  };

  const handleMesProximo = () => {
    if (mesSelecionado === 11) {
      if (anosDisponiveis.includes(anoSelecionado + 1)) {
        setMesSelecionado(0);
        setAnoSelecionado(anoSelecionado + 1);
      }
    } else {
      setMesSelecionado(mesSelecionado + 1);
    }
  };

  const iniciarEdicao = (gid: string, dataISO: string, sugestao: number | null) => {
    setEditandoDia({ gid, dataISO });
    setEditValor(sugestao !== null ? sugestao.toFixed(1) : "");
  };

  const cancelarEdicao = () => {
    setEditandoDia(null);
    setEditValor("");
  };

  const salvarEdicao = async (gid: string, dataISO: string, usarSugestao: boolean = false) => {
    let tempStr = editValor;
    if (usarSugestao) {
      const s = getSugestaoMedia(gid, parseISO(dataISO));
      if (s === null) {
        toast({ title: "Aviso", description: "Sem dados para média de dias vizinhos" });
        return;
      }
      tempStr = s.toFixed(1);
    }
    const temp = parseFloat(tempStr.replace(",", "."));
    if (isNaN(temp)) {
      toast({ title: "Erro", description: "Temperatura inválida", variant: "destructive" });
      return;
    }
    const rowId = `${gid}-${dataISO}`;
    setSavingId(rowId);
    try {
      await onRegistrar(gid, temp, dataISO);
      toast({
        title: "Sucesso",
        description: `Registro salvo: ${format(parseISO(dataISO), "dd/MM/yyyy", { locale: ptBR })} - ${temp}°C`,
      });
      cancelarEdicao();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const preencherDiaComMedia = async (dia: typeof diasComFaltantes[0]) => {
    if (!confirm(`Preencher ${dia.faltantesNoDia} registro(s) faltante(s) de ${format(dia.data, "dd/MM/yyyy", { locale: ptBR })} com média dos dias vizinhos?`)) return;
    setSavingDay(dia.dataISO);
    let countOk = 0;
    let countFalha = 0;
    for (const p of dia.porGeladeira) {
      if (p.temperatura !== null) continue;
      const sugestao = getSugestaoMedia(p.geladeira.id, dia.data);
      if (sugestao === null) continue;
      try {
        setSavingId(p.idRow);
        await onRegistrar(p.geladeira.id, sugestao, dia.dataISO);
        countOk++;
      } catch {
        countFalha++;
      }
    }
    setSavingId(null);
    setSavingDay(null);
    toast({
      title: format(dia.data, "dd/MM/yyyy", { locale: ptBR }),
      description: `Preenchidos: ${countOk}${countFalha > 0 ? ` | Falhas: ${countFalha}` : ""}`,
    });
  };

  const preencherTodosComMedia = async () => {
    if (!confirm(`Preencher automaticamente ${totalRegistrosFaltantes} registro(s) faltante(s) em ${totalDiasComFaltantes} dia(s) com a média dos dias vizinhos?`)) return;
    let countOk = 0;
    let countFalha = 0;
    for (const dia of diasComFaltantes) {
      for (const p of dia.porGeladeira) {
        if (p.temperatura !== null) continue;
        const sugestao = getSugestaoMedia(p.geladeira.id, dia.data);
        if (sugestao === null) continue;
        try {
          setSavingId(p.idRow);
          await onRegistrar(p.geladeira.id, sugestao, dia.dataISO);
          countOk++;
        } catch {
          countFalha++;
        }
      }
    }
    setSavingId(null);
    toast({
      title: "Concluído",
      description: `Preenchidos: ${countOk} registros em ${totalDiasComFaltantes} dia(s)${countFalha > 0 ? ` | Falhas: ${countFalha}` : ""}`,
    });
  };

  const showGeladeiraCol = filtroGeladeira === "todos" && geladeiras.length > 1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2 flex-wrap">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Dias sem Registro
            {totalDiasComFaltantes > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="destructive">{totalDiasComFaltantes} dias</Badge>
                <Badge variant="warning" className="bg-yellow-500 text-white">
                  {totalRegistrosFaltantes} registros
                </Badge>
              </div>
            )}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleAnoAnterior}
                disabled={anosDisponiveis.indexOf(anoSelecionado) <= 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-bold min-w-[70px] text-center">{anoSelecionado}</h2>
              <Button variant="ghost" size="icon" onClick={handleAnoProximo}
                disabled={anosDisponiveis.indexOf(anoSelecionado) >= anosDisponiveis.length - 1}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <div className="mx-2 h-6 w-px bg-border" />
              <Button variant="ghost" size="icon" onClick={handleMesAnterior}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[110px] text-center">
                {MESES[mesSelecionado]}
              </h2>
              <Button variant="ghost" size="icon" onClick={handleMesProximo}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-[220px]">
                <Select value={filtroGeladeira} onValueChange={setFiltroGeladeira}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as geladeiras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as geladeiras</SelectItem>
                    {geladeiras.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.codigo} - {g.descricao}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                onClick={() => { setFiltroGeladeira("todos"); }}
              >
                <Filter className="w-4 h-4 mr-1" /> Limpar
              </Button>
              {totalRegistrosFaltantes > 0 && (
                <Button onClick={preencherTodosComMedia} className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" /> Preencher todos
                </Button>
              )}
            </div>
          </div>

          {dadosMes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma geladeira selecionada
            </div>
          ) : diasComFaltantes.length === 0 ? (
            <div className="text-center py-6 bg-secondary/30 rounded-lg text-muted-foreground">
              ✅ Nenhum dia faltante para o período selecionado.
            </div>
          ) : (
            <div className="space-y-4">
              {diasComFaltantes.map((dia) => {
                const isWeekend = dia.data.getDay() === 0 || dia.data.getDay() === 6;
                const isSavingDay = savingDay === dia.dataISO;
                return (
                  <Card key={dia.dataISO} className={isWeekend ? "border-yellow-300/50" : ""}>
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 bg-secondary/20">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div>
                          <div className="font-bold text-base">
                            {format(dia.data, "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {format(dia.data, "EEEE", { locale: ptBR })}
                          </div>
                        </div>
                        <Badge variant="destructive">
                          {dia.faltantesNoDia} de {dia.totalNoDia} faltante{dia.faltantesNoDia > 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => preencherDiaComMedia(dia)}
                        disabled={isSavingDay}
                        className="flex items-center gap-1"
                      >
                        <Sparkles className="w-4 h-4" />
                        Preencher dia
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="border rounded-lg overflow-hidden m-3">
                        <table className="w-full text-sm">
                          <thead className="bg-secondary/50">
                            <tr>
                              {showGeladeiraCol && (
                                <th className="px-3 py-2 text-left font-medium">Geladeira</th>
                              )}
                              <th className="px-3 py-2 text-left font-medium">Status</th>
                              <th className="px-3 py-2 text-right font-medium">Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dia.porGeladeira.map((p) => {
                              const isEditing = editandoDia?.gid === p.geladeira.id &&
                                editandoDia?.dataISO === dia.dataISO;
                              const isSaving = savingId === p.idRow;
                              return (
                                <tr key={p.idRow} className={isSaving ? "opacity-50" : ""}>
                                  {showGeladeiraCol && (
                                    <td className="px-3 py-2 border-t">
                                      <div className="font-semibold">{p.geladeira.codigo}</div>
                                      <div className="text-[11px] text-muted-foreground">{p.geladeira.local}</div>
                                    </td>
                                  )}
                                  <td className="px-3 py-2 border-t">
                                    {p.temperatura !== null ? (
                                      <Badge variant="default">
                                        <Thermometer className="w-3 h-3 mr-1" />
                                        {p.temperatura.toFixed(1)}°C
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive">Sem registro</Badge>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 border-t text-right">
                                    {p.temperatura !== null ? (
                                      <span className="text-xs text-muted-foreground">Concluído</span>
                                    ) : isEditing ? (
                                      <div className="flex items-center justify-end gap-1 flex-wrap">
                                        <input
                                          type="number"
                                          step="0.1"
                                          value={editValor}
                                          onChange={(e) => setEditValor(e.target.value)}
                                          className="w-20 px-2 py-1 bg-background border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                          placeholder="Temp"
                                          autoFocus
                                          disabled={isSaving}
                                        />
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          disabled={isSaving}
                                          onClick={() => salvarEdicao(p.geladeira.id, dia.dataISO, true)}
                                          title="Usar média dos vizinhos"
                                        >
                                          <Sparkles className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          disabled={isSaving}
                                          onClick={() => salvarEdicao(p.geladeira.id, dia.dataISO, false)}
                                        >
                                          <Check className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          disabled={isSaving}
                                          onClick={cancelarEdicao}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-end gap-1">
                                        {p.sugestao !== null && (
                                          <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                              if (!confirm(`Usar média dos dias vizinhos (${p.sugestao.toFixed(1)}°C)?`)) return;
                                              setSavingId(p.idRow);
                                              onRegistrar(p.geladeira.id, p.sugestao!, dia.dataISO)
                                                .then(() => toast({
                                                  title: "Sucesso",
                                                  description: `Média aplicada: ${p.sugestao!.toFixed(1)}°C`,
                                                }))
                                                .catch((e) => toast({ title: "Erro", description: e.message, variant: "destructive" }))
                                                .finally(() => setSavingId(null));
                                            }}
                                            title={`Média sugerida: ${p.sugestao.toFixed(1)}°C`}
                                          >
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            {p.sugestao.toFixed(1)}°C
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          onClick={() => iniciarEdicao(p.geladeira.id, dia.dataISO, p.sugestao)}
                                        >
                                          <Edit3 className="w-3 h-3 mr-1" /> Digitar
                                        </Button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
