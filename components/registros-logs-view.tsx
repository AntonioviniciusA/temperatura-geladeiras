"use client";

import { useState } from "react";
import type { RegistroTemperatura, Log } from "@/lib/types";
import { Edit2, Trash2, History, ClipboardList, X, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface RegistrosLogsViewProps {
  registros: (RegistroTemperatura & { geladeiraCodigo?: string })[];
  logs: Log[];
  onUpdate: (id: string, temp: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onFillMissing?: (geladeiraId: string, dateISO: string) => Promise<void>;
}

export function RegistrosLogsView({ registros, logs, onUpdate, onDelete, onFillMissing }: RegistrosLogsViewProps) {
  const [activeTab, setActiveTab] = useState<"registros" | "logs">("registros");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTemp, setEditTemp] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Cálculo de dias faltantes por geladeira para o mês atual
  const missingByGeladeira = (() => {
    if (!registros || registros.length === 0) return new Map<string, string[]>();

    // Primeiro registro no BD
    const first = registros.reduce((acc, r) => {
      const d = new Date(r.dataHora);
      if (!acc || d.getTime() < acc.getTime()) return d;
      return acc;
    }, null as Date | null);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Determine dia de início: usa o dia do primeiro registro no BD
    const startDay = first ? first.getDate() : 1;
    const startDate = new Date(today.getFullYear(), today.getMonth(), startDay);
    if (startDate > yesterday) return new Map<string, string[]>();

    // Lista de datas (YYYY-MM-DD) entre startDate e ontem
    const dates: string[] = [];
    for (let d = new Date(startDate); d <= yesterday; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    // Agrupa registros por geladeira e por dia
    const byGel = new Map<string, Set<string>>();
    registros.forEach((r) => {
      const gid = r.geladeiraId;
      const day = new Date(r.dataHora).toISOString().split('T')[0];
      if (!byGel.has(gid)) byGel.set(gid, new Set());
      byGel.get(gid)!.add(day);
    });

    // Para cada geladeira presente nos registros, ver dias faltantes
    const missing = new Map<string, string[]>();
    byGel.forEach((setDays, gid) => {
      const faltantes = dates.filter((d) => !setDays.has(d));
      if (faltantes.length > 0) missing.set(gid, faltantes);
    });

    return missing;
  })();

  const handleEdit = (reg: RegistroTemperatura) => {
    setEditingId(reg.id);
    setEditTemp(reg.temperatura.toString());
  };

  const handleSave = async (id: string) => {
    const temp = parseFloat(editTemp);
    if (isNaN(temp)) {
      toast({ title: "Erro", description: "Temperatura inválida", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await onUpdate(id, temp);
      setEditingId(null);
      toast({ title: "Sucesso", description: "Registro atualizado" });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao atualizar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    setLoading(true);
    try {
      await onDelete(id);
      toast({ title: "Sucesso", description: "Registro excluído" });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("registros")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 transition-colors ${
            activeTab === "registros" ? "bg-primary/5 text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-secondary/50"
          }`}
        >
          <ClipboardList className="w-4 h-4" /> Registros
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 transition-colors ${
            activeTab === "logs" ? "bg-primary/5 text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-secondary/50"
          }`}
        >
          <History className="w-4 h-4" /> Logs
        </button>
      </div>

      <div className="p-4 max-h-[500px] overflow-y-auto">
        {activeTab === "registros" ? (
          <div className="space-y-3">
            {missingByGeladeira.size > 0 && (
              <div className="mb-3 p-3 bg-secondary/10 border border-border rounded-lg">
                <h4 className="font-semibold mb-2">Dias faltantes (mês atual)</h4>
                <div className="space-y-2">
                  {Array.from(missingByGeladeira.entries()).map(([gid, days]) => (
                    <div key={gid} className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">Geladeira:</span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{gid}</span>
                      <div className="flex gap-2 flex-wrap">
                        {days.map((d) => (
                          <button
                            key={d}
                            onClick={async () => {
                              if (!confirm(`Preencher temperatura para ${d}?`)) return;
                              if (typeof onFillMissing === 'function') {
                                try {
                                  await onFillMissing(gid, d);
                                } catch (err: any) {
                                  toast({ title: 'Erro', description: err.message, variant: 'destructive' });
                                }
                              } else {
                                toast({ title: 'Info', description: 'Função de preenchimento não disponível' });
                              }
                            }}
                            className="px-2 py-1 text-sm bg-accent/10 text-accent rounded-md"
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {registros.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhum registro encontrado</p>
            ) : (
              registros.map((reg) => (
                <div key={reg.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {reg.geladeiraCodigo || "Desconhecida"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(reg.dataHora).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    {editingId === reg.id ? (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={editTemp}
                          onChange={(e) => setEditTemp(e.target.value)}
                          className="w-20 px-2 py-1 bg-background border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          autoFocus
                        />
                        <button onClick={() => handleSave(reg.id)} disabled={loading} className="p-1 text-accent hover:bg-accent/10 rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} disabled={loading} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="font-semibold text-lg mt-0.5">{reg.temperatura}°C</p>
                    )}
                  </div>
                  {!editingId && (
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(reg)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(reg.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhum log encontrado</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3 bg-secondary/20 rounded-xl border border-border/30 text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-primary">{log.acao}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(log.dataHora).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{log.detalhes}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
