// components/dashboard-alertas.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  Geladeira,
  RegistroTemperatura,
  Alerta,
  FiltroAlertas,
  TipoAnomalia,
  SeveridadeAlerta,
} from "@/lib/types";
import { useAlertas } from "@/hooks/use-alertas";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Filter,
  RefreshCw,
  X,
  Check,
  Thermometer,
  Wifi,
  Zap,
  DoorOpen,
  Wrench,
  Clock,
  MapPin,
} from "lucide-react";

interface DashboardAlertasProps {
  geladeiras: Geladeira[];
  registros: RegistroTemperatura[];
  onVerDetalhes: (geladeiraId: string) => void;
  autoRefresh?: boolean;
  intervaloRefresh?: number;
}

const TIPO_ICONS: Record<TipoAnomalia, React.ReactNode> = {
  temperatura_alta: <Thermometer className="w-4 h-4" />,
  temperatura_baixa: <Thermometer className="w-4 h-4" />,
  falha_comunicacao: <Wifi className="w-4 h-4" />,
  consumo_anormal: <Zap className="w-4 h-4" />,
  porta_aberta: <DoorOpen className="w-4 h-4" />,
  manutencao_vencida: <Wrench className="w-4 h-4" />,
};

const TIPO_LABELS: Record<TipoAnomalia, string> = {
  temperatura_alta: "Temperatura Alta",
  temperatura_baixa: "Temperatura Baixa",
  falha_comunicacao: "Falha Comunicação",
  consumo_anormal: "Consumo Anormal",
  porta_aberta: "Porta Aberta",
  manutencao_vencida: "Manutenção Vencida",
};

const SEVERIDADE_COLORS: Record<SeveridadeAlerta, string> = {
  critical: "bg-destructive text-destructive-foreground border-destructive",
  warning: "bg-warning text-warning-foreground border-warning",
  info: "bg-primary/10 text-primary border-primary/20",
};

const SEVERIDADE_ICONS: Record<SeveridadeAlerta, React.ReactNode> = {
  critical: <AlertTriangle className="w-4 h-4" />,
  warning: <AlertCircle className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
};

// Som de alerta simples usando Web Audio API
function useAlertaSonoro(enabled: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);

  const tocarAlerta = useCallback(() => {
    if (!enabled) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);

      // Segundo beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1000;
        osc2.type = "sine";
        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.3);
      }, 200);
    } catch (e) {
      console.error("Erro ao tocar alerta sonoro:", e);
    }
  }, [enabled]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { tocarAlerta };
}

