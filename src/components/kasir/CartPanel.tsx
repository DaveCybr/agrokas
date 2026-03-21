import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useCustomers } from '@/hooks/useCustomers'
import { useSettings } from '@/hooks/useSettings'
import { useToastStore } from '@/store/toastStore'
import { formatRupiah, getInitials, generateNoTransaksi } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { printStruk, printFallback } from '@/lib/printer'
import { Spinner } from '@/components/ui/Spinner'
import type { MetodeBayar } from '@/types'

const METODE: MetodeBayar[] = ['Tunai', 'Transfer', 'QRIS', 'DP', 'Hutang']
const NOMINALS = [2000, 5000, 10000, 20000, 50000, 100000]

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

export function CartPanel() {
  const qc = useQueryClient()
  const { data: settings } = useSettings()
  const { data: customers } = useCustomers()
  const addToast = useToastStore((s) => s.addToast)

  const {
    items, customer, diskonPersen, metodeBayar, uangDiterima,
    subtotal, diskonNominal, total, kembalian,
    updateQty, removeItem, clearCart,
    setCustomer, setDiskon, setMetodeBayar, setUangDiterima,
  } = useCartStore()

  const holdTransaction = useCartStore((s) => s.holdTransaction)
  const heldCount = useCartStore((s) => s.heldTransactions.length)

  const [paying, setPaying] = useState(false)
  const [custSearch, setCustSearch] = useState('')
  const [showCustDropdown, setShowCustDropdown] = useState(false)
  const [showHoldPrompt, setShowHoldPrompt] = useState(false)
  const [holdLabel, setHoldLabel] = useState('')

  const sub = subtotal()
  const discNom = diskonNominal()
  const tot = total()
  const kem = kembalian()
  const cukup = metodeBayar !== 'Tunai' || uangDiterima >= tot

  const quickNominals = NOMINALS
    .map((n) => Math.ceil(tot / n) * n)
    .filter((v, i, a) => a.indexOf(v) === i && v >= tot)
    .slice(0, 5)

  const filteredCusts = customers?.filter((c) =>
    c.nama.toLowerCase().includes(custSearch.toLowerCase())
  ) ?? []

  async function handleBayar() {
    if (items.length === 0 || !cukup) return
    setPaying(true)
    try {
      const noTrx = generateNoTransaksi()
      const { data: trx, error: trxErr } = await supabase
        .from('transactions')
        .insert({
          no_transaksi: noTrx,
          customer_id: customer?.id ?? null,
          kasir: 'Kasir',
          subtotal: sub,
          diskon_persen: diskonPersen,
          diskon_nominal: discNom,
          total: tot,
          metode_bayar: metodeBayar,
          uang_diterima: metodeBayar === 'Tunai' ? uangDiterima : tot,
          kembalian: metodeBayar === 'Tunai' ? kem : 0,
          status: 'selesai',
        })
        .select()
        .single()

      if (trxErr) throw trxErr

      await supabase.from('transaction_items').insert(
        items.map((i) => ({
          transaction_id: trx.id,
          product_id: i.product.id,
          nama_produk: i.product.nama,
          satuan: i.product.satuan,
          harga_beli: i.product.harga_beli,
          harga_jual: i.harga_jual,
          qty: i.qty,
          subtotal: i.harga_jual * i.qty,
        }))
      )

      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['low-stock'] })

      const printPayload = {
        namaToko: settings?.nama_toko ?? 'Toko Tani',
        alamat: settings?.alamat ?? '',
        telp: settings?.telp ?? '',
        footerNota: settings?.footer_nota ?? 'Terima kasih!',
        noTransaksi: noTrx,
        kasir: 'Kasir',
        pelanggan: customer?.nama ?? 'Tamu Umum',
        items: items.map((i) => ({
          nama: i.product.nama,
          qty: i.qty,
          satuan: i.product.satuan,
          harga: i.harga_jual,
        })),
        subtotal: sub,
        diskonPersen,
        diskonNominal: discNom,
        total: tot,
        metodeBayar,
        uangDiterima: metodeBayar === 'Tunai' ? uangDiterima : tot,
        kembalian: kem,
        printerName: settings?.printer_name ?? undefined,
      }

      try {
        await printStruk(printPayload)
      } catch {
        printFallback(printPayload)
      }

      addToast(`Transaksi ${noTrx} berhasil disimpan`, 'success')
      clearCart()
    } catch (err) {
      addToast('Gagal menyimpan transaksi: ' + (err as Error).message, 'error')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white" style={{ borderLeft: '1px solid #E8E6E0' }}>
      {/* Customer selector */}
      <div className="p-3 relative" style={{ borderBottom: '1px solid #E8E6E0' }}>
        <div
          className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors"
          style={{ border: '1px solid #E8E6E0' }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3B6D11')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E8E6E0')}
          onClick={() => setShowCustDropdown((v) => !v)}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{ backgroundColor: '#EAF3DE', color: '#3B6D11' }}
          >
            {customer ? getInitials(customer.nama) : 'TU'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#1A1A18' }}>
              {customer?.nama ?? 'Tamu Umum'}
            </p>
            <p className="text-[11px]" style={{ color: '#9B9890' }}>
              {customer ? `${customer.desa ?? ''} · ${customer.tipe}` : 'Tanpa pelanggan'}
            </p>
          </div>
          {customer?.saldo_hutang ? (
            <span className="badge-red text-[10px]">
              {formatRupiah(customer.saldo_hutang)}
            </span>
          ) : null}
          <span className="text-[10px] underline flex-shrink-0" style={{ color: '#9B9890' }}>Ganti</span>
        </div>

        {showCustDropdown && (
          <div
            className="absolute left-3 right-3 top-full mt-1 bg-white rounded-lg shadow-lg z-20 max-h-52 overflow-y-auto"
            style={{ border: '1px solid #E8E6E0' }}
          >
            <div className="p-2" style={{ borderBottom: '1px solid #E8E6E0' }}>
              <input
                className="input text-xs"
                placeholder="Cari pelanggan..."
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                autoFocus
              />
            </div>
            <button
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
              style={{ color: '#6B6963' }}
              onClick={() => { setCustomer(null); setShowCustDropdown(false) }}
            >
              Tamu Umum (tanpa pelanggan)
            </button>
            {filteredCusts.map((c) => (
              <button
                key={c.id}
                className="w-full text-left px-3 py-2 text-xs hover:bg-[#EAF3DE] flex items-center justify-between transition-colors"
                onClick={() => { setCustomer(c); setShowCustDropdown(false); setCustSearch('') }}
              >
                <span className="font-medium" style={{ color: '#1A1A18' }}>{c.nama}</span>
                {c.saldo_hutang > 0 && (
                  <span style={{ color: '#DC2626' }} className="ml-2 text-[10px]">
                    {formatRupiah(c.saldo_hutang)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#F8F8F6' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9B9890" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121 0 2.032-.696 2.032-1.571l1.219-8.032A1.5 1.5 0 0 0 20.43 4.5H6.25" />
                <circle cx="9" cy="20.25" r="1" fill="#9B9890" stroke="none" />
                <circle cx="18" cy="20.25" r="1" fill="#9B9890" stroke="none" />
              </svg>
            </div>
            <p className="text-xs" style={{ color: '#9B9890' }}>Pilih produk untuk mulai</p>
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-2 py-2.5"
                style={{ borderBottom: '1px solid #F0EEE8' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: '#1A1A18' }}>
                    {item.product.nama}
                  </p>
                  <p className="text-[10px]" style={{ color: '#9B9890' }}>
                    {item.product.satuan} · {formatRupiah(item.harga_jual)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.product.id, item.qty - 1)}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-medium transition-colors hover:bg-gray-50"
                    style={{ border: '1px solid #E8E6E0', color: '#6B6963' }}
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-xs font-semibold" style={{ color: '#1A1A18' }}>
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.product.id, item.qty + 1)}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-medium transition-colors hover:bg-gray-50"
                    style={{ border: '1px solid #E8E6E0', color: '#6B6963' }}
                  >
                    +
                  </button>
                </div>
                <span
                  className="text-xs font-bold w-20 text-right"
                  style={{ color: '#1A1A18', fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatRupiah(item.harga_jual * item.qty)}
                </span>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="w-5 h-5 flex items-center justify-center transition-colors"
                  style={{ color: '#D0CEC8' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#D0CEC8')}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mx-3 mb-2 p-3 rounded-xl" style={{ backgroundColor: '#F8F8F6' }}>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs" style={{ color: '#6B6963' }}>Subtotal</span>
          <span className="text-xs" style={{ color: '#6B6963', fontVariantNumeric: 'tabular-nums' }}>
            {formatRupiah(sub)}
          </span>
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs" style={{ color: '#6B6963' }}>Diskon</span>
          <div className="flex items-center gap-1">
            <input
              type="number" min={0} max={100} step={1}
              value={diskonPersen}
              onChange={(e) => setDiskon(Number(e.target.value))}
              className="text-xs text-right focus:outline-none rounded-md"
              style={{
                width: '48px', height: '28px', padding: '0 6px',
                border: '1px solid #E8E6E0', color: '#1A1A18',
                backgroundColor: 'white', fontFamily: 'inherit',
              }}
            />
            <span className="text-xs" style={{ color: '#9B9890' }}>%</span>
          </div>
        </div>
        <div
          className="flex justify-between items-center pt-2"
          style={{ borderTop: '1px solid #E8E6E0' }}
        >
          <span className="text-sm font-semibold" style={{ color: '#1A1A18' }}>Total</span>
          <span
            className="text-base font-bold"
            style={{ color: '#1A1A18', fontVariantNumeric: 'tabular-nums' }}
          >
            {formatRupiah(tot)}
          </span>
        </div>
      </div>

      {/* Metode bayar */}
      <div className="px-3 pb-2" style={{ borderTop: '1px solid #E8E6E0', paddingTop: '10px' }}>
        <div className="grid grid-cols-2 gap-1.5 mb-1.5">
          {METODE.filter((m) => m !== 'Hutang').map((m) => (
            <button
              key={m}
              onClick={() => setMetodeBayar(m)}
              className="py-1.5 text-xs rounded-lg border transition-all duration-150 font-medium"
              style={
                metodeBayar === m
                  ? { backgroundColor: '#EAF3DE', borderColor: '#3B6D11', color: '#3B6D11' }
                  : { backgroundColor: 'white', borderColor: '#E8E6E0', color: '#6B6963' }
              }
            >
              {m}
            </button>
          ))}
        </div>
        <button
          onClick={() => setMetodeBayar('Hutang')}
          className="w-full py-1.5 text-xs rounded-lg flex justify-between px-3 transition-all duration-150 font-medium"
          style={
            metodeBayar === 'Hutang'
              ? { backgroundColor: '#FEF2F2', border: '1px dashed #DC2626', color: '#DC2626' }
              : { backgroundColor: 'white', border: '1px dashed #E8E6E0', color: '#6B6963' }
          }
        >
          <span>Hutang / Kredit</span>
          {customer && (
            <span className="text-[10px]">
              {customer.saldo_hutang > 0 ? formatRupiah(customer.saldo_hutang) : 'Limit tersedia'}
            </span>
          )}
        </button>

        {/* Tunai block */}
        {metodeBayar === 'Tunai' && (
          <div className="mt-2 p-3 rounded-xl space-y-2" style={{ backgroundColor: '#F8F8F6' }}>
            <p className="text-[11px] font-medium" style={{ color: '#6B6963' }}>Uang diterima</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: '#9B9890' }}>Rp</span>
              <input
                type="number" min={0} step={1000}
                value={uangDiterima || ''}
                onChange={(e) => setUangDiterima(Number(e.target.value))}
                placeholder="0"
                className="flex-1 text-right font-bold focus:outline-none rounded-lg"
                style={{
                  height: '36px', padding: '0 10px',
                  border: '1px solid #E8E6E0',
                  backgroundColor: 'white',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  color: '#1A1A18',
                  fontVariantNumeric: 'tabular-nums',
                }}
              />
            </div>
            {/* Quick nominals */}
            <div className="flex flex-wrap gap-1">
              {quickNominals.map((n) => (
                <button
                  key={n}
                  onClick={() => setUangDiterima(n)}
                  className="text-[10px] px-2 py-1 rounded-full transition-colors"
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #E8E6E0',
                    color: '#6B6963',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3B6D11'
                    e.currentTarget.style.color = '#3B6D11'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E8E6E0'
                    e.currentTarget.style.color = '#6B6963'
                  }}
                >
                  {formatRupiah(n)}
                </button>
              ))}
            </div>
            {/* Kembalian */}
            {uangDiterima > 0 && (
              <div
                className="flex justify-between items-center px-3 py-2 rounded-lg"
                style={
                  kem >= 0
                    ? { backgroundColor: '#EAF3DE', color: '#3B6D11' }
                    : { backgroundColor: '#FEF2F2', color: '#DC2626' }
                }
              >
                <span className="text-xs font-medium">{kem >= 0 ? 'Kembalian' : 'Kurang'}</span>
                <span
                  className="text-base font-bold"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatRupiah(Math.abs(kem >= 0 ? kem : tot - uangDiterima))}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 pb-4 pt-2 space-y-2">
        <button
          onClick={handleBayar}
          disabled={items.length === 0 || !cukup || paying}
          className="btn-primary w-full font-semibold"
          style={{ height: '40px' }}
        >
          {paying ? <Spinner size="sm" /> : null}
          {paying ? 'Memproses...' : `Bayar ${items.length > 0 ? formatRupiah(tot) : ''}`}
        </button>

        {items.length > 0 && (
          <>
            {/* Hold prompt */}
            {showHoldPrompt ? (
              <div
                className="rounded-xl p-3 space-y-2"
                style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
              >
                <p className="text-xs font-medium" style={{ color: '#92400E' }}>
                  Label transaksi ini?
                </p>
                <input
                  className="input text-xs"
                  style={{ height: '32px' }}
                  placeholder="Tamu 1, Pak Budi, dll"
                  value={holdLabel}
                  onChange={(e) => setHoldLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && holdLabel.trim()) {
                      holdTransaction(holdLabel.trim())
                      addToast(`⏸ Transaksi "${holdLabel.trim()}" ditahan`, 'success')
                      setShowHoldPrompt(false)
                      setHoldLabel('')
                    }
                    if (e.key === 'Escape') { setShowHoldPrompt(false); setHoldLabel('') }
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const lbl = holdLabel.trim() || `Transaksi #${heldCount + 1}`
                      holdTransaction(lbl)
                      addToast(`⏸ Transaksi "${lbl}" ditahan`, 'success')
                      setShowHoldPrompt(false)
                      setHoldLabel('')
                    }}
                    className="flex-1 text-xs font-medium rounded-lg"
                    style={{
                      height: '28px',
                      backgroundColor: '#EAF3DE',
                      border: '1px solid #3B6D11',
                      color: '#3B6D11',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    Simpan & Tahan
                  </button>
                  <button
                    onClick={() => { setShowHoldPrompt(false); setHoldLabel('') }}
                    className="text-xs rounded-lg"
                    style={{
                      height: '28px',
                      padding: '0 10px',
                      border: '1px solid #E8E6E0',
                      color: '#9B9890',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      background: 'white',
                    }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  title={heldCount >= 5 ? 'Maksimal 5 transaksi ditahan' : undefined}
                  disabled={heldCount >= 5}
                  onClick={() => {
                    if (customer) {
                      holdTransaction(customer.nama)
                      addToast(`⏸ Transaksi "${customer.nama}" ditahan`, 'success')
                    } else {
                      setShowHoldPrompt(true)
                    }
                  }}
                  className="btn-ghost flex-1 text-xs flex items-center justify-center gap-1.5"
                  style={{ height: '32px', color: '#6B6963', opacity: heldCount >= 5 ? 0.4 : 1 }}
                >
                  <span>⏸</span>
                  <span>Tahan Transaksi</span>
                </button>
                <button
                  onClick={clearCart}
                  className="text-xs transition-colors"
                  style={{ color: '#9B9890', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9B9890')}
                >
                  ✕ Batalkan
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
