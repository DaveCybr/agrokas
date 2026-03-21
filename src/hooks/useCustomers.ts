import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Customer } from '@/types'

export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('aktif', true)
        .order('nama')
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

// ── Paginated query ───────────────────────────────────────────────────────────

export interface CustomersPageParams {
  page: number
  pageSize: number
  search: string
  tipe: '' | 'petani' | 'agen' | 'poktan'
  hutang: '' | 'ada-hutang' | 'lunas'
}

export interface CustomersPage {
  data: Customer[]
  total: number
}

export function useCustomersPaginated(params: CustomersPageParams) {
  const { page, pageSize, search, tipe, hutang } = params
  return useQuery<CustomersPage>({
    queryKey: ['customers-paginated', params],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to   = from + pageSize - 1

      let q = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('aktif', true)
        .order('nama')

      if (search)              q = q.or(`nama.ilike.%${search}%,desa.ilike.%${search}%,telp.ilike.%${search}%`)
      if (tipe)                q = q.eq('tipe', tipe)
      if (hutang === 'ada-hutang') q = q.gt('saldo_hutang', 0)
      if (hutang === 'lunas')      q = q.eq('saldo_hutang', 0)

      q = q.range(from, to)

      const { data, count, error } = await q
      if (error) throw error
      return { data: data as Customer[], total: count ?? 0 }
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

function invalidateCustomerQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['customers'] })
  qc.invalidateQueries({ queryKey: ['customers-paginated'] })
  qc.invalidateQueries({ queryKey: ['outstanding-debt'] })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

type CustomerInput = Omit<Customer, 'id' | 'saldo_hutang' | 'aktif'> & { aktif?: boolean }

export function useTambahPelanggan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CustomerInput) => {
      const { data: result, error } = await supabase
        .from('customers')
        .insert({ ...data, saldo_hutang: 0 })
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => invalidateCustomerQueries(qc),
  })
}

export function useUpdatePelanggan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Customer> & { id: string }) => {
      const { error } = await supabase.from('customers').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidateCustomerQueries(qc),
  })
}

export function useBayarHutang() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      customer_id: string
      jumlah: number
      metode: 'Tunai' | 'Transfer' | 'QRIS'
      catatan?: string
      kasir: string
    }) => {
      const { error } = await supabase.from('debt_payments').insert(data)
      if (error) throw error
    },
    onSuccess: () => invalidateCustomerQueries(qc),
  })
}
