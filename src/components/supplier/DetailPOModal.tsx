import { useState } from 'react'
import type { PurchaseOrder } from '@/types'
import { useUpdatePOStatus } from '@/hooks/useSupplier'
import { formatRupiah, formatDate } from '@/lib/utils'

interface Props {
  po: PurchaseOrder
  onClose: () => void
  onTerima: () => void
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', dikirim: 'Dikirim', sebagian: 'Sebagian', selesai: 'Selesai', batal: 'Batal',
}
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:    { bg: '#F3F4F6', color: '#4B5563' },
  dikirim:  { bg: '#EFF6FF', color: '#1D4ED8' },
  sebagian: { bg: '#FFFBEB', color: '#B45309' },
  selesai:  { bg: '#EAF3DE', color: '#1B4332' },
  batal:    { bg: '#FEF2F2', color: '#DC2626' },
}

export function DetailPOModal({ po, onClose, onTerima }: Props) {
  const updateStatus = useUpdatePOStatus()
  const s = STATUS_STYLE[po.status] ?? STATUS_STYLE.draft
  const [error, setError] = useState('')

  async function handleKirim() {
    if (!confirm(`Ubah status ${po.no_po} menjadi "Dikirim"?`)) return
    try {
      setError('')
      await updateStatus.mutateAsync({ id: po.id, status: 'dikirim' })
    } catch (err) {
      setError((err as Error).message)
    }
  }
  async function handleBatal() {
    if (!confirm(`Batalkan PO ${po.no_po}? Tindakan ini tidak bisa dibatalkan.`)) return
    try {
      setError('')
      await updateStatus.mutateAsync({ id: po.id, status: 'batal' })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ border: '1px solid #E5E0D5' }} onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #E8E6E0' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm" style={{ color: '#1A1A18' }}>{po.no_po}</h2>
              <p className="text-xs mt-0.5" style={{ color: '#9B9890' }}>
                {po.suppliers?.nama} · {formatDate(po.tanggal_po)}
                {po.tanggal_kirim && ` · Est. kirim: ${formatDate(po.tanggal_kirim)}`}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>
              {STATUS_LABEL[po.status]}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: '#F8F8F6' }}>
              <tr>
                {['Produk', 'Satuan', 'Qty Pesan', 'Qty Diterima', 'Harga Beli', 'Subtotal'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9B9890' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!po.purchase_order_items?.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: '#9B9890' }}>
                    Tidak ada item di PO ini
                  </td>
                </tr>
              )}
              {po.purchase_order_items?.map(item => {
                const done = Number(item.qty_diterima) >= Number(item.qty_pesan)
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F0EEE8', backgroundColor: !done && po.status === 'selesai' ? '#FEF2F2' : 'transparent' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: '#1A1A18' }}>{item.nama_produk}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B6963' }}>{item.satuan}</td>
                    <td className="px-4 py-3" style={{ color: '#1A1A18' }}>{Number(item.qty_pesan).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3">
                      <span style={{ color: done ? '#3B6D11' : '#D97706' }}>
                        {Number(item.qty_diterima).toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs ml-1" style={{ color: '#9B9890' }}>/ {Number(item.qty_pesan).toLocaleString('id-ID')}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B6963', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(Number(item.harga_beli))}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(Number(item.subtotal))}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="px-4 py-3 flex justify-end" style={{ borderTop: '2px solid #E8E6E0' }}>
            <div className="text-right">
              <p className="text-xs" style={{ color: '#9B9890' }}>Total PO</p>
              <p className="text-lg font-bold" style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(Number(po.total_po))}</p>
            </div>
          </div>

          {po.catatan && (
            <div className="px-4 py-3" style={{ borderTop: '1px solid #E8E6E0' }}>
              <p className="text-xs" style={{ color: '#9B9890' }}>Catatan: <span style={{ color: '#6B6963' }}>{po.catatan}</span></p>
            </div>
          )}
        </div>

        {error && (
          <div className="px-6 py-2">
            <p className="text-xs" style={{ color: '#DC2626' }}>{error}</p>
          </div>
        )}
        <div className="px-6 py-4 flex justify-between items-center" style={{ borderTop: '1px solid #E8E6E0' }}>
          <div className="flex gap-2">
            {po.status === 'draft' && (
              <>
                <button onClick={handleKirim} disabled={updateStatus.isPending}
                  className="px-3 py-2 text-xs font-medium rounded-lg" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                  Ubah ke Dikirim
                </button>
                <button onClick={handleBatal} disabled={updateStatus.isPending}
                  className="px-3 py-2 text-xs font-medium rounded-lg" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                  Batalkan PO
                </button>
              </>
            )}
            {(po.status === 'dikirim' || po.status === 'sebagian') && (
              <button onClick={onTerima}
                className="px-3 py-2 text-xs font-medium rounded-lg" style={{ backgroundColor: '#EAF3DE', color: '#3B6D11' }}>
                Terima Barang
              </button>
            )}
          </div>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ backgroundColor: '#F0EEE8', color: '#6B6963' }}>Tutup</button>
        </div>
      </div>
    </div>
  )
}
