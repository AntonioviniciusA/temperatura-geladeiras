"use client";
import type { Geladeira, RegistroTemperatura } from "@/lib/types";
import { Thermometer, MapPin, Trash2, Loader2, ArrowUp, ArrowDown } from "lucide-react";

interface GeladeiraCardProps {
  geladeira: Geladeira;
  ultimaTemperatura: RegistroTemperatura | null;
  mediaTemperatura?: number;
  getStatus: (temp: number, geladeiraId: string) => { color: string; label: string };
  onRemover: (id: string) => void;
  onReordenar: (id: string, direcao: "cima" | "baixo") => void;
  isRemovendo?: boolean;
  isPrimeiro: boolean;
  isUltimo: boolean;
}

export function GeladeiraCard({
  geladeira,
  ultimaTemperatura,
  mediaTemperatura,
  getStatus,
  onRemover,
  onReordenar,
  isRemovendo,
  isPrimeiro,
  isUltimo,
}: GeladeiraCardProps) {
  const status = ultimaTemperatura
    ? getStatus(ultimaTemperatura.temperatura, geladeira.id)
    : null;
  return (
    <div className="bg-card rounded-xl border p-5">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <span className="text-xs bg-secondary px-2 py-0.5 rounded">
            {geladeira.codigo}
          </span>
          <h3 className="font-semibold mt-1">{geladeira.descricao}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
            <MapPin className="w-3.5 h-3.5" /> {geladeira.local}
          </div>
          {mediaTemperatura !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              Média histórica: {mediaTemperatura.toFixed(1)}°C
            </p>
          )}
        </div>
        <div className="text-right">
          {ultimaTemperatura ? (
            <>
              <div className={`flex items-center gap-1 ${status?.color}`}>
                <Thermometer className="w-5 h-5" />
                <span className="text-2xl font-bold">
                  {ultimaTemperatura.temperatura}°C
                </span>
              </div>
              <span className={`text-xs ${status?.color}`}>{status?.label}</span>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(ultimaTemperatura.dataHora).toLocaleString("pt-BR")}
              </p>
            </>
          ) : (
            <div className="text-muted-foreground">--°C</div>
          )}
        </div>
      </div>
      <div className="flex justify-end items-center gap-2 mt-4 pt-3 border-t">
        <button
          onClick={() => onReordenar(geladeira.id, "cima")}
          disabled={isPrimeiro}
          className="p-1 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
          title="Mover para cima"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => onReordenar(geladeira.id, "baixo")}
          disabled={isUltimo}
          className="p-1 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
          title="Mover para baixo"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          onClick={() => onRemover(geladeira.id)}
          disabled={isRemovendo}
          className="p-1 hover:text-destructive"
          title="Remover geladeira"
        >
          {isRemovendo ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
