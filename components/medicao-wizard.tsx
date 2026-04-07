"use client";

import { useState, useEffect, useRef } from "react";
import type { Geladeira } from "@/lib/types";
import {
  Thermometer,
  MapPin,
  ChevronRight,
  Check,
  X,
  Loader2,
} from "lucide-react";

interface MedicaoWizardProps {
  geladeiras: Geladeira[];
  onRegistrar: (geladeiraId: string, temperatura: number) => Promise<void>;
  onFechar: () => void;
}

export function MedicaoWizard({
  geladeiras,
  onRegistrar,
  onFechar,
}: MedicaoWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [temperatura, setTemperatura] = useState("");
  const [registrados, setRegistrados] = useState<string[]>([]);
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onFechar]);

  useEffect(() => {
    if (inputRef.current && !registrando) inputRef.current.focus();
  }, [currentIndex, registrando]);

  useEffect(() => {
    setError(null);
  }, [currentIndex]);

  if (geladeiras.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-card rounded-2xl p-6 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-card-foreground mb-2">
            Nenhuma geladeira
          </h2>
          <p className="text-muted-foreground mb-6">
            Não há geladeiras disponíveis para medição.
          </p>
          <button
            onClick={onFechar}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const geladeiraAtual = geladeiras[currentIndex];
  const todasRegistradas = registrados.length === geladeiras.length;

  const handleRegistrar = async () => {
    const temp = parseFloat(temperatura);
    if (isNaN(temp)) return;

    if (temp < -30 || temp > 30) {
      setError("Temperatura fora da faixa esperada (-30°C a 30°C)");
      return;
    }

    setRegistrando(true);
    setError(null);
    try {
      await onRegistrar(geladeiraAtual.id, temp);
      // Sucesso: atualiza registrados e avança
      setRegistrados((prev) => [...prev, geladeiraAtual.id]);
      setTemperatura("");
      if (currentIndex + 1 < geladeiras.length) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao registrar temperatura";
      setError(errorMessage);
      // Não avança, permanece na mesma geladeira
    } finally {
      setRegistrando(false);
    }
  };

  if (todasRegistradas) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-card rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-card-foreground mb-2">
            Medição Concluída!
          </h2>
          <p className="text-muted-foreground mb-6">
            Todas as {geladeiras.length} geladeira
            {geladeiras.length !== 1 && "s"} foram registradas com sucesso.
          </p>
          <button
            onClick={onFechar}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
    >
      <div className="bg-card rounded-2xl max-w-lg w-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/80 text-sm">
              Geladeira {currentIndex + 1} de {geladeiras.length}
            </p>
            <h2
              id="wizard-title"
              className="text-primary-foreground font-semibold"
            >
              Registrar Temperatura
            </h2>
          </div>
          <button
            onClick={onFechar}
            className="p-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-lg transition-colors"
            aria-label="Fechar wizard"
            disabled={registrando}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progresso */}
        <div className="px-6 pt-4">
          <div
            className="flex gap-1"
            role="progressbar"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={geladeiras.length}
          >
            {geladeiras.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < currentIndex
                    ? "bg-accent"
                    : i === currentIndex
                      ? "bg-primary"
                      : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <div className="bg-secondary rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-0.5 rounded">
                {geladeiraAtual.codigo}
              </span>
            </div>
            <h3 className="font-semibold text-foreground text-lg">
              {geladeiraAtual.descricao}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{geladeiraAtual.local}</span>
            </div>
          </div>

          {/* Exibição de erro */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label
              htmlFor="temperatura"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Temperatura Atual
            </label>
            <div className="relative">
              <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                ref={inputRef}
                id="temperatura"
                type="number"
                step="0.1"
                value={temperatura}
                onChange={(e) => setTemperatura(e.target.value)}
                placeholder="-18.0"
                disabled={registrando}
                className="w-full pl-10 pr-12 py-3 bg-input border border-border rounded-xl text-foreground text-lg font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                aria-describedby="temp-hint"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                °C
              </span>
            </div>
            <p id="temp-hint" className="text-xs text-muted-foreground mt-1">
              Valores entre -30°C e 30°C
            </p>
          </div>

          <button
            onClick={handleRegistrar}
            disabled={!temperatura || registrando}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {registrando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                {currentIndex + 1 === geladeiras.length ? (
                  <>
                    <Check className="w-5 h-5" />
                    Finalizar Medição
                  </>
                ) : (
                  <>
                    Próxima Geladeira
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
