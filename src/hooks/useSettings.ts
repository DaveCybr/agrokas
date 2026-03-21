import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Settings } from '@/types'

export function useSettings() {
  return useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    staleTime: 300_000,
  })
}
