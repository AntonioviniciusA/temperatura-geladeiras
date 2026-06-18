// hooks/use-geladeiras.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Geladeira,
  RegistroTemperatura,
  MedicaoDiaria,
  Log,
} from "@/lib/types";

export function useGeladeiras() {
  const [geladeiras, setGeladeiras] = useState<Geladeira[]>([]);
  const [registros, setRegistros] = useState<RegistroTemperatura[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      const [resGel, resReg] = await Promise.all([
        fetch("/api/geladeiras"),
        fetch("/api/registros"),
      ]);

      if (!resGel.ok || !resReg.ok) throw new Error("Erro ao carregar dados");

      let geladeirasData = await resGel.json();
      const registrosData = await resReg.json();

      // Garante que todas as geladeiras tenham ordem
      geladeirasData = geladeirasData.map((g: Geladeira, i: number) => ({
        ...g,
        ordem: g.ordem !== undefined && g.ordem !== null ? g.ordem : i,
      }));

      // Ordena a lista por ordem
      geladeirasData.sort((a: Geladeira, b: Geladeira) => a.ordem - b.ordem);

      setGeladeiras(geladeirasData);
      setRegistros(registrosData);

      // Tenta carregar logs separadamente para não quebrar tudo se falhar
      try {
        const resLogs = await fetch("/api/logs");
        if (resLogs.ok) {
          const logsData = await resLogs.json();
          setLogs(logsData);
        }
      } catch (logErr) {
        console.error("Erro ao carregar logs:", logErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Calcula a média de temperatura por geladeira
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

  // Função para obter status baseado na média da geladeira
  const getStatusPorGeladeira = useCallback(
    (temp: number, geladeiraId: string) => {
      const media = mediasPorGeladeira.get(geladeiraId);

      // Se não houver média (nenhum registro), usa valores padrão
      if (media === undefined) {
        if (temp <= -15) return { color: "text-primary", label: "Ideal" };
        if (temp <= -10) return { color: "text-accent", label: "Aceitável" };
        if (temp <= 0) return { color: "text-warning", label: "Atenção" };
        return { color: "text-destructive", label: "Crítico" };
      }

      // Define faixas relativas à média:
      // Ideal: até 2°C acima da média
      // Aceitável: até 5°C acima da média
      // Atenção: até 10°C acima da média
      // Crítico: mais de 10°C acima da média
      const diff = temp - media;
      if (diff <= 2) return { color: "text-primary", label: "Ideal" };
      if (diff <= 5) return { color: "text-accent", label: "Aceitável" };
      if (diff <= 10) return { color: "text-warning", label: "Atenção" };
      return { color: "text-destructive", label: "Crítico" };
    },
    [mediasPorGeladeira],
  );

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
    async (data: Omit<Geladeira, "id" | "criadoEm" | "ordem">) => {
      const res = await fetch("/api/geladeiras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      const nova = await res.json();
      nova.ordem = geladeiras.length;
      setGeladeiras((prev) => [...prev, nova]);
      return nova;
    },
    [geladeiras.length],
  );

  const removerGeladeira = useCallback(async (id: string) => {
    const res = await fetch(`/api/geladeiras/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao remover");
    setGeladeiras((prev) => prev.filter((g) => g.id !== id));
    setRegistros((prev) => prev.filter((r) => r.geladeiraId !== id));
  }, []);

  const reordenarGeladeira = useCallback(
    async (id: string, direcao: "cima" | "baixo") => {
      const index = geladeiras.findIndex((g) => g.id === id);
      if (index === -1) return;

      let newIndex;
      if (direcao === "cima") {
        if (index === 0) return;
        newIndex = index - 1;
      } else {
        if (index === geladeiras.length - 1) return;
        newIndex = index + 1;
      }

      // Cria uma nova lista e troca as posições diretamente
      const novaLista = [...geladeiras];
      const [item] = novaLista.splice(index, 1);
      novaLista.splice(newIndex, 0, item);

      // Reatribui as ordens de forma sequencial para garantir consistência
      const listaFinal = novaLista.map((g, i) => ({
        ...g,
        ordem: i,
      }));

      setGeladeiras(listaFinal);

      // Salva todas as ordens no banco (garante que não haja inconsistências)
      try {
        await Promise.all(
          listaFinal.map((g) =>
            fetch("/api/geladeiras", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: g.id, ordem: g.ordem }),
            }),
          ),
        );
      } catch (err) {
        // Reverte se houver erro
        await carregarDados();
        throw new Error("Erro ao reordenar");
      }
    },
    [geladeiras, carregarDados],
  );

  const registrarTemperatura = useCallback(
    async (geladeiraId: string, temperatura: number, dataHora?: string) => {
      const body: any = { geladeiraId, temperatura };
      if (dataHora) body.dataHora = dataHora;
      const res = await fetch("/api/registros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erro ao registrar");
      const novo = await res.json();
      setRegistros((prev) => [novo, ...prev]);
      await carregarDados(); // Refresh logs and joined data
      return novo;
    },
    [carregarDados],
  );

  const atualizarRegistro = useCallback(
    async (id: string, temperatura: number) => {
      const res = await fetch("/api/registros", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, temperatura }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      await carregarDados();
    },
    [carregarDados],
  );

  const excluirRegistro = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/registros?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir");
      await carregarDados();
    },
    [carregarDados],
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
    logs,
    medicaoHoje,
    isLoaded,
    error,
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
  };
}
