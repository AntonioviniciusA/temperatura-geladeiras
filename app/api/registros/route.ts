import { NextResponse } from "next/server";
import { turso } from "@/lib/turso-server";
import { addLog } from "@/lib/logs";

export async function GET() {
  try {
    const result = await turso.execute(
      "SELECT r.*, g.codigo as geladeiraCodigo FROM registros_temperatura r JOIN geladeiras g ON r.geladeiraId = g.id ORDER BY r.dataHora DESC",
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar registros" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { geladeiraId, temperatura } = await req.json();
    const id = crypto.randomUUID();
    const dataHora = new Date().toISOString();

    await turso.execute({
      sql: "INSERT INTO registros_temperatura (id, geladeiraId, temperatura, dataHora) VALUES (?, ?, ?, ?)",
      args: [id, geladeiraId, temperatura, dataHora],
    });

    await addLog("Adicionar Registro", `Novo registro para geladeira ${geladeiraId}: ${temperatura}°C`);

    return NextResponse.json({ id, geladeiraId, temperatura, dataHora });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao registrar" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, temperatura } = await req.json();

    // Get old value for log
    const oldResult = await turso.execute({
      sql: "SELECT * FROM registros_temperatura WHERE id = ?",
      args: [id],
    });
    const oldRecord = oldResult.rows[0];

    await turso.execute({
      sql: "UPDATE registros_temperatura SET temperatura = ? WHERE id = ?",
      args: [temperatura, id],
    });

    if (oldRecord) {
      await addLog("Editar Registro", `Registro ${id} alterado de ${oldRecord.temperatura}°C para ${temperatura}°C`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar registro" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    // Get value for log
    const oldResult = await turso.execute({
      sql: "SELECT * FROM registros_temperatura WHERE id = ?",
      args: [id],
    });
    const oldRecord = oldResult.rows[0];

    await turso.execute({
      sql: "DELETE FROM registros_temperatura WHERE id = ?",
      args: [id],
    });

    if (oldRecord) {
      await addLog("Excluir Registro", `Registro ${id} removido (${oldRecord.temperatura}°C)`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao excluir registro" }, { status: 500 });
  }
}
