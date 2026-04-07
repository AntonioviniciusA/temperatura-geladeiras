// hooks/use-geladeiras.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Geladeira,
  RegistroTemperatura,
  MedicaoDiaria,
} from "@/lib/types";

export function useGeladeiras() {
  const [geladeiras, setGeladeiras] = useState<Geladeira[]>([]);
  const [registros, setRegistros] = useState<RegistroTemperatura[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [resGel, resReg] = await Promise.all([
          fetch("/api/geladeiras"),
          fetch("/api/registros"),
        ]);
        if (!resGel.ok || !resReg.ok) throw new Error("Erro ao carregar dados");
        const geladeirasData = await resGel.json();
        const registrosData = await resReg.json();
        setGeladeiras(geladeirasData);
        setRegistros(registrosData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setIsLoaded(true);
      }
    };
    carregar();
  }, []);

  // Derivações (sempre atualizadas)
  const hoje = useMemo(() => new Date().toISOString().split("T")[0], []);
  const registrosHoje = useMemo(
    () => registros.filter((r) => r.dataHora.startsWith(hoje)),
    [registros, hoje],
  );

  const medicaoHoje: MedicaoDiaria | null = useMemo(() => {
    if (geladeiras.length === 0) return null;
    const medidasIds = new Set(registrosHoje.map((r) => r.geladeiraId));
    const concluida = geladeiras.every((g) => medidasIds.has(g.id));
    return { data: hoje, concluida, registros: registrosHoje };
  }, [geladeiras, registrosHoje, hoje]);

  const getGeladeirasPendentes = useCallback(() => {
    const medidasIds = new Set(registrosHoje.map((r) => r.geladeiraId));
    return geladeiras.filter((g) => !medidasIds.has(g.id));
  }, [geladeiras, registrosHoje]);

  // Operações
  const salvarGeladeira = useCallback(
    async (data: Omit<Geladeira, "id" | "criadoEm">) => {
      const res = await fetch("/api/geladeiras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      const nova = await res.json();
      setGeladeiras((prev) => [...prev, nova]);
      return nova;
    },
    [],
  );

  const removerGeladeira = useCallback(async (id: string) => {
    const res = await fetch(`/api/geladeiras/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao remover");
    setGeladeiras((prev) => prev.filter((g) => g.id !== id));
    setRegistros((prev) => prev.filter((r) => r.geladeiraId !== id));
  }, []);

  const registrarTemperatura = useCallback(
    async (geladeiraId: string, temperatura: number) => {
      const res = await fetch("/api/registros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geladeiraId, temperatura }),
      });
      if (!res.ok) throw new Error("Erro ao registrar");
      const novo = await res.json();
      setRegistros((prev) => [novo, ...prev]);
      return novo;
    },
    [],
  );

  const getHistoricoGeladeira = useCallback(
    (id: string) =>
      registros
        .filter((r) => r.geladeiraId === id)
        .sort(
          (a, b) =>
            new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
        ),
    [registros],
  );

  const getUltimaTemperatura = useCallback(
    (id: string) => getHistoricoGeladeira(id)[0] || null,
    [getHistoricoGeladeira],
  );

  // Exportar CSV de todos os registros
  const exportarCSV = useCallback(() => {
    if (registros.length === 0) {
      alert("Nenhum registro para exportar");
      return;
    }
    // Mapear nomes das geladeiras
    const geladeiraMap = new Map(
      geladeiras.map((g) => [g.id, g.codigo + " - " + g.descricao]),
    );
    const csvRows = [
      ["Data/Hora", "Geladeira", "Temperatura (°C)"],
      ...registros.map((r) => [
        new Date(r.dataHora).toLocaleString("pt-BR"),
        geladeiraMap.get(r.geladeiraId) || r.geladeiraId,
        r.temperatura.toString(),
      ]),
    ];
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute(
      "download",
      `medicoes_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [registros, geladeiras]);

  return {
    geladeiras,
    registros,
    medicaoHoje,
    isLoaded,
    error,
    salvarGeladeira,
    removerGeladeira,
    registrarTemperatura,
    getGeladeirasPendentes,
    getHistoricoGeladeira,
    getUltimaTemperatura,
    exportarCSV,
  };
}
