import { NextResponse } from "next/server";
import { turso } from "@/lib/turso-server";
import { addLog } from "@/lib/logs";

export async function GET() {
  try {
    const result = await turso.execute(
      "SELECT * FROM geladeiras ORDER BY criadoEm ASC",
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

    await turso.execute({
      sql: "INSERT INTO geladeiras (id, codigo, descricao, local, criadoEm) VALUES (?, ?, ?, ?, ?)",
      args: [id, codigo, descricao, local, criadoEm],
    });

    await addLog("Criar Geladeira", `Nova geladeira: ${codigo} - ${descricao} (${local})`);

    return NextResponse.json({ id, codigo, descricao, local, criadoEm });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar" }, { status: 500 });
  }
}
