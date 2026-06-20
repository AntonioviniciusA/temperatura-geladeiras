import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { registrosTemperatura, geladeiras } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { addLog } from "@/lib/logs";

export async function GET() {
  try {
    const db = getDb();
    const result = await db
      .select({
        id: registrosTemperatura.id,
        geladeiraId: registrosTemperatura.geladeiraId,
        temperatura: registrosTemperatura.temperatura,
        dataHora: registrosTemperatura.dataHora,
        geladeiraCodigo: geladeiras.codigo,
      })
      .from(registrosTemperatura)
      .leftJoin(geladeiras, eq(registrosTemperatura.geladeiraId, geladeiras.id))
      .orderBy(sql`${registrosTemperatura.dataHora} DESC`);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar registros" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const db = getDb();
    const body = await req.json();
    const { geladeiraId, temperatura, dataHora: providedDataHora } = body;
    const id = crypto.randomUUID();
    const dataHora = providedDataHora
      ? new Date(providedDataHora).toISOString()
      : new Date().toISOString();

    await db.insert(registrosTemperatura).values({
      id,
      geladeiraId,
      temperatura,
      dataHora,
    });

    await addLog(
      "Adicionar Registro",
      `Novo registro para geladeira ${geladeiraId}: ${temperatura}°C (data: ${dataHora})`,
    );

    return NextResponse.json({ id, geladeiraId, temperatura, dataHora });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao registrar" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const db = getDb();
    const { id, temperatura } = await req.json();

    const oldRecord = await db
      .select()
      .from(registrosTemperatura)
      .where(eq(registrosTemperatura.id, id));

    await db
      .update(registrosTemperatura)
      .set({ temperatura })
      .where(eq(registrosTemperatura.id, id));

    if (oldRecord[0]) {
      await addLog(
        "Editar Registro",
        `Registro ${id} alterado de ${oldRecord[0].temperatura}°C para ${temperatura}°C`,
      );
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

    const db = getDb();
    const oldRecord = await db
      .select()
      .from(registrosTemperatura)
      .where(eq(registrosTemperatura.id, id));

    await db.delete(registrosTemperatura).where(eq(registrosTemperatura.id, id));

    if (oldRecord[0]) {
      await addLog(
        "Excluir Registro",
        `Registro ${id} removido (${oldRecord[0].temperatura}°C)`,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao excluir registro" }, { status: 500 });
  }
}
