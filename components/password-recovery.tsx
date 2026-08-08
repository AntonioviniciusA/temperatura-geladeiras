// components/password-recovery.tsx
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  type DadosRecuperacaoSenha,
  type StatusRecuperacao,
} from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Mail,
  Lock,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

// Validação de email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validação de senha
interface ValidacaoSenha {
  minLength: boolean;
  temLetraMaiuscula: boolean;
  temLetraMinuscula: boolean;
  temNumero: boolean;
  temSimbolo: boolean;
}

function validarSenha(senha: string): ValidacaoSenha {
  return {
    minLength: senha.length >= 8,
    temLetraMaiuscula: /[A-Z]/.test(senha),
    temLetraMinuscula: /[a-z]/.test(senha),
    temNumero: /[0-9]/.test(senha),
    temSimbolo: /[!@#$%^&*(),.?":{}|<>]/.test(senha),
  };
}

function calcularForcaSenha(validacao: ValidacaoSenha): {
  forca: number;
  label: string;
  cor: string;
} {
  const criterios = Object.values(validacao).filter(Boolean).length;
  const forca = (criterios / 5) * 100;

  if (forca <= 20) return { forca, label: "Muito fraca", cor: "bg-destructive" };
  if (forca <= 40) return { forca, label: "Fraca", cor: "bg-warning" };
  if (forca <= 60) return { forca, label: "Média", cor: "bg-yellow-500" };
  if (forca <= 80) return { forca, label: "Forte", cor: "bg-accent" };
  return { forca, label: "Muito forte", cor: "bg-primary" };
}

interface PasswordRecoveryProps {
  onBackToLogin?: () => void;
}

export function PasswordRecovery({ onBackToLogin }: PasswordRecoveryProps) {
  const { toast } = useToast();
  const [dados, setDados] = useState<DadosRecuperacaoSenha>({
    status: "idle",
  });
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [tempoEspera, setTempoEspera] = useState(0);
  const [erros, setErros] = useState<Record<string, string>>({});

  const validacaoSenha = useMemo(
    () => validarSenha(novaSenha),
    [novaSenha],
  );

  const forcaSenha = useMemo(
    () => calcularForcaSenha(validacaoSenha),
    [validacaoSenha],
  );

  // Timer para reenvio de código
  useEffect(() => {
    if (tempoEspera > 0) {
      const timer = setTimeout(() => setTempoEspera(tempoEspera - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [tempoEspera]);

  const validarEmail = useCallback((): boolean => {
    const novosErros: Record<string, string> = {};
    if (!email) {
      novosErros.email = "E-mail é obrigatório";
    } else if (!isValidEmail(email)) {
      novosErros.email = "Digite um e-mail válido";
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }, [email]);

  const validarCodigo = useCallback((): boolean => {
    const novosErros: Record<string, string> = {};
    if (!codigo) {
      novosErros.codigo = "Código é obrigatório";
    } else if (codigo.length !== 6) {
      novosErros.codigo = "Código deve ter 6 dígitos";
    } else if (!/^\d+$/.test(codigo)) {
      novosErros.codigo = "Código deve conter apenas números";
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }, [codigo]);

  const validarNovaSenha = useCallback((): boolean => {
    const novosErros: Record<string, string> = {};
    if (!novaSenha) {
      novosErros.novaSenha = "Nova senha é obrigatória";
    } else if (!validacaoSenha.minLength) {
      novosErros.novaSenha = "Mínimo de 8 caracteres";
    } else if (!validacaoSenha.temLetraMaiuscula) {
      novosErros.novaSenha = "Inclua pelo menos uma letra maiúscula";
    } else if (!validacaoSenha.temLetraMinuscula) {
      novosErros.novaSenha = "Inclua pelo menos uma letra minúscula";
    } else if (!validacaoSenha.temNumero) {
      novosErros.novaSenha = "Inclua pelo menos um número";
    } else if (!validacaoSenha.temSimbolo) {
      novosErros.novaSenha = "Inclua pelo menos um símbolo";
    }

    if (!confirmarSenha) {
      novosErros.confirmarSenha = "Confirme a senha";
    } else if (novaSenha !== confirmarSenha) {
      novosErros.confirmarSenha = "As senhas não coincidem";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }, [novaSenha, confirmarSenha, validacaoSenha]);

  const handleEnviarCodigo = async () => {
    if (!validarEmail()) return;

    setDados({ ...dados, status: "enviando", mensagemErro: undefined });

    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar código");
      }

      setDados({
        ...dados,
        email,
        status: "codigo_enviado",
        mensagemErro: undefined,
      });
      setTempoEspera(60);
      toast({
        title: "Código enviado",
        description: "Verifique seu e-mail para obter o código de verificação",
      });
    } catch (err: any) {
      setDados({
        ...dados,
        status: "erro",
        mensagemErro: err.message,
      });
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleReenviarCodigo = async () => {
    if (tempoEspera > 0) return;
    await handleEnviarCodigo();
  };

  const handleVerificarCodigo = async () => {
    if (!validarCodigo()) return;

    setDados({ ...dados, status: "verificando", mensagemErro: undefined });

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Código inválido");
      }

      setDados({
        ...dados,
        email,
        codigo,
        status: "verificando",
        mensagemErro: undefined,
      });

      toast({
        title: "Código verificado",
        description: "Agora você pode criar uma nova senha",
      });
    } catch (err: any) {
      setDados({
        ...dados,
        status: "erro",
        mensagemErro: err.message,
      });
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleNovaSenhaSubmit = async () => {
    if (!validarNovaSenha()) return;

    setDados({ ...dados, status: "enviando", mensagemErro: undefined });

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo, novaSenha }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao redefinir senha");
      }

      setDados({
        ...dados,
        email,
        codigo,
        novaSenha,
        status: "sucesso",
        mensagemErro: undefined,
      });

      toast({
        title: "Senha redefinida",
        description: "Sua senha foi alterada com sucesso",
      });
    } catch (err: any) {
      setDados({
        ...dados,
        status: "erro",
        mensagemErro: err.message,
      });
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleVoltar = () => {
    setDados({ status: "idle" });
    setErros({});
  };

  // Renderização por estado
  if (dados.status === "sucesso") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Senha Redefinida</h2>
            <p className="text-muted-foreground">
              Sua senha foi alterada com sucesso. Agora você pode fazer login
              com sua nova senha.
            </p>
            <Button onClick={onBackToLogin} className="w-full">
              Voltar para Login
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dados.status === "codigo_enviado" && dados.status !== "verificando") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Verificar Código
          </CardTitle>
          <CardDescription>
            Digite o código de 6 dígitos enviado para{" "}
            <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código de Verificação</Label>
            <Input
              id="codigo"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={codigo}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCodigo(value);
                setErros({});
              }}
              className={`text-center text-2xl tracking-widest ${erros.codigo ? "border-destructive" : ""}`}
            />
            {erros.codigo && (
              <p className="text-xs text-destructive">{erros.codigo}</p>
            )}
          </div>

          {tempoEspera > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Aguarde {tempoEspera}s para reenviar
            </p>
          )}

          {tempoEspera === 0 && (
            <Button
              variant="ghost"
              onClick={handleReenviarCodigo}
              className="w-full"
            >
              Reenviar código
            </Button>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleVoltar} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={handleVerificarCodigo}
              className="flex-1"
              disabled={codigo.length !== 6 || dados.status === "verificando"}
            >
              {dados.status === "verificando" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (
    dados.status === "verificando" ||
    (dados.status === "erro" && codigo.length === 6)
  ) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Nova Senha
          </CardTitle>
          <CardDescription>
            Crie uma nova senha segura para sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nova-senha">Nova Senha</Label>
            <Input
              id="nova-senha"
              type="password"
              placeholder="••••••••"
              value={novaSenha}
              onChange={(e) => {
                setNovaSenha(e.target.value);
                setErros({});
              }}
              className={erros.novaSenha ? "border-destructive" : ""}
            />
            {novaSenha && (
              <div className="space-y-2 mt-2">
                <div className="flex justify-between text-xs">
                  <span>Força da senha:</span>
                  <span className={forcaSenha.cor.replace("bg-", "text-")}>
                    {forcaSenha.label}
                  </span>
                </div>
                <Progress value={forcaSenha.forca} className="h-1" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    {validacaoSenha.minLength ? (
                      <CheckCircle className="w-3 h-3 text-primary" />
                    ) : (
                      <XCircle className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span
                      className={
                        validacaoSenha.minLength
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      Mínimo 8 caracteres
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {validacaoSenha.temLetraMaiuscula ? (
                      <CheckCircle className="w-3 h-3 text-primary" />
                    ) : (
                      <XCircle className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span
                      className={
                        validacaoSenha.temLetraMaiuscula
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      Letra maiúscula
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {validacaoSenha.temLetraMinuscula ? (
                      <CheckCircle className="w-3 h-3 text-primary" />
                    ) : (
                      <XCircle className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span
                      className={
                        validacaoSenha.temLetraMinuscula
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      Letra minúscula
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {validacaoSenha.temNumero ? (
                      <CheckCircle className="w-3 h-3 text-primary" />
                    ) : (
                      <XCircle className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span
                      className={
                        validacaoSenha.temNumero
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      Número
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {validacaoSenha.temSimbolo ? (
                      <CheckCircle className="w-3 h-3 text-primary" />
                    ) : (
                      <XCircle className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span
                      className={
                        validacaoSenha.temSimbolo
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      Símbolo
                    </span>
                  </div>
                </div>
              </div>
            )}
            {erros.novaSenha && (
              <p className="text-xs text-destructive">{erros.novaSenha}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar-senha">Confirmar Senha</Label>
            <Input
              id="confirmar-senha"
              type="password"
              placeholder="••••••••"
              value={confirmarSenha}
              onChange={(e) => {
                setConfirmarSenha(e.target.value);
                setErros({});
              }}
              className={erros.confirmarSenha ? "border-destructive" : ""}
            />
            {erros.confirmarSenha && (
              <p className="text-xs text-destructive">{erros.confirmarSenha}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleVoltar} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={handleNovaSenhaSubmit}
              className="flex-1"
              disabled={
                dados.status === "enviando" ||
                !validacaoSenha.minLength ||
                !validacaoSenha.temLetraMaiuscula ||
                !validacaoSenha.temLetraMinuscula ||
                !validacaoSenha.temNumero ||
                !validacaoSenha.temSimbolo ||
                novaSenha !== confirmarSenha
              }
            >
              {dados.status === "enviando" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Nova Senha"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado inicial - solicitar email
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Esqueci Minha Senha
        </CardTitle>
        <CardDescription>
          Digite seu e-mail cadastrado para receber um código de verificação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErros({});
              }}
              className={`pl-10 ${erros.email ? "border-destructive" : ""}`}
            />
          </div>
          {erros.email && (
            <p className="text-xs text-destructive">{erros.email}</p>
          )}
        </div>

        {dados.status === "erro" && dados.mensagemErro && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{dados.mensagemErro}</p>
          </div>
        )}

        <div className="flex gap-2">
          {onBackToLogin && (
            <Button variant="outline" onClick={onBackToLogin} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}
          <Button
            onClick={handleEnviarCodigo}
            className="flex-1"
            disabled={dados.status === "enviando"}
          >
            {dados.status === "enviando" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Código"
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Lembre-se: o código expira em 15 minutos
        </p>
      </CardContent>
    </Card>
  );
}
