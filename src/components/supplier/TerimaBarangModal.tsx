import { useState } from 'react'
import type { PurchaseOrder, Product } from '@/types'
import { useTerimaBarang } from '@/hooks/useSupplier'
import { useSuppliers } from '@/hooks/useSupplier'
import { useProducts, useTambahProdukCepat } from '@/hooks/useProducts'
import { formatRupiah } from '@/lib/utils'
import { SATUAN_OPTIONS } from '@/lib/constants'

interface GRItemRow {
  product_id: string
  po_item_id?: string
  nama_produk: string
  satuan: string
  qty_diterima: number
  harga_beli: number
  max_qty?: number   // sisa qty yang boleh diterima (hanya untuk item dari PO)
}

interface Props {
  po?: PurchaseOrder | null
  onClose: () => void
}

export function TerimaBarangModal({ po, onClose }: Props) {
  const terima = useTerimaBarang()
  const tambahProdukCepat = useTambahProdukCepat()
  const { data: suppliers } = useSuppliers()
  const [productSearch, setProductSearch] = useState('')
  const { data: products } = useProducts(undefined, productSearch)
  const [showProductPicker, setShowProductPicker] = useState<number | null>(null)
  const [newProdForm, setNewProdForm] = useState<{ idx: number; nama: string; satuan: string } | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const [supplierId, setSupplierId] = useState(po?.supplier_id ?? '')
  const [tanggal, setTanggal] = useState(today)
  const [metode, setMetode] = useState<'Tunai' | 'Transfer' | 'Hutang'>('Hutang')
  const [catatan, setCatatan] = useState('')
  const [error, setError] = useState('')

  const [items, setItems] = useState<GRItemRow[]>(() => {
    if (!po?.purchase_order_items) return [{ product_id: '', nama_produk: '', satuan: '', qty_diterima: 1, harga_beli: 0 }]
    return po.purchase_order_items.map(i => {
      const sisa = Number(i.qty_pesan) - Number(i.qty_diterima)
      return {
        product_id: i.product_id ?? '',
        po_item_id: i.id,
        nama_produk: i.nama_produk,
        satuan: i.satuan,
        qty_diterima: sisa,
        harga_beli: Number(i.harga_beli),
        max_qty: sisa,
      }
    }).filter(i => i.qty_diterima > 0)
  })

  const total = items.reduce((s, i) => s + i.qty_diterima * i.harga_beli, 0)

  function addItem() {
    setItems(prev => [...prev, { product_id: '', nama_produk: '', satuan: '', qty_diterima: 1, harga_beli: 0 }])
  }
  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }
  function updateItem(idx: number, key: keyof GRItemRow, value: string | number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item))
  }
  function selectProduct(idx: number, product: Product) {
    setItems(prev => prev.map((item, i) => i === idx ? {
      ...item, product_id: product.id, nama_produk: product.nama, satuan: product.satuan, harga_beli: product.harga_beli,
    } : item))
    setShowProductPicker(null)
    setProductSearch('')
    setNewProdForm(null)
  }

  async function handleTambahProdukBaru() {
    if (!newProdForm || !newProdForm.satuan.trim()) return
    try {
      const hargaBeli = items[newProdForm.idx]?.harga_beli ?? 0
      const prod = await tambahProdukCepat.mutateAsync({
        nama: newProdForm.nama,
        satuan: newProdForm.satuan.trim(),
        harga_beli: hargaBeli,
      })
      selectProduct(newProdForm.idx, prod)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleSubmit() {
    if (!supplierId) { setError('Pilih supplier'); return }
    if (!items.length) { setError('Tambah minimal 1 item'); return }
    if (items.some(i => !i.nama_produk || i.qty_diterima <= 0 || i.harga_beli <= 0)) {
      setError('Lengkapi semua item'); return
    }
    const itemMelebihi = items.find(i => i.max_qty !== undefined && i.qty_diterima > i.max_qty)
    if (itemMelebihi) {
      setError(`Qty "${itemMelebihi.nama_produk}" melebihi sisa pesanan (maks ${itemMelebihi.max_qty})`); return
    }
    try {
      await terima.mutateAsync({
        gr: { po_id: po?.id, supplier_id: supplierId, metode_bayar: metode, catatan: catatan || undefined, tanggal },
        items: items.map(i => ({
          product_id: i.product_id || undefined,
          po_item_id: i.po_item_id,
          nama_produk: i.nama_produk,
          satuan: i.satuan,
          qty_diterima: i.qty_diterima,
          harga_beli: i.harga_beli,
        })),
      })
      onClose()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ border: '1px solid #E5E0D5' }} onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #E8E6E0' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#1A1A18' }}>
            Terima Barang {po ? `— dari ${po.no_po}` : '— Tanpa PO'}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6B6963' }}>Supplier *</label>
              {po ? (
                <p className="px-3 py-2 text-sm rounded-lg" style={{ backgroundColor: '#F8F8F6', color: '#1A1A18' }}>
                  {po.suppliers?.nama ?? suppliers?.find(s => s.id === supplierId)?.nama ?? '—'}
                </p>
              ) : (
                <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none" style={{ borderColor: '#D5D3CD', color: '#1A1A18' }}>
                  <option value="">-- Pilih --</option>
                  {suppliers?.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6B6963' }}>Tanggal Terima</label>
              <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border outline-none" style={{ borderColor: '#D5D3CD', color: '#1A1A18' }} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#6B6963' }}>Metode Bayar</label>
            <div className="flex gap-2">
              {(['Tunai', 'Transfer', 'Hutang'] as const).map(m => (
                <button key={m} onClick={() => setMetode(m)}
                  className="flex-1 py-2 text-sm rounded-lg font-medium"
                  style={metode === m ? { backgroundColor: '#3B6D11', color: '#fff' } : { backgroundColor: '#F0EEE8', color: '#6B6963' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{ color: '#1A1A18' }}>Item Diterima</p>
              {!po && (
                <button onClick={addItem} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg"
                  style={{ backgroundColor: '#EAF3DE', color: '#3B6D11' }}>+ Tambah Item</button>
              )}
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl relative" style={{ backgroundColor: '#F8F8F6', border: '1px solid #E8E6E0' }}>
                  <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>✕</button>

                  <div className="mb-2 relative">
                    {item.po_item_id ? (
                      <p className="px-3 py-2 text-sm rounded-lg font-medium" style={{ backgroundColor: '#EAF3DE', color: '#3B6D11' }}>
                        {item.nama_produk} <span className="text-xs font-normal" style={{ color: '#6B9E3A' }}>(dari PO)</span>
                      </p>
                    ) : (
                      <>
                        <button onClick={() => { setShowProductPicker(showProductPicker === idx ? null : idx); setProductSearch(''); setNewProdForm(null) }}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg border"
                          style={{ borderColor: '#D5D3CD', color: item.nama_produk ? '#1A1A18' : '#9B9890', backgroundColor: '#fff' }}>
                          {item.nama_produk || 'Pilih produk...'}
                        </button>
                        {showProductPicker === idx && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg z-10 overflow-hidden"
                            style={{ border: '1px solid #E5E0D5' }}>
                            <div className="p-2 border-b" style={{ borderColor: '#E8E6E0' }}>
                              <input autoFocus value={productSearch} onChange={e => { setProductSearch(e.target.value); setNewProdForm(null) }}
                                placeholder="Cari..." className="w-full px-2 py-1 text-xs outline-none" />
                            </div>
                            <div className="overflow-y-auto" style={{ maxHeight: '150px' }}>
                              {products?.map(p => (
                                <button key={p.id} onClick={() => selectProduct(idx, p)}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50">
                                  <span style={{ color: '#1A1A18' }}>{p.nama}</span>
                                  <span className="ml-2" style={{ color: '#9B9890' }}>{p.satuan}</span>
                                </button>
                              ))}
                              {/* Tombol tambah produk baru */}
                              {productSearch.trim() && !products?.length && (
                                newProdForm?.idx === idx ? (
                                  <div className="p-2 space-y-2">
                                    <p className="text-xs font-medium" style={{ color: '#1A1A18' }}>
                                      Produk baru: <span style={{ color: '#3B6D11' }}>{newProdForm.nama}</span>
                                    </p>
                                    <select
                                      autoFocus
                                      value={newProdForm.satuan}
                                      onChange={e => setNewProdForm(f => f ? { ...f, satuan: e.target.value } : f)}
                                      className="w-full px-2 py-1.5 text-xs rounded-lg border outline-none"
                                      style={{ borderColor: '#D5D3CD', color: newProdForm.satuan ? '#1A1A18' : '#9B9890' }}
                                    >
                                      <option value="">-- Pilih satuan --</option>
                                      {SATUAN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <div className="flex gap-1.5">
                                      <button onClick={() => setNewProdForm(null)}
                                        className="flex-1 py-1 text-xs rounded-lg" style={{ backgroundColor: '#F0EEE8', color: '#6B6963' }}>
                                        Batal
                                      </button>
                                      <button onClick={handleTambahProdukBaru} disabled={!newProdForm.satuan.trim() || tambahProdukCepat.isPending}
                                        className="flex-1 py-1 text-xs font-medium rounded-lg" style={{ backgroundColor: '#3B6D11', color: '#fff' }}>
                                        {tambahProdukCepat.isPending ? '...' : 'Tambah & Pilih'}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button onClick={() => setNewProdForm({ idx, nama: productSearch.trim(), satuan: '' })}
                                    className="w-full text-left px-3 py-2.5 text-xs font-medium border-t"
                                    style={{ borderColor: '#E8E6E0', color: '#3B6D11', backgroundColor: '#F0F7E8' }}>
                                    + Tambah "{productSearch.trim()}" sebagai produk baru
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#9B9890' }}>Satuan</label>
                      <select value={item.satuan} onChange={e => updateItem(idx, 'satuan', e.target.value)}
                        disabled={!!item.product_id}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border outline-none"
                        style={{ borderColor: '#D5D3CD', color: '#1A1A18', backgroundColor: item.product_id ? '#F0EEE8' : '#fff', cursor: item.product_id ? 'not-allowed' : 'default' }}>
                        <option value="">-- Pilih --</option>
                        {SATUAN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#9B9890' }}>
                        Qty Diterima
                        {item.max_qty !== undefined && (
                          <span className="ml-1 font-normal" style={{ color: '#9B9890' }}>
                            (maks {item.max_qty})
                          </span>
                        )}
                      </label>
                      <input
                        type="number" min="0" step="0.01"
                        max={item.max_qty}
                        value={item.qty_diterima}
                        onChange={e => {
                          const val = Number(e.target.value)
                          const clamped = item.max_qty !== undefined ? Math.min(val, item.max_qty) : val
                          updateItem(idx, 'qty_diterima', clamped)
                        }}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border outline-none"
                        style={{
                          borderColor: item.max_qty !== undefined && item.qty_diterima > item.max_qty ? '#DC2626' : '#D5D3CD',
                          color: '#1A1A18', backgroundColor: '#fff',
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#9B9890' }}>Harga Beli</label>
                      <input type="number" min="0" value={item.harga_beli}
                        onChange={e => updateItem(idx, 'harga_beli', Number(e.target.value))}
                        disabled={!!item.po_item_id}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border outline-none"
                        style={{ borderColor: '#D5D3CD', color: '#1A1A18', backgroundColor: item.po_item_id ? '#F0EEE8' : '#fff', cursor: item.po_item_id ? 'not-allowed' : 'default' }} />
                    </div>
                  </div>
                  <div className="mt-2 text-right text-xs font-semibold" style={{ color: '#3B6D11' }}>
                    Subtotal: {formatRupiah(item.qty_diterima * item.harga_beli)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {total > 0 && (
            <div className="px-4 py-3 rounded-xl flex justify-between items-center"
              style={{ backgroundColor: '#EAF3DE', border: '1px solid #C8E6A0' }}>
              <span className="text-sm font-semibold" style={{ color: '#3B6D11' }}>Total</span>
              <span className="text-lg font-bold" style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(total)}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#6B6963' }}>Catatan</label>
            <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2} placeholder="Opsional"
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none resize-none" style={{ borderColor: '#D5D3CD', color: '#1A1A18' }} />
          </div>

          {error && <p className="text-xs" style={{ color: '#DC2626' }}>{error}</p>}
        </div>

        <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: '1px solid #E8E6E0' }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ backgroundColor: '#F0EEE8', color: '#6B6963' }}>Batal</button>
          <button onClick={handleSubmit} disabled={terima.isPending}
            className="px-4 py-2 text-sm font-medium rounded-lg" style={{ backgroundColor: '#3B6D11', color: '#fff' }}>
            {terima.isPending ? 'Menyimpan...' : '✓ Simpan & Perbarui Stok'}
          </button>
        </div>
      </div>
    </div>
  )
}
