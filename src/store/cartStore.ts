import { create } from 'zustand'
import type { CartItem, Customer, HeldTransaction, MetodeBayar, Product } from '@/types'
import { getHargaEfektif } from '@/lib/utils'

interface CartState {
  items: CartItem[]
  customer: Customer | null
  diskonPersen: number
  metodeBayar: MetodeBayar
  uangDiterima: number
  heldTransactions: HeldTransaction[]

  // computed
  subtotal: () => number
  diskonNominal: () => number
  total: () => number
  kembalian: () => number

  // actions
  addItem: (product: Product) => void
  updateQty: (productId: string, qty: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  setCustomer: (customer: Customer | null) => void
  setDiskon: (persen: number) => void
  setMetodeBayar: (metode: MetodeBayar) => void
  setUangDiterima: (amount: number) => void

  // held transactions
  holdTransaction: (label?: string) => void
  resumeTransaction: (id: string) => void
  cancelHeld: (id: string) => void
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  diskonPersen: 0,
  metodeBayar: 'Tunai',
  uangDiterima: 0,
  heldTransactions: [],

  subtotal: () => get().items.reduce((s, i) => s + i.harga_jual * i.qty, 0),

  diskonNominal: () => {
    const sub = get().subtotal()
    return Math.round(sub * (get().diskonPersen / 100))
  },

  total: () => {
    const sub = get().subtotal()
    const disc = get().diskonNominal()
    return Math.round(sub - disc)
  },

  kembalian: () => Math.max(0, get().uangDiterima - get().total()),

  addItem: (product) => {
    const items = get().items
    const existing = items.find((i) => i.product.id === product.id)
    if (existing) {
      const newQty = existing.qty + 1
      const harga = getHargaEfektif(
        product.harga_jual,
        product.harga_grosir,
        product.min_grosir,
        newQty
      )
      set({
        items: items.map((i) =>
          i.product.id === product.id ? { ...i, qty: newQty, harga_jual: harga } : i
        ),
      })
    } else {
      set({
        items: [...items, { product, qty: 1, harga_jual: product.harga_jual }],
      })
    }
  },

  updateQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId)
      return
    }
    set({
      items: get().items.map((i) => {
        if (i.product.id !== productId) return i
        const harga = getHargaEfektif(
          i.product.harga_jual,
          i.product.harga_grosir,
          i.product.min_grosir,
          qty
        )
        return { ...i, qty, harga_jual: harga }
      }),
    })
  },

  removeItem: (productId) =>
    set({ items: get().items.filter((i) => i.product.id !== productId) }),

  clearCart: () =>
    set({ items: [], diskonPersen: 0, uangDiterima: 0, customer: null, metodeBayar: 'Tunai' }),

  setCustomer: (customer) => set({ customer }),
  setDiskon: (persen) => set({ diskonPersen: persen }),
  setMetodeBayar: (metode) => set({ metodeBayar: metode }),
  setUangDiterima: (amount) => set({ uangDiterima: amount }),

  // ── Held transactions ────────────────────────────────────────────────────────

  holdTransaction: (label) => {
    const state = get()
    if (state.items.length === 0) return
    if (state.heldTransactions.length >= 5) return

    const held: HeldTransaction = {
      id: crypto.randomUUID(),
      label: label ?? (state.customer?.nama ?? `Transaksi #${state.heldTransactions.length + 1}`),
      items: [...state.items],
      customer: state.customer,
      diskonPersen: state.diskonPersen,
      metodeBayar: state.metodeBayar,
      heldAt: new Date(),
      subtotal: state.subtotal(),
      total: state.total(),
    }

    set({
      heldTransactions: [...state.heldTransactions, held],
      // clear cart
      items: [],
      diskonPersen: 0,
      uangDiterima: 0,
      customer: null,
      metodeBayar: 'Tunai',
    })
  },

  resumeTransaction: (id) => {
    const state = get()
    const held = state.heldTransactions.find((h) => h.id === id)
    if (!held) return

    const remaining = state.heldTransactions.filter((h) => h.id !== id)

    // Auto-hold current cart if not empty
    if (state.items.length > 0) {
      const autoHeld: HeldTransaction = {
        id: crypto.randomUUID(),
        label: state.customer?.nama ?? `Transaksi #${remaining.length + 1}`,
        items: [...state.items],
        customer: state.customer,
        diskonPersen: state.diskonPersen,
        metodeBayar: state.metodeBayar,
        heldAt: new Date(),
        subtotal: state.subtotal(),
        total: state.total(),
      }
      set({
        items: held.items,
        customer: held.customer,
        diskonPersen: held.diskonPersen,
        metodeBayar: held.metodeBayar,
        uangDiterima: 0,
        heldTransactions: [...remaining, autoHeld],
      })
    } else {
      set({
        items: held.items,
        customer: held.customer,
        diskonPersen: held.diskonPersen,
        metodeBayar: held.metodeBayar,
        uangDiterima: 0,
        heldTransactions: remaining,
      })
    }
  },

  cancelHeld: (id) =>
    set((state) => ({
      heldTransactions: state.heldTransactions.filter((h) => h.id !== id),
    })),
}))
