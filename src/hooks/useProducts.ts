import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Product, Category } from '@/types'

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
      if (search) q = q.ilike('nama', `%${search}%`)

      const { data, error } = await q
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
      const { data, error } = await supabase
        .from('v_low_stock')
        .select('*')
      if (error) throw error
      return data as Product[]
    },
    staleTime: 30_000,
  })
}
