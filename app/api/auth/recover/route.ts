// app/api/auth/recover/route.ts
import { NextResponse } from "next/server";

// Em produção, isso seria armazenado em um banco de dados Redis ou similar
// com TTL de 15 minutos para o código
const recoveryCodes = new Map<string, { code: string; expiresAt: number }>();

// Gerar código de 6 dígitos
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "E-mail inválido" },
        { status: 400 },
      );
    }

    // Verificar se o e-mail existe no sistema
    // Em produção, verificar no banco de dados
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      // Para segurança, não revelar se o e-mail existe ou não
      // Retornar sucesso mesmo se não encontrar
      return NextResponse.json({
        success: true,
        message: "Se o e-mail estiver cadastrado, você receberá um código",
      });
    }

    // Gerar código
    const code = generateCode();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos

    // Armazenar código (em produção, usar Redis ou banco)
    recoveryCodes.set(email.toLowerCase(), { code, expiresAt });

    // Em produção, enviar e-mail com o código
    // Por agora, logar no console (CUIDADO: apenas para desenvolvimento)
    if (process.env.NODE_ENV !== "production") {
      console.log(`[RECOVERY CODE] Para ${email}: ${code}`);
    }

    // Simular delay de envio
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: "Se o e-mail estiver cadastrado, você receberá um código",
    });
  } catch (error) {
    console.error("Erro na recuperação:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 },
    );
  }
}

// Exportar para uso em outras rotas
export { recoveryCodes };
