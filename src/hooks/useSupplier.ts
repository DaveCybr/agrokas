import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Supplier, PurchaseOrder, GoodsReceipt } from "@/types";

export function useSuppliers(search?: string) {
  return useQuery<Supplier[]>({
    queryKey: ["suppliers", search],
    queryFn: async () => {
      let q = supabase
        .from("suppliers")
        .select("*")
        .eq("aktif", true)
        .order("nama");
      if (search) q = q.ilike("nama", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}

/** Semua supplier termasuk nonaktif — dipakai di tab Hutang agar hutang tidak hilang saat supplier dinonaktifkan */
export function useAllSuppliers() {
  return useQuery<Supplier[]>({
    queryKey: ["suppliers-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("nama");
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}

export function usePurchaseOrders(status?: string) {
  return useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders", status],
    queryFn: async () => {
      let q = supabase
        .from("purchase_orders")
        .select("*, suppliers(id,nama,telp), purchase_order_items(*)")
        .order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data as PurchaseOrder[];
    },
    staleTime: 30_000,
  });
}

export function useGoodsReceipts() {
  return useQuery<GoodsReceipt[]>({
    queryKey: ["goods-receipts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goods_receipts")
        .select("*, suppliers(id,nama), goods_receipt_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GoodsReceipt[];
    },
    staleTime: 30_000,
  });
}

export function useTambahSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      data: Omit<Supplier, "id" | "saldo_hutang" | "created_at">,
    ) => {
      const { data: result, error } = await supabase
        .from("suppliers")
        .insert({ ...data, saldo_hutang: 0 })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["suppliers-all"] });
    },
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Supplier> & { id: string }) => {
      const { error } = await supabase
        .from("suppliers")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["suppliers-all"] });
    },
  });
}

export function useBuatPO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      po,
      items,
    }: {
      po: { supplier_id: string; catatan?: string; tanggal_kirim?: string };
      items: {
        product_id: string;
        nama_produk: string;
        satuan: string;
        qty_pesan: number;
        harga_beli: number;
      }[];
    }) => {
      const { data: poData, error: poErr } = await supabase
        .from("purchase_orders")
        .insert({ ...po, no_po: "", status: "draft" })
        .select()
        .single();
      if (poErr) throw poErr;

      const { error: itemErr } = await supabase
        .from("purchase_order_items")
        .insert(
          items.map((i) => ({
            ...i,
            po_id: poData.id,
            subtotal: i.qty_pesan * i.harga_beli,
          })),
        );
      if (itemErr) {
        // Hapus PO header yang sudah tersimpan agar tidak jadi data orphan
        await supabase.from("purchase_orders").delete().eq("id", poData.id);
        throw itemErr;
      }

      // total_po dihitung otomatis oleh trigger trg_po_total_insert

      return poData;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });
}

export function useUpdatePOStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });
}

export function useTerimaBarang() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      gr,
      items,
    }: {
      gr: {
        po_id?: string;
        supplier_id: string;
        metode_bayar: string;
        catatan?: string;
        tanggal: string;
      };
      items: {
        product_id?: string;
        po_item_id?: string;
        nama_produk: string;
        satuan: string;
        qty_diterima: number;
        harga_beli: number;
      }[];
    }) => {
      // 1. Insert GR header
      const { data: grData, error: grErr } = await supabase
        .from("goods_receipts")
        .insert({ ...gr, no_terima: "" })
        .select()
        .single();
      if (grErr) throw grErr;

      // 2. Insert GR items — trigger akan otomatis:
      //    - Update stok + HPP Moving Average
      //    - Update qty_diterima di PO items
      //    - Update saldo_hutang supplier (jika metode = Hutang)
      const { error: itemErr } = await supabase
        .from("goods_receipt_items")
        .insert(
          items.map((i) => ({
            ...i,
            gr_id: grData.id,
            subtotal: i.qty_diterima * i.harga_beli,
          })),
        );
      if (itemErr) {
        await supabase.from("goods_receipts").delete().eq("id", grData.id);
        throw itemErr;
      }

      // 3. Update total GR
      const total = items.reduce(
        (s, i) => s + i.qty_diterima * i.harga_beli,
        0,
      );
      const { error: totalErr } = await supabase
        .from("goods_receipts")
        .update({ total })
        .eq("id", grData.id);
      if (totalErr) throw totalErr;

      // 4. Auto-update status PO jika dari PO
      if (gr.po_id) {
        const { data: poItems, error: poItemsErr } = await supabase
          .from("purchase_order_items")
          .select("qty_pesan, qty_diterima")
          .eq("po_id", gr.po_id);
        if (poItemsErr) throw poItemsErr;

        if (poItems && poItems.length > 0) {
          const semuaSelesai = poItems.every(
            (i) => Number(i.qty_diterima) >= Number(i.qty_pesan),
          );
          const adaSebagian = poItems.some((i) => Number(i.qty_diterima) > 0);
          const newStatus = semuaSelesai
            ? "selesai"
            : adaSebagian
              ? "sebagian"
              : "dikirim";
          const { error: statusErr } = await supabase
            .from("purchase_orders")
            .update({ status: newStatus })
            .eq("id", gr.po_id);
          if (statusErr) throw statusErr;
        }
      }

      return grData;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goods-receipts"] });
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products-all"] });
      qc.invalidateQueries({ queryKey: ["products-paginated"] });
      qc.invalidateQueries({ queryKey: ["low-stock"] });
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["suppliers-all"] });
      qc.invalidateQueries({ queryKey: ["laporan-pembelian"] });
      qc.invalidateQueries({ queryKey: ["laporan-arus-kas"] });
      qc.invalidateQueries({ queryKey: ["laporan-stok-flow"] });
      qc.invalidateQueries({ queryKey: ["laporan-laba-rugi"] });
    },
  });
}

export function useBayarHutangSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      supplier_id: string;
      gr_id?: string;
      jumlah: number;
      metode: "Tunai" | "Transfer" | "Giro";
      catatan?: string;
    }) => {
      const { error } = await supabase.from("supplier_payments").insert(data);
      if (error) throw error;
      // saldo_hutang dikurangi otomatis oleh trigger trg_after_supplier_payment
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["suppliers-all"] });
      qc.invalidateQueries({
        queryKey: ["supplier-payments", variables.supplier_id],
      });
      qc.invalidateQueries({
        queryKey: ["supplier-receipts", variables.supplier_id],
      });
    },
  });
}

export function useSupplierPayments(supplierId: string) {
  return useQuery({
    queryKey: ["supplier-payments", supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_payments")
        .select("*")
        .eq("supplier_id", supplierId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
    staleTime: 30_000,
  });
}

export function useSupplierReceipts(supplierId: string) {
  return useQuery({
    queryKey: ["supplier-receipts", supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goods_receipts")
        .select("*")
        .eq("supplier_id", supplierId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
    staleTime: 30_000,
  });
}
