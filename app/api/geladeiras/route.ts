import { NextResponse } from "next/server";
import { turso } from "@/lib/turso-server";
import { addLog } from "@/lib/logs";
import { ensureTables } from "@/lib/turso-server";

export async function GET() {
  try {
    await ensureTables();
    const result = await turso.execute(
      "SELECT * FROM geladeiras ORDER BY ordem ASC",
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar geladeiras" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { codigo, descricao, local } = await req.json();
    const id = crypto.randomUUID();
    const criadoEm = new Date().toISOString();

    const countResult = await turso.execute(
      "SELECT COUNT(*) as count FROM geladeiras",
    );
    const ordem = (countResult.rows[0] as any).count || 0;

    await turso.execute({
      sql: "INSERT INTO geladeiras (id, codigo, descricao, local, criadoEm, ordem) VALUES (?, ?, ?, ?, ?, ?)",
      args: [id, codigo, descricao, local, criadoEm, ordem],
    });

    await addLog(
      "Criar Geladeira",
      `Nova geladeira: ${codigo} - ${descricao} (${local})`,
    );

    return NextResponse.json({ id, codigo, descricao, local, criadoEm, ordem });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, ordem } = await req.json();

    await turso.execute({
      sql: "UPDATE geladeiras SET ordem = ? WHERE id = ?",
      args: [ordem, id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar ordem" },
      { status: 500 },
    );
  }
}
