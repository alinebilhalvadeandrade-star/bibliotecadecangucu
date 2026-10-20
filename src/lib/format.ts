const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' })

export function formatDate(iso: string) {
  return dateFmt.format(new Date(iso)).replace('.', '')
}

/** "em 3 dias", "amanhã", "hoje", "há 2 dias". */
export function relativeDays(iso: string) {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'amanhã'
  if (days > 1) return `em ${days} dias`
  if (days === -1) return 'ontem'
  return `há ${-days} dias`
}
