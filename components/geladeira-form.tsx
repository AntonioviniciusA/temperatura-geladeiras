"use client";
import { useState, useRef } from "react";
import { Plus, X, Loader2 } from "lucide-react";

interface GeladeiraData {
  codigo: string;
  descricao: string;
  local: string;
}

interface Props {
  onSalvar: (data: GeladeiraData) => Promise<void> | void;
  onCancelar: () => void;
  isLoading?: boolean;
}

export function GeladeiraForm({
  onSalvar,
  onCancelar,
  isLoading = false,
}: Props): JSX.Element {
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [local, setLocal] = useState("");
  const codigoRef = useRef<HTMLInputElement | null>(null);
  const descricaoRef = useRef<HTMLInputElement | null>(null);
  const localRef = useRef<HTMLInputElement | null>(null);
  const [focusedField, setFocusedField] = useState<"codigo" | "descricao" | "local" | null>(null);

  const insertChar = (ch: string) => {
    const ref = focusedField === "codigo" ? codigoRef.current : focusedField === "descricao" ? descricaoRef.current : localRef.current;
    if (!ref) return;
    const start = ref.selectionStart || ref.value.length;
    const end = ref.selectionEnd || start;
    const newVal = ref.value.slice(0, start) + ch + ref.value.slice(end);
    if (focusedField === "codigo") setCodigo(newVal);
    if (focusedField === "descricao") setDescricao(newVal);
    if (focusedField === "local") setLocal(newVal);
    // move cursor after inserted char
    requestAnimationFrame(() => {
      const pos = start + ch.length;
      ref.setSelectionRange(pos, pos);
      ref.focus();
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Código"
          value={codigo}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCodigo(e.target.value)}
          ref={codigoRef}
          onFocus={() => setFocusedField("codigo")}
          onBlur={() => setFocusedField(null)}
          disabled={isLoading}
          className="w-full p-2 border rounded"
          required
        />
        <div className="flex flex-col gap-1">
          <button type="button" onClick={() => insertChar('-')} className="px-2 py-1 bg-muted rounded">-</button>
          <button type="button" onClick={() => insertChar('+')} className="px-2 py-1 bg-muted rounded">+</button>
        </div>
        </div>
        <input
          type="text"
          placeholder="Descrição"
          value={descricao}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescricao(e.target.value)}
          ref={descricaoRef}
          onFocus={() => setFocusedField("descricao")}
          onBlur={() => setFocusedField(null)}
          disabled={isLoading}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Local"
          value={local}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocal(e.target.value)}
          ref={localRef}
          onFocus={() => setFocusedField("local")}
          onBlur={() => setFocusedField(null)}
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
