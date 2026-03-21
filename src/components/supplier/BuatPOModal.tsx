import { useState } from 'react'
import { useBuatPO } from '@/hooks/useSupplier'
import { useSuppliers } from '@/hooks/useSupplier'
import { useProducts, useTambahProdukCepat } from '@/hooks/useProducts'
import type { Product } from '@/types'
import { formatRupiah } from '@/lib/utils'
import { SATUAN_OPTIONS } from '@/lib/constants'

interface POItemRow {
  product_id: string
  nama_produk: string
  satuan: string
  qty_pesan: number
  harga_beli: number
}

interface Props {
  onClose: () => void
}

export function BuatPOModal({ onClose }: Props) {
  const buatPO = useBuatPO()
  const tambahProdukCepat = useTambahProdukCepat()
  const { data: suppliers } = useSuppliers()
  const [productSearch, setProductSearch] = useState('')
  const { data: products } = useProducts(undefined, productSearch)

  const [step, setStep] = useState<1 | 2>(1)
  const [supplierId, setSupplierId] = useState('')
  const [tanggalKirim, setTanggalKirim] = useState('')
  const [catatan, setCatatan] = useState('')
  const [items, setItems] = useState<POItemRow[]>([])
  const [error, setError] = useState('')
  const [showProductPicker, setShowProductPicker] = useState<number | null>(null)
  // State untuk form produk baru inline
  const [newProdForm, setNewProdForm] = useState<{ idx: number; nama: string; satuan: string } | null>(null)

  const total = items.reduce((s, i) => s + i.qty_pesan * i.harga_beli, 0)

  function addItem() {
    setItems(prev => [...prev, { product_id: '', nama_produk: '', satuan: '', qty_pesan: 1, harga_beli: 0 }])
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, key: keyof POItemRow, value: string | number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item))
  }

  function selectProduct(idx: number, product: Product) {
    setItems(prev => prev.map((item, i) => i === idx ? {
      ...item,
      product_id: product.id,
      nama_produk: product.nama,
      satuan: product.satuan,
      harga_beli: product.harga_beli,
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
    if (!items.length) { setError('Tambah minimal 1 item'); return }
    if (items.some(i => !i.product_id || i.qty_pesan <= 0 || i.harga_beli <= 0)) {
      setError('Lengkapi semua item (produk, qty, harga)'); return
    }
    try {
      await buatPO.mutateAsync({
        po: { supplier_id: supplierId, catatan: catatan || undefined, tanggal_kirim: tanggalKirim || undefined },
        items,
      })
      onClose()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ border: '1px solid #E5E0D5' }} onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #E8E6E0' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#1A1A18' }}>Buat Purchase Order</h2>
          <div className="flex items-center gap-2">
            {[1, 2].map(n => (
              <div key={n} className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={step >= n ? { backgroundColor: '#3B6D11', color: '#fff' } : { backgroundColor: '#F0EEE8', color: '#9B9890' }}>
                  {n}
                </div>
                {n < 2 && <div className="w-6 h-px" style={{ backgroundColor: step > n ? '#3B6D11' : '#E8E6E0' }} />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#6B6963' }}>
                  Supplier <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select value={supplierId} onChange={e => { setSupplierId(e.target.value); setError('') }}
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                  style={{ borderColor: error && !supplierId ? '#DC2626' : '#D5D3CD', color: '#1A1A18' }}>
                  <option value="">-- Pilih Supplier --</option>
                  {suppliers?.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#6B6963' }}>Estimasi Tanggal Kirim</label>
                <input type="date" value={tanggalKirim} onChange={e => setTanggalKirim(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none" style={{ borderColor: '#D5D3CD', color: '#1A1A18' }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#6B6963' }}>Catatan</label>
                <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={3} placeholder="Opsional"
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none resize-none" style={{ borderColor: '#D5D3CD', color: '#1A1A18' }} />
              </div>
              {error && <p className="text-xs" style={{ color: '#DC2626' }}>{error}</p>}
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold" style={{ color: '#1A1A18' }}>Item Pesanan</p>
                <button onClick={addItem} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg"
                  style={{ backgroundColor: '#EAF3DE', color: '#3B6D11' }}>
                  + Tambah Item
                </button>
              </div>

              {items.length === 0 && (
                <div className="py-8 text-center text-sm rounded-xl" style={{ color: '#9B9890', backgroundColor: '#F8F8F6' }}>
                  Klik "+ Tambah Item" untuk menambah produk
                </div>
              )}

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl relative" style={{ backgroundColor: '#F8F8F6', border: '1px solid #E8E6E0' }}>
                    <button onClick={() => removeItem(idx)}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                      style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>✕</button>

                    {/* Product picker */}
                    <div className="mb-2 relative">
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
                              placeholder="Cari produk..." className="w-full px-2 py-1 text-xs outline-none" style={{ color: '#1A1A18' }} />
                          </div>
                          <div className="overflow-y-auto" style={{ maxHeight: '150px' }}>
                            {products?.map(p => (
                              <button key={p.id} onClick={() => selectProduct(idx, p)}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50">
                                <span style={{ color: '#1A1A18' }}>{p.nama}</span>
                                <span className="ml-2" style={{ color: '#9B9890' }}>{p.satuan} · HPP {formatRupiah(p.harga_beli)}</span>
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
                        <label className="text-xs mb-1 block" style={{ color: '#9B9890' }}>Qty Pesan</label>
                        <input type="number" min="1" value={item.qty_pesan}
                          onChange={e => updateItem(idx, 'qty_pesan', Math.max(1, Number(e.target.value)))}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border outline-none"
                          style={{ borderColor: '#D5D3CD', color: '#1A1A18', backgroundColor: '#fff' }} />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: '#9B9890' }}>Harga Beli</label>
                        <input type="number" min="0" value={item.harga_beli}
                          onChange={e => updateItem(idx, 'harga_beli', Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border outline-none"
                          style={{ borderColor: '#D5D3CD', color: '#1A1A18', backgroundColor: '#fff' }} />
                      </div>
                    </div>
                    <div className="mt-2 text-right text-xs font-semibold" style={{ color: '#3B6D11' }}>
                      Subtotal: {formatRupiah(item.qty_pesan * item.harga_beli)}
                    </div>
                  </div>
                ))}
              </div>

              {items.length > 0 && (
                <div className="mt-4 px-4 py-3 rounded-xl flex justify-between items-center"
                  style={{ backgroundColor: '#EAF3DE', border: '1px solid #C8E6A0' }}>
                  <span className="text-sm font-semibold" style={{ color: '#3B6D11' }}>Total PO</span>
                  <span className="text-lg font-bold" style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(total)}</span>
                </div>
              )}

              {error && <p className="text-xs mt-2" style={{ color: '#DC2626' }}>{error}</p>}
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex justify-between" style={{ borderTop: '1px solid #E8E6E0' }}>
          <button onClick={() => step === 1 ? onClose() : setStep(1)}
            className="px-4 py-2 text-sm rounded-lg" style={{ backgroundColor: '#F0EEE8', color: '#6B6963' }}>
            {step === 1 ? 'Batal' : '← Kembali'}
          </button>
          {step === 1 ? (
            <button onClick={() => {
              if (!supplierId) { setError('Pilih supplier dulu'); return }
              setError(''); setStep(2)
            }} className="px-4 py-2 text-sm font-medium rounded-lg" style={{ backgroundColor: '#3B6D11', color: '#fff' }}>
              Lanjut →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={buatPO.isPending}
              className="px-4 py-2 text-sm font-medium rounded-lg" style={{ backgroundColor: '#3B6D11', color: '#fff' }}>
              {buatPO.isPending ? 'Menyimpan...' : '✓ Buat PO'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
