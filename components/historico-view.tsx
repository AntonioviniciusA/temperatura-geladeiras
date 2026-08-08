"use client";

import { useState, useMemo } from "react";
import type { Geladeira, RegistroTemperatura } from "@/lib/types";
import { Calendar, Filter, X, ChevronLeft, ChevronRight, Edit2, Trash2, Check } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";

interface HistoricoViewProps {
  geladeiras: Geladeira[];
  registros: RegistroTemperatura[];
  onClose: () => void;
  onUpdate?: (id: string, temp: number) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function HistoricoView({
  geladeiras,
  registros,
  onClose,
  onUpdate,
  onDelete,
}: HistoricoViewProps) {
  const [mesSelecionado, setMesSelecionado] = useState<string | null>(null);
  const [anoSelecionado, setAnoSelecionado] = useState<number>(
    new Date().getFullYear(),
  );
  const [filtroGeladeira, setFiltroGeladeira] = useState<string>("todos");
  const [filtroDia, setFiltroDia] = useState<string>("todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTemp, setEditTemp] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();

  const mediasPorGeladeira = useMemo(() => {
    const medias = new Map<string, number>();
    geladeiras.forEach((g) => {
      const registrosGeladeira = registros.filter(
        (r) => r.geladeiraId === g.id,
      );
      if (registrosGeladeira.length > 0) {
        const soma = registrosGeladeira.reduce(
          (acc, r) => acc + r.temperatura,
          0,
        );
        const media = soma / registrosGeladeira.length;
        medias.set(g.id, media);
      }
    });
    return medias;
  }, [geladeiras, registros]);

  const anosDisponiveis = useMemo(() => {
    const anos = new Set<number>();
    registros.forEach((r) => {
      const data = parseISO(r.dataHora);
      anos.add(getYear(data));
    });
    return Array.from(anos).sort((a, b) => a - b);
  }, [registros]);

  const mesesDisponiveis = useMemo(() => {
    const meses = new Set<number>();
    registros.forEach((r) => {
      const data = parseISO(r.dataHora);
      if (getYear(data) === anoSelecionado) {
        meses.add(getMonth(data));
      }
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
      if (temp <= -10)
        return { variant: "secondary" as const, label: "Aceitável" };
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

        if (!isWithinInterval(data, { start: inicioMes, end: fimMes })) {
          return false;
        }

        if (filtroGeladeira !== "todos" && r.geladeiraId !== filtroGeladeira) {
          return false;
        }

        if (filtroDia !== "todos" && data.getDate() !== parseInt(filtroDia)) {
          return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
      );
  }, [registros, mesSelecionado, anoSelecionado, filtroGeladeira, filtroDia]);

  const getGeladeiraInfo = (id: string) => {
    return (
      geladeiras.find((g) => g.id === id) || {
        codigo: "Desconhecido",
        descricao: "",
        local: "",
      }
    );
  };

  const handleAnoAnterior = () => {
    if (anosDisponiveis.length > 0) {
      const index = anosDisponiveis.indexOf(anoSelecionado);
      if (index > 0) {
        setAnoSelecionado(anosDisponiveis[index - 1]);
        setMesSelecionado(null);
        setFiltroGeladeira("todos");
        setFiltroDia("todos");
      }
    }
  };

  const handleAnoProximo = () => {
    if (anosDisponiveis.length > 0) {
      const index = anosDisponiveis.indexOf(anoSelecionado);
      if (index < anosDisponiveis.length - 1) {
        setAnoSelecionado(anosDisponiveis[index + 1]);
        setMesSelecionado(null);
        setFiltroGeladeira("todos");
        setFiltroDia("todos");
      }
    }
  };

  const handleEdit = (reg: RegistroTemperatura) => {
    setEditingId(reg.id);
    setEditTemp(reg.temperatura.toString());
  };

  const handleSaveEdit = async (id: string) => {
    if (!onUpdate) return;
    const temp = parseFloat(editTemp.replace(",", "."));
    if (isNaN(temp)) {
      toast({ title: "Erro", description: "Temperatura inválida", variant: "destructive" });
      return;
    }
    setSavingId(id);
    try {
      await onUpdate(id, temp);
      setEditingId(null);
      toast({ title: "Sucesso", description: "Registro atualizado" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Falha ao atualizar", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    setSavingId(id);
    try {
      await onDelete(id);
      toast({ title: "Sucesso", description: "Registro excluído" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Falha ao excluir", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <Card className="w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">
            Histórico de Registros
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-6">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAnoAnterior}
              disabled={anosDisponiveis.indexOf(anoSelecionado) <= 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-2xl font-bold">{anoSelecionado}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAnoProximo}
              disabled={
                anosDisponiveis.indexOf(anoSelecionado) >=
                anosDisponiveis.length - 1
              }
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

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
                  <Select
                    value={filtroGeladeira}
                    onValueChange={setFiltroGeladeira}
                  >
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
                      <TableHead>Local</TableHead>
                      <TableHead>Temperatura</TableHead>
                      <TableHead>Status</TableHead>
                      {(onUpdate || onDelete) && <TableHead className="w-[110px]">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={onUpdate || onDelete ? 6 : 5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Nenhum registro encontrado para os filtros
                          selecionados
                        </TableCell>
                      </TableRow>
                    ) : (
                      registrosFiltrados.map((registro) => {
                        const geladeira = getGeladeiraInfo(
                          registro.geladeiraId,
                        );
                        const status = getStatus(
                          registro.temperatura,
                          registro.geladeiraId,
                        );
                        const isEditing = editingId === registro.id;
                        const isSaving = savingId === registro.id;
                        return (
                          <TableRow key={registro.id} className={isSaving ? "opacity-50" : ""}>
                            <TableCell>
                              {format(
                                parseISO(registro.dataHora),
                                "dd/MM/yyyy HH:mm",
                                { locale: ptBR },
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {geladeira.codigo}
                            </TableCell>
                            <TableCell>{geladeira.local}</TableCell>
                            <TableCell className="font-semibold">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={editTemp}
                                    onChange={(e) => setEditTemp(e.target.value)}
                                    className="w-20 px-2 py-1 bg-background border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    autoFocus
                                    disabled={isSaving}
                                  />
                                  <span>°C</span>
                                </div>
                              ) : (
                                <>{registro.temperatura}°C</>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>
                                {status.label}
                              </Badge>
                            </TableCell>
                            {(onUpdate || onDelete) && (
                              <TableCell>
                                <div className="flex items-center gap-1 justify-end">
                                  {isEditing ? (
                                    <>
                                      {onUpdate && (
                                        <Button
                                          size="icon"
                                          variant="default"
                                          disabled={isSaving}
                                          onClick={() => handleSaveEdit(registro.id)}
                                          title="Salvar"
                                        >
                                          <Check className="w-4 h-4" />
                                        </Button>
                                      )}
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        disabled={isSaving}
                                        onClick={() => setEditingId(null)}
                                        title="Cancelar"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      {onUpdate && (
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          disabled={isSaving}
                                          onClick={() => handleEdit(registro)}
                                          title="Editar temperatura"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </Button>
                                      )}
                                      {onDelete && (
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          disabled={isSaving}
                                          onClick={() => handleDelete(registro.id)}
                                          title="Excluir registro"
                                          className="hover:bg-destructive/10 hover:text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            )}
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
    </div>
  );
}
