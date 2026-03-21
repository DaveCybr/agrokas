import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DailySummary, TopProduct } from '@/types'

export function useDailySummary(from: string, to: string) {
  return useQuery<DailySummary[]>({
    queryKey: ['daily-summary', from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_daily_summary')
        .select('*')
        .gte('tanggal', from)
        .lte('tanggal', to)
        .order('tanggal', { ascending: false })
      if (error) throw error
      return data as DailySummary[]
    },
    staleTime: 60_000,
  })
}

export function useTopProducts(limit = 10) {
  return useQuery<TopProduct[]>({
    queryKey: ['top-products', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_top_products')
        .select('*')
        .limit(limit)
      if (error) throw error
      return data as TopProduct[]
    },
    staleTime: 60_000,
  })
}

export function usePeriodSummary(from: string, to: string) {
  const { data } = useDailySummary(from, to)
  return {
    totalOmzet:     data?.reduce((s, r) => s + Number(r.omzet), 0) ?? 0,
    totalTransaksi: data?.reduce((s, r) => s + Number(r.jumlah_transaksi), 0) ?? 0,
    totalLaba:      data?.reduce((s, r) => s + Number(r.laba_kotor), 0) ?? 0,
    totalDiskon:    data?.reduce((s, r) => s + Number(r.total_diskon), 0) ?? 0,
  }
}
