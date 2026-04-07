import { NextResponse } from "next/server";
import { turso } from "@/lib/turso-server";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await turso.execute({
      sql: "DELETE FROM geladeiras WHERE id = ?",
      args: [params.id],
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao remover" }, { status: 500 });
  }
}