export function DashboardAlertas({
  geladeiras,
  registros,
  onVerDetalhes,
  autoRefresh = true,
  intervaloRefresh = 5 * 60 * 1000,
}: DashboardAlertasProps) {
  const { toast } = useToast();
  const [somEnabled, setSomEnabled] = useState(true);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState<FiltroAlertas>({
    apenasNaoLidas: false,
  });
  const [filtroLocal, setFiltroLocal] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroSeveridade, setFiltroSeveridade] = useState<string>("todos");
  const [activeTab, setActiveTab] = useState<string>("todos");

  const { tocarAlerta } = useAlertaSonoro(somEnabled);

  const handleNovoAlerta = useCallback(
    (alerta: Alerta) => {
      if (alerta.severidade === "critical" || alerta.severidade === "warning") {
        tocarAlerta();
      }

      toast({
        title: alerta.titulo,
        description: `${alerta.geladeira.descricao}: ${alerta.mensagem}`,
        variant:
          alerta.severidade === "critical" ? "destructive" : "default",
        duration: 10000,
      });
    },
    [tocarAlerta, toast],
  );

  const {
    alertas,
    alertasNaoLidas,
    filtrarAlertas,
    marcarAlertaComoLida,
    marcarTodosComoLidos,
    dismissAlerta,
    estatatisticas,
    locations,
    recarregar,
    isLoading,
    error,
  } = useAlertas({
    geladeiras,
    registros,
    intervaloAtualizacao: autoRefresh ? intervaloRefresh : Infinity,
    onNovoAlerta: handleNovoAlerta,
  });

  // Construir filtros ativos
  const filtrosAtivos: FiltroAlertas = {
    apenasNaoLidas: filtros.apenasNaoLidas,
  };

  if (filtroLocal !== "todos") {
    filtrosAtivos.local = [filtroLocal];
  }
  if (filtroTipo !== "todos") {
    filtrosAtivos.tipo = [filtroTipo as TipoAnomalia];
  }
  if (filtroSeveridade !== "todos") {
    filtrosAtivos.severidade = [filtroSeveridade as SeveridadeAlerta];
  }

  const alertasFiltradas = filtrarAlertas(filtrosAtivos);

  const alertasPorTab =
    activeTab === "todos"
      ? alertasFiltradas
      : alertasFiltradas.filter((a) => a.severidade === activeTab);

  const formatarTempo = (data: Date) => {
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin < 1) return "Agora";
    if (diffMin < 60) return `${diffMin}min atrás`;
    if (diffHoras < 24) return `${diffHoras}h atrás`;
    return `${diffDias}d atrás`;
  };

  return (
    <div className="space-y-4">
      {/* Header com estatísticas e controles */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Bell
            className={`w-5 h-5 ${alertasNaoLidas > 0 ? "text-destructive animate-pulse" : "text-muted-foreground"}`}
          />
          <h2 className="text-lg font-semibold">Alertas</h2>
          {alertasNaoLidas > 0 && (
            <Badge variant="destructive">{alertasNaoLidas} não lidas</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSomEnabled(!somEnabled)}
            title={somEnabled ? "Desativar som" : "Ativar som"}
          >
            {somEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={mostrarFiltros ? "bg-secondary" : ""}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filtros
          </Button>

          <Button variant="outline" size="sm" onClick={recarregar}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>

          {alertasNaoLidas > 0 && (
            <Button variant="ghost" size="sm" onClick={marcarTodosComoLidos}>
              <Check className="w-4 h-4 mr-1" />
              Marcar todos lidos
            </Button>
          )}
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card
          className={`cursor-pointer transition-colors ${activeTab === "todos" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setActiveTab("todos")}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <Badge variant="secondary">{estatatisticas.total}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${activeTab === "critical" ? "ring-2 ring-destructive" : "hover:border-destructive/50"}`}
          onClick={() => setActiveTab("critical")}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Críticos</span>
              <Badge
                variant="destructive"
                className="flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                {estatatisticas.criticos}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${activeTab === "warning" ? "ring-2 ring-warning" : "hover:border-warning/50"}`}
          onClick={() => setActiveTab("warning")}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avisos</span>
              <Badge variant="warning" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {estatatisticas.avisos}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${activeTab === "info" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setActiveTab("info")}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Infos</span>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Info className="w-3 h-3" />
                {estatatisticas.infos}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel de filtros */}
      {mostrarFiltros && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filtro-local">Local</Label>
              <Select value={filtroLocal} onValueChange={setFiltroLocal}>
                <SelectTrigger id="filtro-local">
                  <SelectValue placeholder="Todos os locais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os locais</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtro-tipo">Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger id="filtro-tipo">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {Object.entries(TIPO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        {TIPO_ICONS[key as TipoAnomalia]}
                        {label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtro-severidade">Severidade</Label>
              <Select
                value={filtroSeveridade}
                onValueChange={setFiltroSeveridade}
              >
                <SelectTrigger id="filtro-severidade">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="critical">
                    <span className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      Crítico
                    </span>
                  </SelectItem>
                  <SelectItem value="warning">
                    <span className="flex items-center gap-2 text-warning">
                      <AlertCircle className="w-4 h-4" />
                      Aviso
                    </span>
                  </SelectItem>
                  <SelectItem value="info">
                    <span className="flex items-center gap-2 text-primary">
                      <Info className="w-4 h-4" />
                      Info
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-3 flex items-center gap-2">
              <Switch
                id="apenas-nao-lidas"
                checked={filtros.apenasNaoLidas}
                onCheckedChange={(checked) =>
                  setFiltros((prev) => ({
                    ...prev,
                    apenasNaoLidas: checked,
                  }))
                }
              />
              <Label htmlFor="apenas-nao-lidas">Apenas não lidas</Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erro */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-destructive text-sm">
            {error}
            <Button
              variant="link"
              size="sm"
              onClick={recarregar}
              className="ml-2"
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de alertas */}
      <div className="space-y-3">
        {alertasPorTab.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BellOff className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                {alertasFiltradas.length === 0
                  ? "Nenhum alerta no momento"
                  : "Nenhum alerta corresponde aos filtros"}
              </p>
            </CardContent>
          </Card>
        ) : (
          alertasPorTab.map((alerta) => (
            <Card
              key={alerta.id}
              className={`transition-all hover:shadow-md ${alerta.severidade === "critical" ? "border-destructive/50 bg-destructive/5" : ""} ${alerta.severidade === "warning" ? "border-warning/50 bg-warning/5" : ""} ${!alerta.lida ? "ring-1 ring-primary/20" : "opacity-80"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Ícone de severidade */}
                  <div
                    className={`p-2 rounded-full ${SEVERIDADE_COLORS[alerta.severidade]}`}
                  >
                    {SEVERIDADE_ICONS[alerta.severidade]}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm">
                            {alerta.titulo}
                          </h4>
                          <Badge
                            variant="outline"
                            className="text-xs flex items-center gap-1"
                          >
                            {TIPO_ICONS[alerta.tipo]}
                            {TIPO_LABELS[alerta.tipo]}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mt-1">
                          {alerta.mensagem}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {alerta.geladeira.local}
                          </span>
                          <span className="font-medium">
                            {alerta.geladeira.codigo} -{" "}
                            {alerta.geladeira.descricao}
                          </span>
                          {alerta.temperatura !== undefined && (
                            <span className="flex items-center gap-1 font-medium">
                              <Thermometer className="w-3 h-3" />
                              {alerta.temperatura}°C
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatarTempo(alerta.dataHora)}
                          </span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-1">
                        {!alerta.lida && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => marcarAlertaComoLida(alerta.id)}
                            title="Marcar como lida"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissAlerta(alerta.id)}
                          title="Dispensar"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Botão ver detalhes */}
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onVerDetalhes(alerta.geladeira.id)}
                      >
                        Ver detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
