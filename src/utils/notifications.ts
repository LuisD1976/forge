export function notificationsSupported() {
  return 'Notification' in window
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function showNotification(title: string, body: string, icon = '/icons/icon-192.png') {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, { body, icon, badge: '/icons/icon-96.png' })
    })
  } else {
    new Notification(title, { body, icon })
  }
}

export function checkAndShowReminderIfNeeded(lastSessionDate: string | null, remindersEnabled: boolean) {
  if (!remindersEnabled) return
  if (Notification.permission !== 'granted') return

  const now = new Date()
  const hour = now.getHours()
  if (hour < 17) return // Only remind after 5pm

  if (!lastSessionDate) {
    showNotification('💪 ¡Es hora de entrenar!', 'No has registrado ningún entreno aún. ¡Empieza tu primer día hoy!')
    return
  }
  const last = new Date(lastSessionDate)
  const diffDays = Math.floor((now.getTime() - last.getTime()) / 86400000)
  if (diffDays >= 1) {
    showNotification(
      '🔥 ¡Tu racha te necesita!',
      diffDays === 1 ? 'Ayer entrenaste. ¡No rompas la racha hoy!' : `Llevas ${diffDays} días sin entrenar. ¡Vuelve fuerte!`
    )
  }
}
