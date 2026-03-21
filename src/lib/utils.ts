export function formatRupiah(amount: number): string {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID')
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function generateNoTransaksi(): string {
  const now = new Date()
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `TRX-${ymd}-${rand}`
}

// Pilih harga berdasarkan qty (grosir atau eceran)
export function getHargaEfektif(
  harga_jual: number,
  harga_grosir: number | null,
  min_grosir: number | null,
  qty: number
): number {
  if (harga_grosir && min_grosir && qty >= min_grosir) {
    return harga_grosir
  }
  return harga_jual
}
