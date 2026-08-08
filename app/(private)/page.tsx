// app/page.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import type { Geladeira } from "@/lib/types";
import { useGeladeiras } from "@/hooks/use-geladeiras";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/components/ui/use-toast";
import { GeladeiraCard } from "@/components/geladeira-card";
import { GeladeiraForm } from "@/components/geladeira-form";
import { MedicaoWizard } from "@/components/medicao-wizard";
import { NotificationSettings } from "@/components/notification-settings";
import { RegistrosLogsView } from "@/components/registros-logs-view";
import { HistoricoView } from "@/components/historico-view";
import { QRCodeDialog } from "@/components/qrcode-dialog";
import { FaltantesView } from "@/components/faltantes-view";
import { DashboardAlertas } from "@/components/dashboard-alertas";
import { GeladeiraDetalhes } from "@/components/geladeira-detalhes";
import {
  Thermometer,
  Plus,
  PlayCircle,
  Snowflake,
  Download,
  LogOut,
  ChevronDown,
  ChevronUp,
  History,
  Calendar as CalendarIcon,
  QrCode,
  AlertTriangle,
  Bell,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [showMedicao, setShowMedicao] = useState(false);
  const [showRegistros, setShowRegistros] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showFaltantes, setShowFaltantes] = useState(false);
  const [showAlertas, setShowAlertas] = useState(false);
  const [showDetalhesGeladeira, setShowDetalhesGeladeira] = useState(false);
  const [detalhesGeladeiraId, setDetalhesGeladeiraId] = useState<string | null>(
    null,
  );
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    geladeiras,
    registros,
    logs,
    medicaoHoje,
    isLoaded,
    error: hookError,
    salvarGeladeira,
    removerGeladeira,
    reordenarGeladeira,
    registrarTemperatura,
    atualizarRegistro,
    excluirRegistro,
    getGeladeirasPendentes,
    getHistoricoGeladeira,
    getUltimaTemperatura,
    getStatusPorGeladeira,
    mediasPorGeladeira,
    exportarCSV,
    carregarDados,
  } = useGeladeiras();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  };

  const handleVerDetalhesGeladeira = useCallback((geladeiraId: string) => {
    setDetalhesGeladeiraId(geladeiraId);
    setShowDetalhesGeladeira(true);
    setShowAlertas(false);
  }, []);

  const handleFecharDetalhes = useCallback(() => {
    setShowDetalhesGeladeira(false);
    setDetalhesGeladeiraId(null);
  }, []);

  const handleRecarregarDados = useCallback(async () => {
    try {
      await carregarDados();
      toast({
        title: "Atualizado",
        description: "Dados atualizados com sucesso",
      });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [carregarDados, toast]);

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
    data: Omit<Geladeira, "id" | "criadoEm" | "ordem">,
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
    if (
      !confirm(
        "Tem certeza que deseja remover esta geladeira? Todos os registros serão perdidos.",
      )
    )
      return;
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

  const handleReordenarGeladeira = async (
    id: string,
    direcao: "cima" | "baixo",
  ) => {
    try {
      await reordenarGeladeira(id, direcao);
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleRegistrarTemperatura = async (
    id: string,
    temp: number,
    dataHora?: string,
  ) => {
    try {
      await registrarTemperatura(id, temp, dataHora);
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
          <div className="flex items-center gap-2">
            <button
              onClick={exportarCSV}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              title="Exportar CSV"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
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

        {/* Botões de Ações */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              onClick={() => setShowAlertas(!showAlertas)}
              className={`flex flex-col items-center justify-center gap-2 p-4 border rounded-xl transition-colors ${
                showAlertas
                  ? "bg-destructive/10 border-destructive/50"
                  : "bg-card hover:bg-secondary/20"
              }`}
            >
              <div className="relative">
                <Bell className="w-5 h-5 text-destructive" />
              </div>
              <span className="font-semibold text-sm">Alertas</span>
            </button>
            <button
              onClick={() => setShowHistorico(true)}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-card border rounded-xl hover:bg-secondary/20 transition-colors"
            >
              <CalendarIcon className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">Histórico</span>
            </button>
            <button
              onClick={() => setShowFaltantes(true)}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-card border rounded-xl hover:bg-secondary/20 transition-colors"
            >
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span className="font-semibold text-sm">Dias Faltantes</span>
            </button>
            <button
              onClick={() => setShowQRCode(true)}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-card border rounded-xl hover:bg-secondary/20 transition-colors"
            >
              <QrCode className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">QR Code</span>
            </button>
            <button
              onClick={() => setShowRegistros(!showRegistros)}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-card border rounded-xl hover:bg-secondary/20 transition-colors"
            >
              <History className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">Logs</span>
            </button>
          </div>
        </section>

        {/* Dashboard de Alertas */}
        {showAlertas && !showDetalhesGeladeira && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <DashboardAlertas
              geladeiras={geladeiras}
              registros={registros}
              onVerDetalhes={handleVerDetalhesGeladeira}
              autoRefresh={true}
              intervaloRefresh={5 * 60 * 1000}
            />
          </div>
        )}

        {/* Detalhes da Geladeira */}
        {showDetalhesGeladeira && detalhesGeladeiraId && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <GeladeiraDetalhes
              geladeira={geladeiras.find((g) => g.id === detalhesGeladeiraId)!}
              registros={registros}
              onVoltar={handleFecharDetalhes}
              onNovaMedicao={() => {
                handleFecharDetalhes();
                setShowMedicao(true);
              }}
            />
          </div>
        )}

        {/* Histórico e Logs (desatualizado, mantido por compatibilidade) */}
        {showRegistros && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <RegistrosLogsView
              registros={registros as any}
              logs={logs}
              onUpdate={atualizarRegistro}
              onDelete={excluirRegistro}
              onFillMissing={async (geladeiraId: string, date: string) => {
                const input = prompt(
                  `Preencher temperatura para ${date} (use ponto decimal).`,
                );
                if (!input) return;
                const temp = parseFloat(input.replace(",", "."));
                if (isNaN(temp)) {
                  alert("Temperatura inválida");
                  return;
                }
                try {
                  await registrarTemperatura(geladeiraId, temp, date);
                  toast({
                    title: "Sucesso",
                    description: `Registro criado para ${date}`,
                  });
                } catch (err: any) {
                  toast({
                    title: "Erro",
                    description: err.message,
                    variant: "destructive",
                  });
                }
              }}
            />
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
          onRequestPermission={requestPermission}
          onUpdateTime={updateNotificationTime}
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
              geladeiras.map((g, index) => (
                <GeladeiraCard
                  key={g.id}
                  geladeira={g}
                  ultimaTemperatura={ultimasTemperaturasMap.get(g.id)}
                  mediaTemperatura={mediasPorGeladeira.get(g.id)}
                  getStatus={getStatusPorGeladeira}
                  onRemover={handleRemoverGeladeira}
                  onReordenar={handleReordenarGeladeira}
                  onVerDetalhes={handleVerDetalhesGeladeira}
                  isRemovendo={removendoId === g.id}
                  isPrimeiro={index === 0}
                  isUltimo={index === geladeiras.length - 1}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {showMedicao && (
        <MedicaoWizard
          geladeiras={cachedPendentes}
          onRegistrar={handleRegistrarTemperatura}
          onFechar={() => setShowMedicao(false)}
        />
      )}

      {showHistorico && (
        <HistoricoView
          geladeiras={geladeiras}
          registros={registros}
          onClose={() => setShowHistorico(false)}
          onUpdate={atualizarRegistro}
          onDelete={excluirRegistro}
        />
      )}

      {showQRCode && (
        <QRCodeDialog open={showQRCode} onClose={() => setShowQRCode(false)} />
      )}

      {showFaltantes && (
        <FaltantesView
          geladeiras={geladeiras}
          registros={registros}
          onClose={() => setShowFaltantes(false)}
          onRegistrar={registrarTemperatura}
        />
      )}
    </main>
  );
}
