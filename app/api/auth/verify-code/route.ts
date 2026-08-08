// app/api/auth/verify-code/route.ts
import { NextResponse } from "next/server";

// Referência ao Map de códigos (em produção, usar Redis ou banco)
const recoveryCodes = new Map<string, { code: string; expiresAt: number }>();

export async function POST(req: Request) {
  try {
    const { email, codigo } = await req.json();

    if (!email || !codigo) {
      return NextResponse.json(
        { error: "E-mail e código são obrigatórios" },
        { status: 400 },
      );
    }

    if (!codigo || codigo.length !== 6 || !/^\d+$/.test(codigo)) {
      return NextResponse.json(
        { error: "Código deve ter 6 dígitos numéricos" },
        { status: 400 },
      );
    }

    const recoveryData = recoveryCodes.get(email.toLowerCase());

    // Verificar se existe código para este e-mail
    if (!recoveryData) {
      return NextResponse.json(
        { error: "Código expirado ou não solicitado" },
        { status: 400 },
      );
    }

    // Verificar se código expirou
    if (Date.now() > recoveryData.expiresAt) {
      recoveryCodes.delete(email.toLowerCase());
      return NextResponse.json(
        { error: "Código expirado. Solicite um novo." },
        { status: 400 },
      );
    }

    // Verificar se código confere
    if (codigo !== recoveryData.code) {
      return NextResponse.json(
        { error: "Código incorreto" },
        { status: 400 },
      );
    }

    // Código válido - remover para evitar reutilização
    recoveryCodes.delete(email.toLowerCase());

    // Retornar token temporário para redefinição
    const resetToken = Buffer.from(
      JSON.stringify({ email: email.toLowerCase(), timestamp: Date.now() }),
    ).toString("base64");

    return NextResponse.json({
      success: true,
      resetToken,
    });
  } catch (error) {
    console.error("Erro na verificação:", error);
    return NextResponse.json(
      { error: "Erro ao verificar código" },
      { status: 500 },
    );
  }
}
