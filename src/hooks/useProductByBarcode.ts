import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types'

export function useProductByBarcode() {
  return useMutation({
    mutationFn: async (barcode: string): Promise<Product> => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(id, nama, icon)')
        .eq('kode', barcode)
        .eq('aktif', true)
        .single()
      if (error) throw new Error(`Produk dengan kode '${barcode}' tidak ditemukan`)
      return data as Product
    },
  })
}
