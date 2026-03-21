import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useCustomers } from '@/hooks/useCustomers'
import { useSettings } from '@/hooks/useSettings'
import { formatRupiah, getInitials, generateNoTransaksi } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { printStruk, printFallback } from '@/lib/printer'
import { Spinner } from '@/components/ui/Spinner'
import type { MetodeBayar } from '@/types'

const METODE: MetodeBayar[] = ['Tunai', 'Transfer', 'QRIS', 'DP', 'Hutang']
const NOMINALS = [2000, 5000, 10000, 20000, 50000, 100000]

export function CartPanel() {
  const qc = useQueryClient()
  const { data: settings } = useSettings()
  const { data: customers } = useCustomers()

  const {
    items, customer, diskonPersen, metodeBayar, uangDiterima,
    subtotal, diskonNominal, total, kembalian,
    addItem, updateQty, removeItem, clearCart,
    setCustomer, setDiskon, setMetodeBayar, setUangDiterima,
  } = useCartStore()

  const [paying, setPaying] = useState(false)
  const [custSearch, setCustSearch] = useState('')
  const [showCustDropdown, setShowCustDropdown] = useState(false)

  const sub = subtotal()
  const discNom = diskonNominal()
  const tot = total()
  const kem = kembalian()
  const cukup = metodeBayar !== 'Tunai' || uangDiterima >= tot

  // Nominal cepat: kelipatan yang mencukupi total
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

      // Invalidate queries agar stok & customer ter-refresh
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['low-stock'] })

      // Print struk
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

      clearCart()
    } catch (err) {
      alert('Gagal menyimpan transaksi: ' + (err as Error).message)
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100">
      {/* Customer selector */}
      <div className="p-3 border-b border-gray-100 relative">
        <div
          className="flex items-center gap-2 p-2.5 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors"
          onClick={() => setShowCustDropdown((v) => !v)}
        >
          <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-xs font-medium text-primary-700 flex-shrink-0">
            {customer ? getInitials(customer.nama) : 'TU'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{customer?.nama ?? 'Tamu Umum'}</p>
            <p className="text-[10px] text-gray-400">
              {customer ? `${customer.desa ?? ''} · ${customer.tipe}` : 'Tanpa pelanggan'}
            </p>
          </div>
          {customer?.saldo_hutang ? (
            <span className="text-[10px] text-red-500 font-medium">
              Hutang: {formatRupiah(customer.saldo_hutang)}
            </span>
          ) : null}
          <span className="text-[10px] text-gray-400 underline flex-shrink-0">Ganti</span>
        </div>

        {showCustDropdown && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-52 overflow-y-auto">
            <div className="p-2 border-b border-gray-100">
              <input
                className="input text-xs"
                placeholder="Cari pelanggan..."
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                autoFocus
              />
            </div>
            <button
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-500"
              onClick={() => { setCustomer(null); setShowCustDropdown(false) }}
            >
              Tamu Umum (tanpa pelanggan)
            </button>
            {filteredCusts.map((c) => (
              <button
                key={c.id}
                className="w-full text-left px-3 py-2 text-xs hover:bg-primary-50 flex items-center justify-between"
                onClick={() => { setCustomer(c); setShowCustDropdown(false); setCustSearch('') }}
              >
                <span className="font-medium">{c.nama}</span>
                {c.saldo_hutang > 0 && (
                  <span className="text-red-400 ml-2">{formatRupiah(c.saldo_hutang)}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-2xl">🛒</div>
            <p className="text-xs">Pilih produk untuk mulai</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.product.nama}</p>
                  <p className="text-[10px] text-gray-400">{item.product.satuan} · {formatRupiah(item.harga_jual)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.product.id, item.qty - 1)}
                    className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-50 transition-colors">−</button>
                  <span className="w-6 text-center text-xs font-medium">{item.qty}</span>
                  <button onClick={() => updateQty(item.product.id, item.qty + 1)}
                    className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-50 transition-colors">+</button>
                </div>
                <span className="text-xs font-medium text-primary-600 w-20 text-right">
                  {formatRupiah(item.harga_jual * item.qty)}
                </span>
                <button onClick={() => removeItem(item.product.id)}
                  className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="border-t border-gray-100 px-3 py-2.5 space-y-1.5">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Subtotal</span><span>{formatRupiah(sub)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Diskon</span>
          <div className="flex items-center gap-1">
            <input
              type="number" min={0} max={100} step={1}
              value={diskonPersen}
              onChange={(e) => setDiskon(Number(e.target.value))}
              className="w-12 border border-gray-200 rounded px-2 py-0.5 text-xs text-right focus:outline-none focus:border-primary-400"
            />
            <span className="text-gray-400">%</span>
          </div>
        </div>
        <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-100">
          <span>Total</span>
          <span className="text-primary-700">{formatRupiah(tot)}</span>
        </div>
      </div>

      {/* Metode bayar */}
      <div className="px-3 pb-2 border-t border-gray-100 pt-2.5">
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {METODE.filter((m) => m !== 'Hutang').map((m) => (
            <button key={m}
              onClick={() => setMetodeBayar(m)}
              className={`py-1.5 text-xs rounded-lg border transition-all ${
                metodeBayar === m
                  ? 'bg-primary-50 border-primary-300 text-primary-800 font-medium'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >{m}</button>
          ))}
        </div>
        <button
          onClick={() => setMetodeBayar('Hutang')}
          className={`w-full py-1.5 text-xs rounded-lg border transition-all flex justify-between px-3 ${
            metodeBayar === 'Hutang'
              ? 'bg-red-50 border-red-300 text-red-700 font-medium'
              : 'border-gray-200 text-gray-500 hover:border-red-200'
          }`}
        >
          <span>Hutang / Kredit</span>
          {customer && (
            <span className="text-[10px]">
              {customer.saldo_hutang > 0 ? `Hutang: ${formatRupiah(customer.saldo_hutang)}` : 'Limit tersedia'}
            </span>
          )}
        </button>

        {/* Tunai: input uang & kembalian */}
        {metodeBayar === 'Tunai' && (
          <div className="mt-2 p-2.5 bg-gray-50 rounded-lg space-y-2">
            <p className="text-[10px] text-gray-500">Uang diterima</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Rp</span>
              <input
                type="number" min={0} step={1000}
                value={uangDiterima || ''}
                onChange={(e) => setUangDiterima(Number(e.target.value))}
                placeholder="0"
                className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm font-medium text-right focus:outline-none focus:border-primary-400 bg-white"
              />
            </div>
            {/* Quick nominals */}
            <div className="flex flex-wrap gap-1">
              {quickNominals.map((n) => (
                <button key={n}
                  onClick={() => setUangDiterima(n)}
                  className="text-[10px] px-2 py-1 bg-white border border-gray-200 rounded-full hover:border-primary-300 hover:text-primary-700 transition-colors">
                  {formatRupiah(n)}
                </button>
              ))}
            </div>
            {/* Kembalian */}
            {uangDiterima > 0 && (
              <div className={`flex justify-between items-center px-2.5 py-2 rounded-lg text-xs font-medium ${
                kem >= 0 ? 'bg-primary-50 text-primary-700' : 'bg-red-50 text-red-600'
              }`}>
                <span>{kem >= 0 ? 'Kembalian' : 'Kurang'}</span>
                <span className="text-sm font-semibold">{formatRupiah(Math.abs(kem >= 0 ? kem : tot - uangDiterima))}</span>
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
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {paying ? <Spinner size="sm" /> : null}
          {paying ? 'Memproses...' : `Bayar ${items.length > 0 ? formatRupiah(tot) : ''}`}
        </button>
        <button
          onClick={clearCart}
          disabled={items.length === 0}
          className="btn-outline w-full text-sm"
        >
          Batal / Kosongkan
        </button>
      </div>
    </div>
  )
}
