"use client";
import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";

interface Props {
  onSalvar: (data: {
    codigo: string;
    descricao: string;
    local: string;
  }) => Promise<void> | void;
  onCancelar: () => void;
  isLoading?: boolean;
}

export function GeladeiraForm({
  onSalvar,
  onCancelar,
  isLoading = false,
}: Props) {
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [local, setLocal] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !descricao.trim() || !local.trim()) return;
    await onSalvar({
      codigo: codigo.trim(),
      descricao: descricao.trim(),
      local: local.trim(),
    });
    setCodigo("");
    setDescricao("");
    setLocal("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-5">
      <div className="flex justify-between mb-4">
        <h3 className="font-semibold">Nova Geladeira</h3>
        <button type="button" onClick={onCancelar} disabled={isLoading}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Código"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          disabled={isLoading}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          disabled={isLoading}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Local"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          disabled={isLoading}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          disabled={isLoading || !codigo || !descricao || !local}
          className="w-full bg-primary text-primary-foreground py-2 rounded flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Plus /> Cadastrar
            </>
          )}
        </button>
      </div>
    </form>
  );
}
