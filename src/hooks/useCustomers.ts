import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Customer } from '@/types'

export function useCustomers(search?: string) {
  return useQuery<Customer[]>({
    queryKey: ['customers', search],
    queryFn: async () => {
      let q = supabase
        .from('customers')
        .select('*')
        .eq('aktif', true)
        .order('nama')

      if (search) q = q.ilike('nama', `%${search}%`)

      const { data, error } = await q
      if (error) throw error
      return data
    },
    staleTime: 30_000,
  })
}

export function useOutstandingDebt() {
  return useQuery({
    queryKey: ['outstanding-debt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_outstanding_debt')
        .select('*')
      if (error) throw error
      return data
    },
    staleTime: 30_000,
  })
}
