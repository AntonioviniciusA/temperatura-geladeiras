// app/(auth)/recuperar-senha/page.tsx
"use client";

import { PasswordRecovery } from "@/components/password-recovery";
import Link from "next/link";

export default function RecuperarSenhaPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Recuperação de Senha</h1>
          <p className="text-muted-foreground mt-2">
            Siga os passos para redefinir sua senha
          </p>
        </div>

        <PasswordRecovery onBackToLogin={() => (window.location.href = "/login")} />

        <p className="text-center text-sm text-muted-foreground mt-6">
          Lembrou a senha?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Voltar para login
          </Link>
        </p>
      </div>
    </main>
  );
}
