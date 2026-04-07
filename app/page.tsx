// app/page.tsx
"use client";

import { useState, useMemo } from "react";
import type { Geladeira } from "@/lib/types";
import { useGeladeiras } from "@/hooks/use-geladeiras";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/components/ui/use-toast";
import { GeladeiraCard } from "@/components/geladeira-card";
import { GeladeiraForm } from "@/components/geladeira-form";
import { MedicaoWizard } from "@/components/medicao-wizard";
import { NotificationSettings } from "@/components/notification-settings";
import {
  Thermometer,
  Plus,
  PlayCircle,
  Snowflake,
  Download,
} from "lucide-react";

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [showMedicao, setShowMedicao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    geladeiras,
    medicaoHoje,
    isLoaded,
    error: hookError,
    salvarGeladeira,
    removerGeladeira,
    registrarTemperatura,
    getGeladeirasPendentes,
    getUltimaTemperatura,
    exportarCSV,
  } = useGeladeiras();

  const {
    permission,
    notificationTime,
    isSupported,
    requestPermission,
    updateNotificationTime,
  } = useNotifications();

  // Cache das pendentes: quando o wizard abre, capturamos a lista naquele momento e não muda
  const [cachedPendentes, setCachedPendentes] = useState<Geladeira[]>([]);
  const iniciarMedicao = () => {
    setCachedPendentes(getGeladeirasPendentes());
    setShowMedicao(true);
  };

  const geladeirasPendentes = getGeladeirasPendentes();
  const todasMedidas = medicaoHoje?.concluida || false;
  const exibirErro = error || hookError;
  const isLoadError = hookError && !error;

  const ultimasTemperaturasMap = useMemo(() => {
    const map = new Map();
    geladeiras.forEach((g) => map.set(g.id, getUltimaTemperatura(g.id)));
    return map;
  }, [geladeiras, getUltimaTemperatura]);

  const handleSalvarGeladeira = async (
    data: Omit<Geladeira, "id" | "criadoEm">,
  ) => {
    setSalvando(true);
    try {
      await salvarGeladeira(data);
      toast({ title: "Sucesso", description: "Geladeira cadastrada" });
      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleRemoverGeladeira = async (id: string) => {
    setRemovendoId(id);
    try {
      await removerGeladeira(id);
      toast({ title: "Removida", description: "Geladeira removida" });
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setRemovendoId(null);
    }
  };

  const handleRegistrarTemperatura = async (id: string, temp: number) => {
    try {
      await registrarTemperatura(id, temp);
    } catch (err: any) {
      toast({
        title: "Erro na medição",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2 text-muted-foreground">
          <Snowflake className="w-6 h-6 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">
                Controle de Geladeiras
              </h1>
              <p className="text-xs text-muted-foreground">
                Monitoramento de Temperatura
              </p>
            </div>
          </div>
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
            title="Exportar CSV"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {exibirErro && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-3 text-sm flex justify-between">
            <span>{exibirErro}</span>
            {isLoadError && (
              <button
                onClick={() => window.location.reload()}
                className="underline"
              >
                Recarregar
              </button>
            )}
            {!isLoadError && <button onClick={() => setError(null)}>✕</button>}
          </div>
        )}
        {/* Status do dia */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Medição de Hoje</p>
              <p className="text-lg font-semibold">
                {geladeiras.length === 0
                  ? "Nenhuma geladeira"
                  : todasMedidas
                    ? "Todas medidas"
                    : `${geladeirasPendentes.length} de ${geladeiras.length} pendentes`}
              </p>
            </div>
            {geladeiras.length > 0 && !todasMedidas && (
              <button
                onClick={iniciarMedicao}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl"
              >
                <PlayCircle className="w-5 h-5" /> Iniciar
              </button>
            )}
            {todasMedidas && geladeiras.length > 0 && (
              <div className="px-4 py-2 bg-accent/20 text-accent rounded-xl">
                Concluído
              </div>
            )}
          </div>
          {geladeiras.length > 0 && (
            <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{
                  width: `${((geladeiras.length - geladeirasPendentes.length) / geladeiras.length) * 100}%`,
                }}
              />
            </div>
          )}
        </div>
        <NotificationSettings
          permission={permission}
          notificationTime={notificationTime}
          isSupported={isSupported}
          onRequestPermission={requestPermission} // ← mapeamento correto
          onUpdateTime={updateNotificationTime} // ← mapeamento correto
        />
        <section>
          <div className="flex justify-between mb-4">
            <h2 className="font-semibold">Geladeiras ({geladeiras.length})</h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="text-primary flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            )}
          </div>
          <div className="space-y-3">
            {showForm && (
              <GeladeiraForm
                onSalvar={handleSalvarGeladeira}
                onCancelar={() => setShowForm(false)}
                isLoading={salvando}
              />
            )}
            {geladeiras.length === 0 && !showForm ? (
              <div className="text-center p-8 border border-dashed rounded-xl">
                <Snowflake className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 mb-4">Nenhuma geladeira cadastrada</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
                >
                  Cadastrar Primeira
                </button>
              </div>
            ) : (
              geladeiras.map((g) => (
                <GeladeiraCard
                  key={g.id}
                  geladeira={g}
                  ultimaTemperatura={ultimasTemperaturasMap.get(g.id) || null}
                  onRemover={handleRemoverGeladeira}
                  isRemovendo={removendoId === g.id}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {showMedicao && cachedPendentes.length > 0 && (
        <MedicaoWizard
          geladeiras={cachedPendentes}
          onRegistrar={handleRegistrarTemperatura}
          onFechar={() => setShowMedicao(false)}
        />
      )}
    </main>
  );
}
