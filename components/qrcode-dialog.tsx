"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check, ExternalLink, QrCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface QRCodeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function QRCodeDialog({ open, onClose }: QRCodeDialogProps) {
  const [publicUrl, setPublicUrl] = useState<string>("");
  const [copiado, setCopiado] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      setPublicUrl(`${origin}/publico`);
    }
  }, [open]);

  useEffect(() => {
    setCopiado(false);
  }, [open]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiado(true);
      toast({ title: "Link copiado", description: "URL copiada para a área de transferência" });
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast({ title: "Erro", description: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const handleOpenPublic = () => {
    window.open(publicUrl, "_blank");
  };

  const handleDownload = () => {
    const svg = document.getElementById("qrcode-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `qrcode-fiscalizacao-${new Date().toISOString().split("T")[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = url;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            QR Code - Fiscalização
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Apresente este QR Code para a fiscalização consultar os registros de temperatura
            diretamente, sem necessidade de senha.
          </p>

          <div className="flex justify-center bg-white p-4 rounded-xl border">
            <QRCodeSVG
              id="qrcode-svg"
              value={publicUrl}
              size={240}
              level="H"
              includeMargin
              fgColor="#09090b"
            />
          </div>

          <div className="bg-secondary/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Link de acesso público:</p>
            <p className="text-sm font-mono break-all text-foreground">{publicUrl}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" onClick={handleCopy} className="flex items-center gap-2">
              {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiado ? "Copiado" : "Copiar"}
            </Button>
            <Button variant="secondary" onClick={handleOpenPublic} className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Abrir
            </Button>
            <Button variant="secondary" onClick={handleDownload} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
