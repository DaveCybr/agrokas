import { useCustomers } from '@/hooks/useCustomers'
import { formatRupiah, getInitials } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { useState } from 'react'

export function PelangganPage() {
  const [search, setSearch] = useState('')
  const { data: customers, isLoading } = useCustomers(search || undefined)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Pelanggan</h1>
          <p className="text-sm text-gray-400">Data pelanggan & buku hutang</p>
        </div>
        <button className="btn-primary text-sm">+ Tambah Pelanggan</button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <input
            className="input max-w-sm"
            placeholder="Cari pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : customers?.length === 0 ? (
          <EmptyState icon="👥" title="Belum ada pelanggan" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                {['Pelanggan', 'Tipe', 'Desa', 'Komoditas', 'Saldo Hutang', 'Limit'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers?.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-xs font-medium text-primary-700">
                        {getInitials(c.nama)}
                      </div>
                      <div>
                        <p className="font-medium">{c.nama}</p>
                        <p className="text-xs text-gray-400">{c.telp ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={c.tipe === 'poktan' ? 'blue' : c.tipe === 'agen' ? 'amber' : 'gray'}>
                      {c.tipe}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.desa ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.komoditas ?? '—'}</td>
                  <td className="px-4 py-3">
                    {c.saldo_hutang > 0 ? (
                      <span className="font-medium text-red-500">{formatRupiah(c.saldo_hutang)}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatRupiah(c.limit_kredit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
