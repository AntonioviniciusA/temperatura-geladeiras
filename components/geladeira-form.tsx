"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, X, Loader2 } from "lucide-react";

// Tipagem explícita para os dados do formulário
export interface GeladeiraData {
  codigo: string;
  descricao: string;
  local: string;
}

interface GeladeiraFormProps {
  onSalvar: (data: GeladeiraData) => Promise<void> | void;
  onCancelar: () => void;
  isLoading?: boolean;
}

export function GeladeiraForm({
  onSalvar,
  onCancelar,
  isLoading = false,
}: GeladeiraFormProps): TSX.Element {
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [local, setLocal] = useState("");

  // Refs para o campo de código e para restaurar a posição do cursor
  const codigoInputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef<number | null>(null);

  // Após cada atualização do valor do código, reposiciona o cursor onde o usuário espera
  useEffect(() => {
    if (cursorPositionRef.current !== null && codigoInputRef.current) {
      const input = codigoInputRef.current;
      input.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
      cursorPositionRef.current = null;
    }
  }, [codigo]);

  /**
   * Insere um caractere especial (- ou +) no campo de código,
   * mantendo o foco e a posição correta do cursor.
   */
  const handleInsertChar = (char: string) => {
    const input = codigoInputRef.current;
    if (!input) return;

    // Garante que o input está focado (útil quando o botão é acionado por clique)
    input.focus();

    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const newValue = input.value.slice(0, start) + char + input.value.slice(end);

    setCodigo(newValue);
    // Guarda onde o cursor deve ficar após a inserção
    cursorPositionRef.current = start + char.length;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validação adicional (trim garante que espaços em branco não passem)
    if (!codigo.trim() || !descricao.trim() || !local.trim()) return;

    await onSalvar({
      codigo: codigo.trim(),
      descricao: descricao.trim(),
      local: local.trim(),
    });

    // Limpa os campos após o salvamento bem-sucedido
    setCodigo("");
    setDescricao("");
    setLocal("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card rounded-xl border p-5 shadow-sm"
      aria-label="Formulário de nova geladeira"
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Nova Geladeira</h3>
        <button
          type="button"
          onClick={onCancelar}
          disabled={isLoading}
          aria-label="Cancelar cadastro"
          className="rounded-full p-1 hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Campos */}
      <div className="space-y-4">
        {/* Campo Código + Botões auxiliares */}
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <label htmlFor="codigo" className="sr-only">
              Código
            </label>
            <input
              id="codigo"
              type="text"
              placeholder="Código (ex: ABC-123)"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              ref={codigoInputRef}
              disabled={isLoading}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              required
              autoComplete="off"
            />
          </div>

          {/* Botões especiais apenas para o campo de código */}
          <div className="flex flex-col gap-1 pt-0.5">
            <button
              type="button"
              onClick={() => handleInsertChar("-")}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors"
              aria-label="Inserir hífen no código"
              tabIndex={-1} // evita foco por teclado, o atalho é por clique
            >
              -
            </button>
            <button
              type="button"
              onClick={() => handleInsertChar("+")}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors"
              aria-label="Inserir sinal de mais no código"
              tabIndex={-1}
            >
              +
            </button>
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label htmlFor="descricao" className="sr-only">
            Descrição
          </label>
          <input
            id="descricao"
            type="text"
            placeholder="Descrição da geladeira"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            disabled={isLoading}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            required
            autoComplete="off"
          />
        </div>

        {/* Local */}
        <div>
          <label htmlFor="local" className="sr-only">
            Local
          </label>
          <input
            id="local"
            type="text"
            placeholder="Local (ex: Cozinha, Laboratório)"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            disabled={isLoading}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            required
            autoComplete="off"
          />
        </div>

        {/* Botão de envio */}
        <button
          type="submit"
          disabled={isLoading || !codigo.trim() || !descricao.trim() || !local.trim()}
          className="w-full bg-primary text-primary-foreground py-2 rounded font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              Salvando...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Cadastrar
            </>
          )}
        </button>
      </div>
    </form>
  );
}