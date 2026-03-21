import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Product, Category } from '@/types'

// ── Queries ──────────────────────────────────────────────────────────────────

/** Hanya produk aktif — dipakai di kasir */
export function useProducts(categoryId?: string, search?: string) {
  return useQuery<Product[]>({
    queryKey: ['products', categoryId, search],
    queryFn: async () => {
      let q = supabase
        .from('products')
        .select('*, categories(id, nama, icon)')
        .eq('aktif', true)
        .order('nama')

      if (categoryId) q = q.eq('category_id', categoryId)
      if (search) q = q.or(`nama.ilike.%${search}%,kode.ilike.%${search}%`)

      const { data, error } = await q
      if (error) throw error
      return data as Product[]
    },
    staleTime: 30_000,
  })
}

/** Semua produk termasuk nonaktif — dipakai di halaman manajemen */
export function useAllProducts() {
  return useQuery<Product[]>({
    queryKey: ['products-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(id, nama, icon)')
        .order('nama')
      if (error) throw error
      return data as Product[]
    },
    staleTime: 30_000,
  })
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('urutan')
      if (error) throw error
      return data
    },
    staleTime: 60_000,
  })
}

export function useLowStock() {
  return useQuery<Product[]>({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_low_stock').select('*')
      if (error) throw error
      return data as Product[]
    },
    staleTime: 30_000,
  })
}

// ── Paginated query ───────────────────────────────────────────────────────────

export interface ProductsPageParams {
  page: number
  pageSize: number
  search: string
  categoryId: string
  status: '' | 'aktif' | 'nonaktif'
  stokFilter: '' | 'kritis' | 'habis'
}

export interface ProductsPage {
  data: Product[]
  total: number
}

/**
 * Server-side paginated product list.
 * - search/category/status/habis → filtered di Supabase dengan .range()
 * - kritis → filter lain server-side, stok<=stok_minimum dilakukan client-side
 *   (PostgREST tidak support column-to-column comparison via JS client)
 */
export function useProductsPaginated(params: ProductsPageParams) {
  const { page, pageSize, search, categoryId, status, stokFilter } = params
  return useQuery<ProductsPage>({
    queryKey: ['products-paginated', params],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to   = from + pageSize - 1
      const isKritis = stokFilter === 'kritis'

      let q = supabase
        .from('products')
        .select('*, categories(id, nama, icon)', { count: 'exact' })
        .order('nama')

      // Server-side filters
      if (search)     q = q.or(`nama.ilike.%${search}%,kode.ilike.%${search}%`)
      if (categoryId) q = q.eq('category_id', categoryId)
      if (status === 'aktif')    q = q.eq('aktif', true)
      if (status === 'nonaktif') q = q.eq('aktif', false)
      if (stokFilter === 'habis') q = q.eq('stok', 0)

      // Range hanya untuk non-kritis; kritis fetch all lalu potong client-side
      // (PostgREST tidak support column-to-column comparison via JS client)
      if (!isKritis) q = q.range(from, to)

      const { data: raw, count: rawCount, error } = await q
      if (error) throw error

      let data = raw as Product[]
      let total = rawCount ?? 0

      if (isKritis) {
        const filtered = data.filter((p) => p.stok > 0 && p.stok <= p.stok_minimum)
        total = filtered.length
        data  = filtered.slice(from, to + 1)
      }

      return { data, total }
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

type ProductInput = Omit<Product, 'id' | 'categories'>

function invalidateProductQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['products'] })
  qc.invalidateQueries({ queryKey: ['products-all'] })
  qc.invalidateQueries({ queryKey: ['products-paginated'] })  // invalidate all pages
  qc.invalidateQueries({ queryKey: ['low-stock'] })
}

export function useTambahProduk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: ProductInput) => {
      const { data: result, error } = await supabase
        .from('products')
        .insert(data)
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => invalidateProductQueries(qc),
  })
}

export function useUpdateProduk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProductInput> & { id: string }) => {
      const { error } = await supabase.from('products').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidateProductQueries(qc),
  })
}

/** Buat produk baru dengan data minimal — dipakai saat terima barang produk baru */
export function useTambahProdukCepat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { nama: string; satuan: string; harga_beli: number }) => {
      const { data: result, error } = await supabase
        .from('products')
        .insert({
          nama: data.nama,
          satuan: data.satuan,
          harga_beli: data.harga_beli,
          harga_jual: data.harga_beli,
          stok: 0,
          stok_minimum: 0,
          aktif: true,
        })
        .select()
        .single()
      if (error) throw error
      return result as Product
    },
    onSuccess: () => invalidateProductQueries(qc),
  })
}

export function useStokOpname() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      product_id: string
      stok_lama: number
      stok_baru: number
      alasan: string
      catatan?: string
      kasir: string
    }) => {
      // Insert adjustment record
      const { error: adjError } = await supabase
        .from('stock_adjustments')
        .insert(data)
      if (adjError) throw adjError

      // Update product stok directly (handles case where DB trigger doesn't exist)
      const { error: prodError } = await supabase
        .from('products')
        .update({ stok: data.stok_baru })
        .eq('id', data.product_id)
      if (prodError) throw prodError
    },
    onSuccess: () => invalidateProductQueries(qc),
  })
}
