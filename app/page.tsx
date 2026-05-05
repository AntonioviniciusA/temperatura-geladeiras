// app/page.tsx
"use client";

import { useState } from "react";
import { Thermometer, Snowflake } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6">
        <Thermometer className="w-8 h-8 text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Sistema em Manutenção</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Estamos realizando ajustes técnicos para corrigir erros de inicialização. 
        Por favor, aguarde um momento.
      </p>
      <div className="mt-8 flex items-center gap-2 text-primary animate-pulse">
        <Snowflake className="w-5 h-5 animate-spin" />
        <span>Restaurando serviços...</span>
      </div>
    </main>
  );
}
