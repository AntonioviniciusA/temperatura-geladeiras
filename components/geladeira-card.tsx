"use client";
import type { Geladeira, RegistroTemperatura } from "@/lib/types";
import { Thermometer, MapPin, Trash2, Loader2 } from "lucide-react";

function getStatus(temp: number) {
  if (temp <= -15) return { color: "text-primary", label: "Ideal" };
  if (temp <= -10) return { color: "text-accent", label: "Aceitável" };
  if (temp <= 0) return { color: "text-warning", label: "Atenção" };
  return { color: "text-destructive", label: "Crítico" };
}

export function GeladeiraCard({
  geladeira,
  ultimaTemperatura,
  onRemover,
  isRemovendo,
}: {
  geladeira: Geladeira;
  ultimaTemperatura: RegistroTemperatura | null;
  onRemover: (id: string) => void;
  isRemovendo?: boolean;
}) {
  const status = ultimaTemperatura
    ? getStatus(ultimaTemperatura.temperatura)
    : null;
  return (
    <div className="bg-card rounded-xl border p-5 flex justify-between items-start">
      <div>
        <span className="text-xs bg-secondary px-2 py-0.5 rounded">
          {geladeira.codigo}
        </span>
        <h3 className="font-semibold mt-1">{geladeira.descricao}</h3>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
          <MapPin className="w-3.5 h-3.5" /> {geladeira.local}
        </div>
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
        <button
          onClick={() => onRemover(geladeira.id)}
          disabled={isRemovendo}
          className="mt-2 p-1 hover:text-destructive"
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
