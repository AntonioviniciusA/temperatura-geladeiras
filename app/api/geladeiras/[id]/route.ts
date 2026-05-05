import { NextResponse } from "next/server";
import { turso } from "@/lib/turso-server";
import { addLog } from "@/lib/logs";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;

    // Get info for log
    const result = await turso.execute({
      sql: "SELECT * FROM geladeiras WHERE id = ?",
      args: [id],
    });
    const geladeira = result.rows[0];

    await turso.execute({
      sql: "DELETE FROM geladeiras WHERE id = ?",
      args: [id],
    });

    if (geladeira) {
      await addLog("Excluir Geladeira", `Geladeira removida: ${geladeira.codigo} - ${geladeira.descricao}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao remover" }, { status: 500 });
  }
}
