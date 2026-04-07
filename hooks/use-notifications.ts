"use client"

import { useState, useEffect, useCallback } from "react"

const NOTIFICATION_TIME_KEY = "notification_time"
const LAST_NOTIFICATION_KEY = "last_notification_date"

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [notificationTime, setNotificationTime] = useState<string>("08:00")
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported("Notification" in window)
    
    if ("Notification" in window) {
      setPermission(Notification.permission)
    }

    const storedTime = localStorage.getItem(NOTIFICATION_TIME_KEY)
    if (storedTime) {
      setNotificationTime(storedTime)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false
    
    const result = await Notification.requestPermission()
    setPermission(result)
    return result === "granted"
  }, [isSupported])

  const updateNotificationTime = useCallback((time: string) => {
    setNotificationTime(time)
    localStorage.setItem(NOTIFICATION_TIME_KEY, time)
  }, [])

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") return null
      return new Notification(title, options)
    },
    [isSupported, permission]
  )

  // Verificar e enviar notificação diária
  useEffect(() => {
    if (!isSupported || permission !== "granted") return

    const checkAndNotify = () => {
      const now = new Date()
      const today = now.toISOString().split("T")[0]
      const lastNotification = localStorage.getItem(LAST_NOTIFICATION_KEY)

      const [hours, minutes] = notificationTime.split(":").map(Number)
      const targetTime = new Date()
      targetTime.setHours(hours, minutes, 0, 0)

      // Se já passou do horário e não notificou hoje
      if (now >= targetTime && lastNotification !== today) {
        sendNotification("Hora de medir as temperaturas!", {
          body: "Não esqueça de registrar as temperaturas das geladeiras hoje.",
          icon: "/icon.svg",
          tag: "medicao-diaria",
        })
        localStorage.setItem(LAST_NOTIFICATION_KEY, today)
      }
    }

    // Verificar imediatamente e a cada minuto
    checkAndNotify()
    const interval = setInterval(checkAndNotify, 60000)

    return () => clearInterval(interval)
  }, [isSupported, permission, notificationTime, sendNotification])

  return {
    permission,
    notificationTime,
    isSupported,
    requestPermission,
    updateNotificationTime,
    sendNotification,
  }
}
