import { useState, useMemo, type ReactElement } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { formatRupiah, formatDate } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import {
  useDailySummary, useTopProducts, usePeriodSummary,
  usePembelian, useArusKas, useMarginProduk, useStokFlow, useLabaRugi,
} from '@/hooks/useLaporan'
import {
  exportLaporanHarian, exportProdukTerlaris, exportHutangOutstanding,
  exportPembelian, exportArusKas, exportMarginProduk, exportStokFlow, exportLabaRugi,
} from '@/lib/exportExcel'
import {
  pdfLaporanHarian, pdfProdukTerlaris, pdfHutangOutstanding,
  pdfPembelian, pdfArusKas, pdfMarginProduk, pdfStokFlow, pdfLabaRugi,
} from '@/lib/exportPdf'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ── Icons ────────────────────────────────────────────────────────────────────
function OmzetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  )
}
function TransaksiIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
  )
}
function LabaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  )
}
function DiskonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}
function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  )
}

interface ExportBtnsProps {
  disabled: boolean
  onExcel: () => void
  onPdf: () => void
}
function ExportBtns({ disabled, onExcel, onPdf }: ExportBtnsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onExcel}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
        style={{ backgroundColor: '#EAF3DE', color: '#3B6D11' }}
      >
        <ExportIcon /> Excel
      </button>
      <button
        onClick={onPdf}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
        style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
      >
        <ExportIcon /> PDF
      </button>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function subtractDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() - n)
  return r
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="text-xs rounded-lg px-3 py-2 shadow-lg"
      style={{ backgroundColor: '#1A1A18', color: '#F8F8F6', border: 'none' }}
    >
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color ?? '#EAF3DE' }}>
          {p.name}: {typeof p.value === 'number' && p.name !== 'Transaksi'
            ? formatRupiah(p.value)
            : p.value}
        </p>
      ))}
    </div>
  )
}

// ── MetricCard ────────────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string
  value: string
  diff?: number | null
  color: string
  bgColor: string
  Icon: () => ReactElement
}
function MetricCard({ label, value, diff, color, bgColor, Icon }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div
        className="absolute top-4 right-4 rounded-lg p-2"
        style={{ backgroundColor: bgColor, color }}
      >
        <Icon />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9B9890' }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      {diff !== null && diff !== undefined && (
        <p className="text-xs mt-1" style={{ color: diff >= 0 ? '#3B6D11' : '#DC2626' }}>
          {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}% vs periode lalu
        </p>
      )}
    </div>
  )
}

// ── RankBadge ─────────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, { bg: string; color: string }> = {
    1: { bg: '#FEF3C7', color: '#D97706' },
    2: { bg: '#F1F5F9', color: '#64748B' },
    3: { bg: '#FEF2F2', color: '#DC2626' },
  }
  const style = colors[rank] ?? { bg: '#F8F8F6', color: '#9B9890' }
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {rank}
    </span>
  )
}

// ── DateRangePicker ───────────────────────────────────────────────────────────
type Preset = 'today' | '7d' | '30d' | 'month'

interface DateRangePickerProps {
  from: Date
  to: Date
  onChange: (from: Date, to: Date) => void
}

function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const today = new Date()

  function applyPreset(p: Preset) {
    if (p === 'today')  onChange(today, today)
    if (p === '7d')     onChange(subtractDays(today, 6), today)
    if (p === '30d')    onChange(subtractDays(today, 29), today)
    if (p === 'month')  onChange(startOfMonth(today), today)
  }

  const activePreset: Preset | null = useMemo(() => {
    const f = toISO(from), t = toISO(to), td = toISO(today)
    if (f === td && t === td) return 'today'
    if (f === toISO(subtractDays(today, 6)) && t === td) return '7d'
    if (f === toISO(subtractDays(today, 29)) && t === td) return '30d'
    if (f === toISO(startOfMonth(today)) && t === td) return 'month'
    return null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to])

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {([
        ['today', 'Hari ini'],
        ['7d', '7 Hari'],
        ['30d', '30 Hari'],
        ['month', 'Bulan ini'],
      ] as [Preset, string][]).map(([key, label]) => (
        <button
          key={key}
          onClick={() => applyPreset(key)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={
            activePreset === key
              ? { backgroundColor: '#3B6D11', color: '#fff' }
              : { backgroundColor: '#F0EEE8', color: '#6B6963' }
          }
        >
          {label}
        </button>
      ))}
      <div className="flex items-center gap-1.5 ml-2">
        <input
          type="date"
          value={toISO(from)}
          onChange={(e) => onChange(new Date(e.target.value), to)}
          className="text-xs border rounded-lg px-2 py-1.5 outline-none"
          style={{ borderColor: '#D5D3CD', color: '#1A1A18' }}
        />
        <span className="text-xs" style={{ color: '#9B9890' }}>—</span>
        <input
          type="date"
          value={toISO(to)}
          onChange={(e) => onChange(from, new Date(e.target.value))}
          className="text-xs border rounded-lg px-2 py-1.5 outline-none"
          style={{ borderColor: '#D5D3CD', color: '#1A1A18' }}
        />
      </div>
    </div>
  )
}

