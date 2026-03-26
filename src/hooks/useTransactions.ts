import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Transaction } from '@/types'

export function useTransactions(from: string, to: string, search = '') {
  return useQuery<Transaction[]>({
    queryKey: ['transactions', from, to, search],
    queryFn: async () => {
      let q = supabase
        .from('transactions')
        .select('*, customers(id, nama, desa, tipe, saldo_hutang, limit_kredit), transaction_items(id, product_id, nama_produk, qty, harga_jual, harga_beli, subtotal, satuan)')
        .gte('created_at', from + 'T00:00:00')
        .lte('created_at', to + 'T23:59:59')
        .order('created_at', { ascending: false })

      if (search.trim()) {
        q = q.or(`no_transaksi.ilike.%${search.trim()}%`)
      }

      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Transaction[]
    },
    staleTime: 30_000,
  })
}

export function useVoidTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, alasan }: { id: string; alasan: string }) => {
      // 1. Fetch transaction with items
      const { data: trx, error: trxErr } = await supabase
        .from('transactions')
        .select('*, transaction_items(product_id, qty)')
        .eq('id', id)
        .single()
      if (trxErr) throw trxErr
      if (trx.status === 'batal') throw new Error('Transaksi sudah dibatalkan')

      // 2. Mark as batal
      const { error: updateErr } = await supabase
        .from('transactions')
        .update({ status: 'batal', catatan: alasan })
        .eq('id', id)
      if (updateErr) throw updateErr

      // 3. Reverse stok for each item
      for (const item of trx.transaction_items ?? []) {
        if (!item.product_id) continue
        const { data: prod, error: prodErr } = await supabase
          .from('products')
          .select('stok')
          .eq('id', item.product_id)
          .single()
        if (prodErr || !prod) continue
        await supabase
          .from('products')
          .update({ stok: Number(prod.stok) + Number(item.qty) })
          .eq('id', item.product_id)
      }

      // 4. Reverse saldo_hutang pelanggan jika metode Hutang
      if (trx.metode_bayar === 'Hutang' && trx.customer_id) {
        const { data: cust } = await supabase
          .from('customers')
          .select('saldo_hutang')
          .eq('id', trx.customer_id)
          .single()
        if (cust) {
          const newSaldo = Math.max(0, Number(cust.saldo_hutang) - Number(trx.total))
          await supabase
            .from('customers')
            .update({ saldo_hutang: newSaldo })
            .eq('id', trx.customer_id)
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['products-all'] })
      qc.invalidateQueries({ queryKey: ['daily-summary'] })
      qc.invalidateQueries({ queryKey: ['low-stock'] })
    },
  })
}
