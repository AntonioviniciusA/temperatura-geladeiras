"use client"

import { Bell, BellOff, Clock } from "lucide-react"

interface NotificationSettingsProps {
  permission: NotificationPermission
  notificationTime: string
  isSupported: boolean
  onRequestPermission: () => Promise<boolean>
  onUpdateTime: (time: string) => void
}

export function NotificationSettings({
  permission,
  notificationTime,
  isSupported,
  onRequestPermission,
  onUpdateTime,
}: NotificationSettingsProps) {
  if (!isSupported) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center gap-3 text-muted-foreground">
          <BellOff className="w-5 h-5" />
          <span className="text-sm">Notificações não suportadas neste navegador</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {permission === "granted" ? (
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-accent" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
              <BellOff className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium text-card-foreground text-sm">Lembrete Diário</p>
            <p className="text-xs text-muted-foreground">
              {permission === "granted"
                ? "Você receberá um lembrete diário"
                : "Ative para receber lembretes"}
            </p>
          </div>
        </div>

        {permission === "granted" ? (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <input
              type="time"
              value={notificationTime}
              onChange={(e) => onUpdateTime(e.target.value)}
              className="px-2 py-1.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ) : (
          <button
            onClick={onRequestPermission}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Ativar
          </button>
        )}
      </div>
    </div>
  )
}