// ── Tab types ─────────────────────────────────────────────────────────────────
type Tab = 'dashboard' | 'harian' | 'produk' | 'hutang' | 'pembelian' | 'aruskas' | 'margin' | 'stokflow' | 'labarugi'

// ── Outstanding debt hook ─────────────────────────────────────────────────────
function useOutstandingDebt() {
  return useQuery({
    queryKey: ['outstanding-debt-laporan'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, nama, desa, tipe, saldo_hutang, limit_kredit, updated_at')
        .eq('aktif', true)
        .gt('saldo_hutang', 0)
        .order('saldo_hutang', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function LaporanPage() {
  const today = new Date()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [from, setFrom] = useState<Date>(subtractDays(today, 29))
  const [to, setTo]     = useState<Date>(today)

  const fromStr = toISO(from)
  const toStr   = toISO(to)

  // Previous period (same length)
  const dayCount = Math.round((to.getTime() - from.getTime()) / 86400000) + 1
  const prevFrom = toISO(subtractDays(from, dayCount))
  const prevTo   = toISO(subtractDays(from, 1))

  const { data: dailyData, isLoading: loadingDaily } = useDailySummary(fromStr, toStr)
  useDailySummary(prevFrom, prevTo) // pre-fetch for usePeriodSummary cache
  const { data: topProducts, isLoading: loadingTop } = useTopProducts(20)
  const { data: debtData, isLoading: loadingDebt }   = useOutstandingDebt()

  const { data: pembelianData, isLoading: loadingPembelian } = usePembelian(fromStr, toStr)
  const { data: arusKasData,   isLoading: loadingArusKas }   = useArusKas(fromStr, toStr)
  const { data: marginData,    isLoading: loadingMargin }    = useMarginProduk()
  const { data: stokFlowData,  isLoading: loadingStokFlow }  = useStokFlow(fromStr, toStr)
  const { data: labaRugiData,  isLoading: loadingLabaRugi }  = useLabaRugi(fromStr, toStr)

  const current  = usePeriodSummary(fromStr, toStr)
  const previous = usePeriodSummary(prevFrom, prevTo)

  function pctDiff(cur: number, prev: number) {
    if (!prev) return null
    return ((cur - prev) / prev) * 100
  }

  // Chart data — reverse so oldest first
  const chartData = useMemo(() =>
    [...(dailyData ?? [])].reverse().map((r) => ({
      date: formatDate(r.tanggal).slice(0, 5),
      Omzet: Number(r.omzet),
      'Laba Kotor': Number(r.laba_kotor),
      Transaksi: Number(r.jumlah_transaksi),
    })),
  [dailyData])

  const maxOmzet = useMemo(() =>
    Math.max(...(topProducts ?? []).map((p) => Number(p.total_omzet)), 1),
  [topProducts])

  const totalDebt = useMemo(() =>
    (debtData ?? []).reduce((s, c) => s + Number(c.saldo_hutang), 0),
  [debtData])

  function handleRangeChange(f: Date, t: Date) {
    setFrom(f)
    setTo(t)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'harian',    label: 'Penjualan Harian' },
    { key: 'produk',    label: 'Produk Terlaris' },
    { key: 'hutang',    label: 'Hutang Outstanding' },
    { key: 'pembelian', label: 'Pembelian' },
    { key: 'aruskas',   label: 'Arus Kas' },
    { key: 'margin',    label: 'Margin Produk' },
    { key: 'stokflow',  label: 'Stok Flow' },
    { key: 'labarugi',  label: 'Laba Rugi' },
  ]

  const periodeStr = `${fromStr}_${toStr}`

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: '#1A1A18' }}>Laporan</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9B9890' }}>Analisis penjualan & keuangan toko</p>
        </div>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="overflow-x-auto mb-5 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#F0EEE8' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
              style={
                tab === t.key
                  ? { backgroundColor: '#fff', color: '#1A1A18', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: '#6B6963' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date range — shown for relevant tabs */}
      {(['dashboard', 'harian', 'pembelian', 'aruskas', 'stokflow', 'labarugi'] as Tab[]).includes(tab) && (
        <div className="mb-5">
          <DateRangePicker from={from} to={to} onChange={handleRangeChange} />
        </div>
      )}

      {/* ── DASHBOARD ──────────────────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div>
          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <MetricCard
              label="Total Omzet"
              value={formatRupiah(current.totalOmzet)}
              diff={pctDiff(current.totalOmzet, previous.totalOmzet)}
              color="#3B6D11"
              bgColor="#EAF3DE"
              Icon={OmzetIcon}
            />
            <MetricCard
              label="Total Transaksi"
              value={String(current.totalTransaksi)}
              diff={pctDiff(current.totalTransaksi, previous.totalTransaksi)}
              color="#2563EB"
              bgColor="#EFF6FF"
              Icon={TransaksiIcon}
            />
            <MetricCard
              label="Laba Kotor"
              value={formatRupiah(current.totalLaba)}
              diff={pctDiff(current.totalLaba, previous.totalLaba)}
              color="#0D9488"
              bgColor="#F0FDFA"
              Icon={LabaIcon}
            />
            <MetricCard
              label="Total Diskon"
              value={formatRupiah(current.totalDiskon)}
              diff={pctDiff(current.totalDiskon, previous.totalDiskon)}
              color="#D97706"
              bgColor="#FFFBEB"
              Icon={DiskonIcon}
            />
          </div>

          {/* Charts */}
          {loadingDaily ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Omzet area chart — 2/3 */}
              <div className="col-span-2 card p-5">
                <p className="text-sm font-semibold mb-4" style={{ color: '#1A1A18' }}>
                  Tren Omzet & Laba
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="gOmzet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3B6D11" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3B6D11" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gLaba" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0D9488" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EEE8" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9B9890' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9B9890' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="Omzet"      stroke="#3B6D11" strokeWidth={2} fill="url(#gOmzet)" />
                    <Area type="monotone" dataKey="Laba Kotor" stroke="#0D9488" strokeWidth={2} fill="url(#gLaba)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Transaksi bar chart — 1/3 */}
              <div className="card p-5">
                <p className="text-sm font-semibold mb-4" style={{ color: '#1A1A18' }}>
                  Jumlah Transaksi
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EEE8" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9B9890' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9B9890' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="Transaksi" fill="#3B6D11" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PENJUALAN HARIAN ───────────────────────────────────────────── */}
      {tab === 'harian' && (
        <div>
          <div className="flex justify-end mb-4">
            <ExportBtns
              disabled={!dailyData?.length}
              onExcel={() => dailyData && exportLaporanHarian(dailyData, periodeStr)}
              onPdf={() => dailyData && pdfLaporanHarian(dailyData, fromStr, toStr)}
            />
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-3 font-semibold text-sm" style={{ color: '#1A1A18', borderBottom: '1px solid #E8E6E0' }}>
              Laporan Harian — {formatDate(fromStr)} s/d {formatDate(toStr)}
            </div>
            {loadingDaily ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : (
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#F8F8F6' }}>
                  <tr>
                    {['Tanggal', 'Transaksi', 'Omzet', 'Diskon', 'Laba Kotor'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9B9890' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dailyData?.map((row) => (
                    <tr key={row.tanggal} style={{ borderBottom: '1px solid #F0EEE8' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8F8F6')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="px-5 py-3" style={{ color: '#1A1A18' }}>{formatDate(row.tanggal)}</td>
                      <td className="px-5 py-3" style={{ color: '#6B6963' }}>{row.jumlah_transaksi}×</td>
                      <td className="px-5 py-3 font-semibold" style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(Number(row.omzet))}</td>
                      <td className="px-5 py-3" style={{ color: '#D97706', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(Number(row.total_diskon))}</td>
                      <td className="px-5 py-3 font-medium" style={{ color: '#0D9488', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(Number(row.laba_kotor))}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  {(dailyData?.length ?? 0) > 0 && (
                    <tr style={{ borderTop: '2px solid #E8E6E0', backgroundColor: '#F8F8F6' }}>
                      <td className="px-5 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: '#6B6963' }}>Total</td>
                      <td className="px-5 py-3 font-semibold" style={{ color: '#1A1A18' }}>{current.totalTransaksi}×</td>
                      <td className="px-5 py-3 font-bold" style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(current.totalOmzet)}</td>
                      <td className="px-5 py-3 font-semibold" style={{ color: '#D97706', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(current.totalDiskon)}</td>
                      <td className="px-5 py-3 font-bold" style={{ color: '#0D9488', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(current.totalLaba)}</td>
                    </tr>
                  )}
                  {!dailyData?.length && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: '#9B9890' }}>
                        Belum ada data transaksi pada periode ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── PRODUK TERLARIS ───────────────────────────────────────────── */}
      {tab === 'produk' && (
        <div>
          <div className="flex justify-end mb-4">
            <ExportBtns
              disabled={!topProducts?.length}
              onExcel={() => topProducts && exportProdukTerlaris(topProducts)}
              onPdf={() => topProducts && pdfProdukTerlaris(topProducts)}
            />
          </div>

          <div className="grid grid-cols-5 gap-4">
            {/* Horizontal bar chart — 3/5 */}
            <div className="col-span-3 card p-5">
              <p className="text-sm font-semibold mb-4" style={{ color: '#1A1A18' }}>Top 10 Omzet Produk</p>
              {loadingTop ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={[...(topProducts ?? [])].slice(0, 10).reverse().map((p) => ({
                      nama: p.nama.length > 18 ? p.nama.slice(0, 18) + '…' : p.nama,
                      Omzet: Number(p.total_omzet),
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EEE8" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9B9890' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`} />
                    <YAxis type="category" dataKey="nama" tick={{ fontSize: 11, fill: '#6B6963' }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="Omzet" fill="#3B6D11" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Ranking table — 2/5 */}
            <div className="col-span-2 card overflow-hidden">
              <div className="px-5 py-3 font-semibold text-sm" style={{ color: '#1A1A18', borderBottom: '1px solid #E8E6E0' }}>
                Ranking Produk
              </div>
              {loadingTop ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#F0EEE8' }}>
                  {topProducts?.slice(0, 10).map((p, i) => {
                    const pct = Math.round((Number(p.total_omzet) / maxOmzet) * 100)
                    return (
                      <div key={p.id} className="px-5 py-3">
                        <div className="flex items-center gap-3 mb-1.5">
                          <RankBadge rank={i + 1} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: '#1A1A18' }}>{p.nama}</p>
                            <p className="text-xs" style={{ color: '#9B9890' }}>{p.kategori} · {p.satuan}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F0EEE8' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#3B6D11' }} />
                          </div>
                          <span className="text-xs font-medium shrink-0" style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>
                            {Number(p.total_qty_terjual).toLocaleString('id-ID')} {p.satuan}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {!topProducts?.length && (
                    <p className="px-5 py-8 text-center text-sm" style={{ color: '#9B9890' }}>
                      Belum ada data produk
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── HUTANG OUTSTANDING ────────────────────────────────────────── */}
      {tab === 'hutang' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            {/* Summary banner */}
            <div className="flex items-center gap-4">
              <div className="px-4 py-2.5 rounded-xl" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                <p className="text-xs font-medium" style={{ color: '#DC2626' }}>Total Hutang Beredar</p>
                <p className="text-lg font-bold" style={{ color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(totalDebt)}</p>
              </div>
              <div className="px-4 py-2.5 rounded-xl" style={{ backgroundColor: '#F8F8F6', border: '1px solid #E8E6E0' }}>
                <p className="text-xs font-medium" style={{ color: '#9B9890' }}>Jumlah Pelanggan</p>
                <p className="text-lg font-bold" style={{ color: '#1A1A18' }}>{debtData?.length ?? 0} pelanggan</p>
              </div>
            </div>
            <ExportBtns
              disabled={!debtData?.length}
              onExcel={() => debtData && exportHutangOutstanding(debtData)}
              onPdf={() => debtData && pdfHutangOutstanding(debtData)}
            />
          </div>

          <div className="card overflow-hidden">
            {loadingDebt ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : (
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#F8F8F6' }}>
                  <tr>
                    {['Pelanggan', 'Desa', 'Tipe', 'Saldo Hutang', 'Limit Kredit', 'Utilisasi'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9B9890' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {debtData?.map((c) => {
                    const utilPct = c.limit_kredit > 0
                      ? Math.min(100, Math.round((Number(c.saldo_hutang) / Number(c.limit_kredit)) * 100))
                      : 100
                    const overLimit = Number(c.saldo_hutang) > Number(c.limit_kredit) && c.limit_kredit > 0
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #F0EEE8' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8F8F6')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td className="px-5 py-3 font-medium" style={{ color: '#1A1A18' }}>{c.nama}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: '#6B6963' }}>{c.desa ?? '—'}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                            style={{ backgroundColor: '#F0F7E8', color: '#3B6D11' }}>
                            {c.tipe}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-semibold" style={{ color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
                          {formatRupiah(Number(c.saldo_hutang))}
                        </td>
                        <td className="px-5 py-3 text-xs" style={{ color: '#6B6963', fontVariantNumeric: 'tabular-nums' }}>
                          {c.limit_kredit > 0 ? formatRupiah(Number(c.limit_kredit)) : '—'}
                        </td>
                        <td className="px-5 py-3 w-36">
                          {c.limit_kredit > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F0EEE8' }}>
                                <div className="h-full rounded-full transition-all"
                                  style={{ width: `${utilPct}%`, backgroundColor: overLimit ? '#DC2626' : utilPct > 75 ? '#D97706' : '#3B6D11' }} />
                              </div>
                              <span className="text-xs shrink-0" style={{ color: overLimit ? '#DC2626' : '#6B6963' }}>{utilPct}%</span>
                            </div>
                          ) : (
                            <span className="text-xs" style={{ color: '#9B9890' }}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {!debtData?.length && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: '#9B9890' }}>
                        Tidak ada hutang outstanding
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── PEMBELIAN ─────────────────────────────────────────────────── */}
      {tab === 'pembelian' && (
        <div>
          <div className="flex justify-end mb-4">
            <ExportBtns
              disabled={!pembelianData?.length}
              onExcel={() => pembelianData && exportPembelian(pembelianData, periodeStr)}
              onPdf={() => pembelianData && pdfPembelian(pembelianData, fromStr, toStr)}
            />
          </div>
          <div className="card overflow-hidden">
            <div className="px-5 py-3 font-semibold text-sm" style={{ color: '#1A1A18', borderBottom: '1px solid #E8E6E0' }}>
              Riwayat Pembelian — {formatDate(fromStr)} s/d {formatDate(toStr)}
            </div>
            {loadingPembelian ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : (
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#F8F8F6' }}>
                  <tr>
                    {['Tanggal', 'No. Terima', 'Supplier', 'Metode', 'Total'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9B9890' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pembelianData?.map((gr: any) => (
                    <tr key={gr.id} style={{ borderBottom: '1px solid #F0EEE8' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8F8F6')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="px-5 py-3" style={{ color: '#1A1A18' }}>{formatDate(gr.tanggal)}</td>
                      <td className="px-5 py-3 font-mono text-xs" style={{ color: '#6B6963' }}>{gr.no_terima || '—'}</td>
                      <td className="px-5 py-3" style={{ color: '#6B6963' }}>{gr.suppliers?.nama ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs"
                          style={{ backgroundColor: gr.metode_bayar === 'Hutang' ? '#FEF2F2' : '#EAF3DE', color: gr.metode_bayar === 'Hutang' ? '#DC2626' : '#3B6D11' }}>
                          {gr.metode_bayar}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-semibold" style={{ color: '#1A1A18', fontVariantNumeric: 'tabular-nums' }}>
                        {formatRupiah(Number(gr.total))}
                      </td>
                    </tr>
                  ))}
                  {!pembelianData?.length && (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: '#9B9890' }}>Belum ada data pembelian pada periode ini</td></tr>
                  )}
                  {(pembelianData?.length ?? 0) > 0 && (
                    <tr style={{ borderTop: '2px solid #E8E6E0', backgroundColor: '#F8F8F6' }}>
                      <td colSpan={4} className="px-5 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: '#6B6963' }}>Total</td>
                      <td className="px-5 py-3 font-bold" style={{ color: '#1A1A18', fontVariantNumeric: 'tabular-nums' }}>
                        {formatRupiah(pembelianData?.reduce((s: number, r: any) => s + Number(r.total), 0) ?? 0)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── ARUS KAS ──────────────────────────────────────────────────── */}
      {tab === 'aruskas' && (
        <div>
          {loadingArusKas ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (() => {
            const tunai = (arusKasData?.penjualan ?? []).filter((r: any) => r.metode_bayar !== 'Hutang')
            const totalTunai = tunai.reduce((s: number, r: any) => s + Number(r.total), 0)
            const totalBeli  = (arusKasData?.pembelian ?? []).filter((r: any) => r.metode_bayar !== 'Hutang').reduce((s: number, r: any) => s + Number(r.total), 0)
            const totalBayar = (arusKasData?.pembayaranHutang ?? []).reduce((s: number, r: any) => s + Number(r.jumlah), 0)
            const kasNet = totalTunai - totalBeli - totalBayar
            const rows = [
              ...(arusKasData?.penjualan ?? []).filter((r: any) => r.metode_bayar !== 'Hutang').map((r: any) => ({
                tanggal: r.created_at?.slice(0, 10),
                jenis: 'Masuk' as const,
                ket: `Penjualan (${r.metode_bayar})`,
                jumlah: Number(r.total),
              })),
              ...(arusKasData?.pembelian ?? []).filter((r: any) => r.metode_bayar !== 'Hutang').map((r: any) => ({
                tanggal: r.tanggal,
                jenis: 'Keluar' as const,
                ket: 'Pembelian Tunai',
                jumlah: -Number(r.total),
              })),
              ...(arusKasData?.pembayaranHutang ?? []).map((r: any) => ({
                tanggal: r.created_at?.slice(0, 10),
                jenis: 'Keluar' as const,
                ket: `Bayar Hutang Supplier (${r.metode})`,
                jumlah: -Number(r.jumlah),
              })),
            ].sort((a, b) => (a.tanggal ?? '').localeCompare(b.tanggal ?? ''))
            const arusKasSummary = { totalTunai, totalKeluar: totalBeli + totalBayar, kasNet }
            return (
              <>
                <div className="flex justify-end mb-3">
                  <ExportBtns
                    disabled={!rows.length}
                    onExcel={() => exportArusKas(rows, periodeStr)}
                    onPdf={() => pdfArusKas(rows, fromStr, toStr, arusKasSummary)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9B9890' }}>Kas Masuk (Penjualan Tunai)</p>
                    <p className="text-xl font-bold" style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(totalTunai)}</p>
                    <p className="text-xs mt-1" style={{ color: '#9B9890' }}>{tunai.length} transaksi</p>
                  </div>
                  <div className="card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9B9890' }}>Kas Keluar (Beli + Bayar Hutang)</p>
                    <p className="text-xl font-bold" style={{ color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(totalBeli + totalBayar)}</p>
                    <p className="text-xs mt-1" style={{ color: '#9B9890' }}>Beli: {formatRupiah(totalBeli)} · Bayar: {formatRupiah(totalBayar)}</p>
                  </div>
                  <div className="card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9B9890' }}>Kas Bersih</p>
                    <p className="text-xl font-bold" style={{ color: kasNet >= 0 ? '#0D9488' : '#DC2626', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(kasNet)}</p>
                    <p className="text-xs mt-1" style={{ color: '#9B9890' }}>Masuk − Keluar</p>
                  </div>
                </div>
                <div className="card overflow-hidden">
                  <div className="px-5 py-3 font-semibold text-sm" style={{ color: '#1A1A18', borderBottom: '1px solid #E8E6E0' }}>
                    Detail Transaksi Kas
                  </div>
                  <table className="w-full text-sm">
                    <thead style={{ backgroundColor: '#F8F8F6' }}>
                      <tr>
                        {['Tanggal', 'Jenis', 'Keterangan', 'Jumlah'].map((h) => (
                          <th key={h} className="px-5 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9B9890' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F0EEE8' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8F8F6')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td className="px-5 py-3 text-xs" style={{ color: '#6B6963' }}>{formatDate(row.tanggal)}</td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: row.jenis === 'Masuk' ? '#EAF3DE' : '#FEF2F2', color: row.jenis === 'Masuk' ? '#3B6D11' : '#DC2626' }}>
                              {row.jenis}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs" style={{ color: '#1A1A18' }}>{row.ket}</td>
                          <td className="px-5 py-3 font-semibold" style={{ color: row.jumlah >= 0 ? '#3B6D11' : '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
                            {row.jumlah >= 0 ? '+' : '−'}{formatRupiah(Math.abs(row.jumlah))}
                          </td>
                        </tr>
                      ))}
                      {!rows.length && (
                        <tr><td colSpan={4} className="px-5 py-12 text-center text-sm" style={{ color: '#9B9890' }}>Belum ada data pada periode ini</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* ── MARGIN PRODUK ─────────────────────────────────────────────── */}
      {tab === 'margin' && (
        <div>
          <div className="flex justify-end mb-3">
            <ExportBtns
              disabled={!marginData?.length}
              onExcel={() => marginData && exportMarginProduk(marginData)}
              onPdf={() => marginData && pdfMarginProduk(marginData)}
            />
          </div>
          <div className="card overflow-hidden">
            <div className="px-5 py-3 font-semibold text-sm" style={{ color: '#1A1A18', borderBottom: '1px solid #E8E6E0' }}>
              Margin & Profitabilitas Produk (All Time)
            </div>
            {loadingMargin ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : (
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#F8F8F6' }}>
                  <tr>
                    {['Produk', 'Kategori', 'Qty Terjual', 'Omzet', 'HPP Total', 'Laba Kotor', 'Margin %'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9B9890' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {marginData?.map((p: any, i: number) => {
                    const laba  = p.omzet - p.hpp
                    const marginPct = p.omzet > 0 ? (laba / p.omzet * 100) : 0
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #F0EEE8' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8F8F6')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td className="px-5 py-3 font-medium" style={{ color: '#1A1A18' }}>{p.nama}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: '#6B6963' }}>—</td>
                        <td className="px-5 py-3 text-xs" style={{ color: '#6B6963', fontVariantNumeric: 'tabular-nums' }}>
                          {Number(p.qty).toLocaleString('id-ID')}
                        </td>
                        <td className="px-5 py-3" style={{ color: '#1A1A18', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(p.omzet)}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: '#6B6963', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(p.hpp)}</td>
                        <td className="px-5 py-3 font-semibold" style={{ color: laba >= 0 ? '#0D9488' : '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
                          {formatRupiah(laba)}
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-bold text-xs" style={{ color: marginPct >= 20 ? '#3B6D11' : marginPct >= 10 ? '#D97706' : '#DC2626' }}>
                            {marginPct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {!marginData?.length && (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: '#9B9890' }}>Belum ada data produk</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── STOK FLOW ─────────────────────────────────────────────────── */}
      {tab === 'stokflow' && (
        <div>
          <div className="flex justify-end mb-3">
            <ExportBtns
              disabled={!stokFlowData?.length}
              onExcel={() => stokFlowData && exportStokFlow(stokFlowData, periodeStr)}
              onPdf={() => stokFlowData && pdfStokFlow(stokFlowData, fromStr, toStr)}
            />
          </div>
          <div className="card overflow-hidden">
            <div className="px-5 py-3 font-semibold text-sm" style={{ color: '#1A1A18', borderBottom: '1px solid #E8E6E0' }}>
              Pergerakan Stok — {formatDate(fromStr)} s/d {formatDate(toStr)}
            </div>
            {loadingStokFlow ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : (
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#F8F8F6' }}>
                  <tr>
                    {['Produk', 'Stok Masuk', 'Nilai Masuk', 'Stok Keluar', 'Nilai Keluar', 'Selisih'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9B9890' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stokFlowData?.map((row: any, i: number) => {
                    const selisih = row.masuk_qty - row.keluar_qty
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #F0EEE8' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8F8F6')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td className="px-5 py-3 font-medium" style={{ color: '#1A1A18' }}>{row.nama}</td>
                        <td className="px-5 py-3" style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>+{row.masuk_qty.toLocaleString('id-ID')}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: '#6B6963', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(row.masuk_nilai)}</td>
                        <td className="px-5 py-3" style={{ color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>−{row.keluar_qty.toLocaleString('id-ID')}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: '#6B6963', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(row.keluar_nilai)}</td>
                        <td className="px-5 py-3 font-semibold" style={{ color: selisih >= 0 ? '#0D9488' : '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
                          {selisih >= 0 ? '+' : ''}{selisih.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    )
                  })}
                  {!stokFlowData?.length && (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: '#9B9890' }}>Belum ada data pergerakan stok pada periode ini</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── LABA RUGI ─────────────────────────────────────────────────── */}
      {tab === 'labarugi' && (
        <div>
          <div className="flex justify-end mb-3">
            <ExportBtns
              disabled={!labaRugiData}
              onExcel={() => labaRugiData && exportLabaRugi(labaRugiData, periodeStr)}
              onPdf={() => labaRugiData && pdfLabaRugi(labaRugiData, fromStr, toStr)}
            />
          </div>
          {loadingLabaRugi ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <div className="card p-6 max-w-lg">
              <p className="text-sm font-semibold mb-5" style={{ color: '#1A1A18' }}>
                Laporan Laba Rugi — {formatDate(fromStr)} s/d {formatDate(toStr)}
              </p>
              {([
                { label: 'Omzet Penjualan',           value: labaRugiData?.omzet ?? 0,     color: '#3B6D11', bold: false, sep: false },
                { label: 'Total Diskon',               value: labaRugiData?.diskon ?? 0,    color: '#D97706', bold: false, sep: false, minus: true },
                { label: 'Penjualan Bersih',           value: (labaRugiData?.omzet ?? 0) - (labaRugiData?.diskon ?? 0), color: '#1A1A18', bold: true, sep: true },
                { label: 'HPP (Harga Pokok Penjualan)',value: (labaRugiData?.omzet ?? 0) - (labaRugiData?.diskon ?? 0) - (labaRugiData?.labaKotor ?? 0), color: '#DC2626', bold: false, sep: false, minus: true },
                { label: 'Laba Kotor',                 value: labaRugiData?.labaKotor ?? 0, color: '#0D9488', bold: true, sep: true },
              ] as { label: string; value: number; color: string; bold: boolean; sep: boolean; minus?: boolean }[]).map((row, i) => (
                <div key={i}>
                  {row.sep && <div style={{ borderTop: '1px solid #E8E6E0', margin: '8px 0' }} />}
                  <div className="flex justify-between items-center py-2">
                    <span className={`text-sm${row.bold ? ' font-semibold' : ''}`} style={{ color: '#6B6963' }}>{row.label}</span>
                    <span className={`text-sm${row.bold ? ' font-bold' : ' font-medium'}`} style={{ color: row.color, fontVariantNumeric: 'tabular-nums' }}>
                      {row.minus ? `−${formatRupiah(row.value)}` : formatRupiah(row.value)}
                    </span>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '2px solid #1A1A18', marginTop: '8px', paddingTop: '12px' }} className="flex justify-between">
                <span className="text-xs" style={{ color: '#9B9890' }}>Jumlah Transaksi: {labaRugiData?.transaksi ?? 0}×</span>
                <span className="text-xs" style={{ color: '#9B9890' }}>Total Pembelian: {formatRupiah(labaRugiData?.totalBeli ?? 0)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
