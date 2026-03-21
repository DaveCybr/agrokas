import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Supplier, PurchaseOrder, GoodsReceipt } from '@/types'

export function useSuppliers(search?: string) {
  return useQuery<Supplier[]>({
    queryKey: ['suppliers', search],
    queryFn: async () => {
      let q = supabase.from('suppliers').select('*').eq('aktif', true).order('nama')
      if (search) q = q.ilike('nama', `%${search}%`)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function usePurchaseOrders(status?: string) {
  return useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders', status],
    queryFn: async () => {
      let q = supabase
        .from('purchase_orders')
        .select('*, suppliers(id,nama,telp), purchase_order_items(*)')
        .order('created_at', { ascending: false })
      if (status) q = q.eq('status', status)
      const { data, error } = await q
      if (error) throw error
      return data as PurchaseOrder[]
    },
  })
}

export function useGoodsReceipts() {
  return useQuery<GoodsReceipt[]>({
    queryKey: ['goods-receipts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goods_receipts')
        .select('*, suppliers(id,nama), goods_receipt_items(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as GoodsReceipt[]
    },
  })
}

export function useTambahSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Supplier, 'id' | 'saldo_hutang' | 'created_at'>) => {
      const { data: result, error } = await supabase
        .from('suppliers').insert({ ...data, saldo_hutang: 0 }).select().single()
      if (error) throw error
      return result
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Supplier> & { id: string }) => {
      const { error } = await supabase.from('suppliers').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function useBuatPO() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      po,
      items,
    }: {
      po: { supplier_id: string; catatan?: string; tanggal_kirim?: string }
      items: { product_id: string; nama_produk: string; satuan: string; qty_pesan: number; harga_beli: number }[]
    }) => {
      const { data: poData, error: poErr } = await supabase
        .from('purchase_orders')
        .insert({ ...po, no_po: '', status: 'draft' })
        .select()
        .single()
      if (poErr) throw poErr

      const { error: itemErr } = await supabase
        .from('purchase_order_items')
        .insert(items.map(i => ({ ...i, po_id: poData.id })))
      if (itemErr) throw itemErr

      return poData
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
  })
}

export function useUpdatePOStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('purchase_orders').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
  })
}

export function useTerimaBarang() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      gr,
      items,
    }: {
      gr: { po_id?: string; supplier_id: string; metode_bayar: string; catatan?: string; tanggal: string }
      items: { product_id?: string; po_item_id?: string; nama_produk: string; satuan: string; qty_diterima: number; harga_beli: number }[]
    }) => {
      const { data: grData, error: grErr } = await supabase
        .from('goods_receipts')
        .insert({ ...gr, no_terima: '' })
        .select()
        .single()
      if (grErr) throw grErr

      const { error: itemErr } = await supabase
        .from('goods_receipt_items')
        .insert(items.map(i => ({ ...i, gr_id: grData.id })))
      if (itemErr) throw itemErr

      // Update total (triggers handle stok + HPP + saldo_hutang)
      const total = items.reduce((s, i) => s + i.qty_diterima * i.harga_beli, 0)
      await supabase.from('goods_receipts').update({ total }).eq('id', grData.id)

      // If hutang, update supplier saldo manually (in case trigger isn't set up for GR insert yet)
      if (gr.metode_bayar === 'Hutang') {
        const { data: sup } = await supabase.from('suppliers').select('saldo_hutang').eq('id', gr.supplier_id).single()
        if (sup) {
          await supabase.from('suppliers').update({ saldo_hutang: Number(sup.saldo_hutang) + total }).eq('id', gr.supplier_id)
        }
      }

      // Auto-update status PO berdasarkan qty diterima vs qty pesan
      if (gr.po_id) {
        const { data: poItems } = await supabase
          .from('purchase_order_items')
          .select('qty_pesan, qty_diterima')
          .eq('po_id', gr.po_id)

        if (poItems && poItems.length > 0) {
          const semuaSelesai = poItems.every(i => Number(i.qty_diterima) >= Number(i.qty_pesan))
          const adaSebagian  = poItems.some(i => Number(i.qty_diterima) > 0)
          const newStatus    = semuaSelesai ? 'selesai' : adaSebagian ? 'sebagian' : 'dikirim'
          await supabase.from('purchase_orders').update({ status: newStatus }).eq('id', gr.po_id)
        }
      }

      return grData
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goods-receipts'] })
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}

export function useBayarHutangSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      supplier_id: string
      gr_id?: string
      jumlah: number
      metode: 'Tunai' | 'Transfer' | 'Giro'
      catatan?: string
    }) => {
      const { error } = await supabase.from('supplier_payments').insert(data)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function useSupplierPayments(supplierId: string) {
  return useQuery({
    queryKey: ['supplier-payments', supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_payments')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!supplierId,
  })
}

export function useSupplierReceipts(supplierId: string) {
  return useQuery({
    queryKey: ['supplier-receipts', supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goods_receipts')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!supplierId,
  })
}
