import { NextResponse, NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { geladeiras } from "@/lib/schema";
import { addLog } from "@/lib/logs";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const db = getDb();

    const result = await db
      .select()
      .from(geladeiras)
      .where(eq(geladeiras.id, id));
    const geladeira = result[0];

    await db.delete(geladeiras).where(eq(geladeiras.id, id));

    if (geladeira) {
      await addLog(
        "Excluir Geladeira",
        `Geladeira removida: ${geladeira.codigo} - ${geladeira.descricao}`,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao remover" }, { status: 500 });
  }
}
