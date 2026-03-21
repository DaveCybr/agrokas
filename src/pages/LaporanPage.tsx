import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatDate } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'

export function LaporanPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['daily-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_daily_summary')
        .select('*')
        .limit(30)
      if (error) throw error
      return data
    },
  })

  const today = summary?.[0]

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">Laporan</h1>

      {/* Stats hari ini */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Omzet hari ini', value: formatRupiah(today?.omzet ?? 0), color: 'text-primary-700' },
          { label: 'Transaksi', value: today?.jumlah_transaksi ?? 0, color: 'text-blue-600' },
          { label: 'Laba kotor', value: formatRupiah(today?.laba_kotor ?? 0), color: 'text-teal-600' },
          { label: 'Total diskon', value: formatRupiah(today?.total_diskon ?? 0), color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabel laporan harian */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm">
          Riwayat Penjualan Harian
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                {['Tanggal', 'Transaksi', 'Omzet', 'Diskon', 'Laba Kotor'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {summary?.map((row: any) => (
                <tr key={row.tanggal} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(row.tanggal)}</td>
                  <td className="px-4 py-3">{row.jumlah_transaksi}x</td>
                  <td className="px-4 py-3 font-medium text-primary-700">{formatRupiah(row.omzet)}</td>
                  <td className="px-4 py-3 text-amber-600">{formatRupiah(row.total_diskon)}</td>
                  <td className="px-4 py-3 text-teal-600 font-medium">{formatRupiah(row.laba_kotor)}</td>
                </tr>
              ))}
              {!summary?.length && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Belum ada data transaksi</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
