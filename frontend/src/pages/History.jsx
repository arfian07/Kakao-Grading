import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { apiBulkDeleteTransactions, apiListTransactions } from "../lib/api";
import { toast } from "sonner";
import {
    Search,
    Eye,
    X,
    Aperture,
    Calendar as CalIcon,
    TrendingUp,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";
import { Checkbox } from "../components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "../components/ui/popover";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog";

const gradeStyles = {
    "Mutu I": "bg-accent/20 text-accent border-accent/30",
    "Mutu II": "bg-primary/20 text-primary border-primary/30",
    "Mutu III": "bg-muted text-muted-foreground border-border",
};
const gradeOrder = { "Mutu I": 1, "Mutu II": 2, "Mutu III": 3 };
const formatRupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");
const formatDate = (iso) => {
    const d = new Date(iso);
    return (
        d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) +
        " · " +
        d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    );
};
const toISODate = (d) => d.toISOString().slice(0, 10);

const SORT_COLUMNS = {
    trx_code: { label: "ID Trx", get: (t) => t.id },
    created_at: { label: "Tanggal", get: (t) => new Date(t.created_at).getTime() },
    weight_g: { label: "Berat", get: (t) => t.weight_g },
    bean_count_100g: { label: "Bean/100g", get: (t) => t.bean_count_100g },
    grade: { label: "Grade", get: (t) => gradeOrder[t.grade] ?? 99 },
    estimated_price: { label: "Harga/kg", get: (t) => t.estimated_price },
};

const PAGE_SIZES = [10, 25, 50, 100];

const SortHeader = ({ col, label, sort, onSort, align = "left" }) => {
    const active = sort.col === col;
    const dir = active ? sort.dir : null;
    const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
    return (
        <button
            onClick={() => onSort(col)}
            data-testid={`sort-${col}`}
            className={`flex items-center gap-1 hover:text-foreground transition-colors w-full ${
                align === "right" ? "justify-end" : ""
            } ${active ? "text-primary" : "text-muted-foreground"}`}
        >
            <span>{label}</span>
            <Icon className="w-3 h-3 shrink-0" />
        </button>
    );
};

const History = () => {
    const { transactions, refreshAll } = useApp();
    const [query, setQuery] = useState("");
    const [filterGrade, setFilterGrade] = useState("all");
    const [detail, setDetail] = useState(null);

    // Sorting
    const [sort, setSort] = useState({ col: "created_at", dir: "desc" });
    const toggleSort = (col) => {
        setSort((s) =>
            s.col === col
                ? { col, dir: s.dir === "asc" ? "desc" : "asc" }
                : { col, dir: "desc" }
        );
    };

    // Selection
    const [selected, setSelected] = useState(new Set());
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Date range
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [dateOpen, setDateOpen] = useState(false);
    const dateActive = !!(dateFrom || dateTo);

    // Pagination
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);

    // Apply filters → sorted → paginated
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const from = dateFrom ? new Date(dateFrom + "T00:00:00") : null;
        const to = dateTo ? new Date(dateTo + "T23:59:59") : null;
        let arr = transactions.filter((t) => {
            const matchQ =
                !q ||
                t.trx_code.toLowerCase().includes(q) ||
                t.grade.toLowerCase().includes(q);
            const matchG = filterGrade === "all" || t.grade === filterGrade;
            const ts = new Date(t.created_at);
            const matchDate =
                (!from || ts >= from) && (!to || ts <= to);
            return matchQ && matchG && matchDate;
        });
        const sorter = SORT_COLUMNS[sort.col];
        if (sorter) {
            arr = [...arr].sort((a, b) => {
                const va = sorter.get(a);
                const vb = sorter.get(b);
                if (va < vb) return sort.dir === "asc" ? -1 : 1;
                if (va > vb) return sort.dir === "asc" ? 1 : -1;
                return 0;
            });
        }
        return arr;
    }, [transactions, query, filterGrade, dateFrom, dateTo, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paged = useMemo(
        () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
        [filtered, safePage, pageSize]
    );

    // Reset to page 1 when filter changes
    React.useEffect(() => {
        setPage(1);
    }, [query, filterGrade, dateFrom, dateTo, pageSize]);

    // Selection helpers
    const allOnPageSelected =
        paged.length > 0 && paged.every((t) => selected.has(t.id));
    const someOnPageSelected =
        paged.some((t) => selected.has(t.id)) && !allOnPageSelected;

    const togglePage = () => {
        const next = new Set(selected);
        if (allOnPageSelected) {
            paged.forEach((t) => next.delete(t.id));
        } else {
            paged.forEach((t) => next.add(t.id));
        }
        setSelected(next);
    };
    const toggleOne = (id) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
    };

    const totalRevenue = filtered.reduce(
        (s, t) => s + (t.estimated_price * t.weight_g) / 1000,
        0
    );
    const totalWeight = filtered.reduce((s, t) => s + t.weight_g, 0);

    const handleBulkDelete = async () => {
        setDeleting(true);
        try {
            const res = await apiBulkDeleteTransactions(Array.from(selected));
            toast.success(`${res.deleted} transaksi dihapus`);
            setSelected(new Set());
            setConfirmDelete(false);
            await refreshAll();
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Gagal hapus");
        } finally {
            setDeleting(false);
        }
    };

    const clearDateRange = () => {
        setDateFrom("");
        setDateTo("");
    };

    return (
        <div className="h-full flex flex-col p-2.5 gap-2.5" data-testid="history-page">
            {/* Stats strip */}
            <div className="grid grid-cols-4 gap-2">
                <div className="card-grad rounded-md border border-border px-2.5 py-1.5">
                    <div className="text-[8px] uppercase tracking-wider text-muted-foreground">Total Transaksi</div>
                    <div className="num-display text-base font-bold">{filtered.length}</div>
                </div>
                <div className="card-grad rounded-md border border-border px-2.5 py-1.5">
                    <div className="text-[8px] uppercase tracking-wider text-muted-foreground">Total Berat</div>
                    <div className="num-display text-base font-bold">
                        {(totalWeight / 1000).toFixed(2)}
                        <span className="text-[9px] text-muted-foreground ml-1 font-sans">kg</span>
                    </div>
                </div>
                <div className="card-grad rounded-md border border-border px-2.5 py-1.5">
                    <div className="text-[8px] uppercase tracking-wider text-muted-foreground">Pendapatan</div>
                    <div className="num-display text-base font-bold text-accent">{formatRupiah(Math.round(totalRevenue))}</div>
                </div>
                <div className="card-grad rounded-md border border-border px-2.5 py-1.5 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <div>
                        <div className="text-[8px] uppercase tracking-wider text-muted-foreground">Mutu I Ratio</div>
                        <div className="num-display text-base font-bold text-emerald-400">
                            {filtered.length > 0
                                ? Math.round((filtered.filter((t) => t.grade === "Mutu I").length / filtered.length) * 100)
                                : 0}
                            %
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter bar */}
            <div className="grid grid-cols-4 gap-2 items-center">
                {/* Kolom 1: Search (Sejajar dengan KPI 1) */}
                <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari ID atau grade..."
                        data-testid="history-search-input"
                        className="w-full h-8 pl-8 pr-3 rounded-md bg-input border border-border text-[11px] focus:outline-none focus:border-primary"
                    />
                </div>

                {/* Kolom 2 & 3: Filter Status & Tanggal (Sejajar dengan KPI 2 & 3) */}
                <div className="col-span-2 flex items-center gap-2">
                    <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted/40 border border-border shrink-0">
                        {["all", "Mutu I", "Mutu II", "Mutu III"].map((g) => (
                            <button
                                key={g}
                                onClick={() => setFilterGrade(g)}
                                data-testid={`filter-${g.replace(/\s/g, "-").toLowerCase()}`}
                                className={`h-7 px-2.5 rounded text-[10px] font-medium transition-colors ${
                                    filterGrade === g
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {g === "all" ? "Semua" : g}
                            </button>
                        ))}
                    </div>

                    {/* Date range popover */}
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                        <PopoverTrigger asChild>
                            <button
                                data-testid="filter-date-btn"
                                className={`h-8 px-2.5 rounded-md border text-[10px] font-medium flex items-center gap-1.5 transition-colors flex-1 min-w-0 ${
                                    dateActive
                                        ? "bg-primary/15 border-primary/40 text-primary"
                                        : "bg-muted/60 hover:bg-muted border-border"
                                }`}
                            >
                                <CalIcon className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                    {dateActive
                                        ? `${dateFrom || "…"} → ${dateTo || "…"}`
                                        : "Filter Tanggal"}
                                </span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="end"
                            className="w-[260px] bg-card border-border p-3"
                            data-testid="date-popover"
                        >
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                Rentang Tanggal
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <label className="text-[9px] text-muted-foreground">Dari</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        max={dateTo || undefined}
                                        data-testid="date-from-input"
                                        className="w-full h-8 px-2 mt-0.5 rounded-md bg-input border border-border text-[11px] focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-muted-foreground">Sampai</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        min={dateFrom || undefined}
                                        data-testid="date-to-input"
                                        className="w-full h-8 px-2 mt-0.5 rounded-md bg-input border border-border text-[11px] focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="flex gap-1.5 pt-1">
                                    <button
                                        onClick={() => {
                                            const today = toISODate(new Date());
                                            const w = new Date();
                                            w.setDate(w.getDate() - 7);
                                            setDateFrom(toISODate(w));
                                            setDateTo(today);
                                        }}
                                        className="flex-1 h-7 rounded-md bg-muted/60 hover:bg-muted text-[10px] font-medium"
                                    >
                                        7 hari
                                    </button>
                                    <button
                                        onClick={() => {
                                            const today = toISODate(new Date());
                                            const m = new Date();
                                            m.setDate(m.getDate() - 30);
                                            setDateFrom(toISODate(m));
                                            setDateTo(today);
                                        }}
                                        className="flex-1 h-7 rounded-md bg-muted/60 hover:bg-muted text-[10px] font-medium"
                                    >
                                        30 hari
                                    </button>
                                </div>
                                <div className="flex gap-1.5 pt-1 border-t border-border">
                                    <button
                                        onClick={clearDateRange}
                                        data-testid="date-clear-btn"
                                        className="flex-1 h-7 rounded-md bg-destructive/15 hover:bg-destructive/25 text-destructive text-[10px] font-semibold"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={() => setDateOpen(false)}
                                        data-testid="date-apply-btn"
                                        className="flex-1 h-7 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-semibold"
                                    >
                                        Terapkan
                                    </button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Kolom 4: Bulk Delete (Sejajar dengan KPI 4) */}
                <div className="w-full flex justify-end">
                    {selected.size > 0 && (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            data-testid="bulk-delete-btn"
                            className="w-full h-8 px-3 rounded-md bg-destructive hover:bg-destructive/90 text-destructive-foreground text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-destructive/30 transition-all animate-in slide-in-from-right-2 fade-in-0"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus {selected.size} Data Terpilih
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 rounded-lg border border-border card-grad overflow-hidden flex flex-col">
                <div className="grid grid-cols-[32px_110px_1fr_75px_80px_80px_110px_36px] gap-2 px-3 h-9 items-center border-b border-border bg-muted/30 text-[9px] uppercase tracking-wider font-semibold">
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={allOnPageSelected || (someOnPageSelected && "indeterminate")}
                            onCheckedChange={togglePage}
                            data-testid="select-all-checkbox"
                            className="border-muted-foreground/50"
                        />
                    </div>
                    <SortHeader col="trx_code" label="ID Trx" sort={sort} onSort={toggleSort} />
                    <SortHeader col="created_at" label="Tanggal" sort={sort} onSort={toggleSort} />
                    <div className="flex justify-end">
                        <SortHeader col="weight_g" label="Berat" sort={sort} onSort={toggleSort} align="right" />
                    </div>
                    <div className="flex justify-end">
                        <SortHeader col="bean_count_100g" label="Bean/100g" sort={sort} onSort={toggleSort} align="right" />
                    </div>
                    <SortHeader col="grade" label="Grade" sort={sort} onSort={toggleSort} />
                    <div className="flex justify-end">
                        <SortHeader col="estimated_price" label="Harga/kg" sort={sort} onSort={toggleSort} align="right" />
                    </div>
                    <div></div>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar" data-testid="history-table">
                    {paged.length === 0 && (
                        <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground">
                            Tidak ada transaksi pada filter ini
                        </div>
                    )}
                    {paged.map((t, i) => {
                        const isSelected = selected.has(t.id);
                        return (
                            <div
                                key={t.id}
                                data-testid={`trx-row-${i}`}
                                className={`grid grid-cols-[32px_110px_1fr_75px_80px_80px_110px_36px] gap-2 px-3 h-9 items-center border-b border-border/50 transition-colors text-[11px] ${
                                    isSelected ? "bg-primary/8" : "hover:bg-muted/20"
                                }`}
                            >
                                <div className="flex items-center justify-center">
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleOne(t.id)}
                                        data-testid={`row-checkbox-${i}`}
                                        className="border-muted-foreground/50"
                                    />
                                </div>
                                <div className="font-mono text-accent">{t.trx_code}</div>
                                <div className="text-muted-foreground">{formatDate(t.created_at)}</div>
                                <div className="num-display text-right font-semibold">{t.weight_g.toFixed(1)}g</div>
                                <div className="num-display text-right">{t.bean_count_100g.toFixed(0)}</div>
                                <div>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${gradeStyles[t.grade] || gradeStyles["Mutu III"]}`}>
                                        {t.grade}
                                    </span>
                                </div>
                                <div className="num-display text-right font-semibold text-accent">
                                    {formatRupiah(Math.round(t.estimated_price))}
                                </div>
                                <button
                                    onClick={() => setDetail(t)}
                                    data-testid={`trx-detail-btn-${i}`}
                                    className="w-7 h-7 rounded-md bg-muted/40 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-colors"
                                >
                                    <Eye className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination footer */}
                <div className="h-9 px-3 flex items-center justify-between border-t border-border bg-muted/20 text-[10px]">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span>Tampilkan</span>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
                            data-testid="page-size-select"
                            className="h-6 px-1.5 rounded bg-input border border-border text-foreground text-[10px] focus:outline-none focus:border-primary"
                        >
                            {PAGE_SIZES.map((n) => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                        <span>
                            {filtered.length === 0
                                ? "0 dari 0"
                                : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} dari ${filtered.length}`}
                        </span>
                    </div>
                    <div className="flex items-center gap-0.5" data-testid="pagination-controls">
                        <button
                            onClick={() => setPage(1)}
                            disabled={safePage <= 1}
                            data-testid="page-first"
                            className="w-6 h-6 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            <ChevronsLeft className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={safePage <= 1}
                            data-testid="page-prev"
                            className="w-6 h-6 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            <ChevronLeft className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono text-foreground" data-testid="page-indicator">
                            {safePage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={safePage >= totalPages}
                            data-testid="page-next"
                            className="w-6 h-6 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => setPage(totalPages)}
                            disabled={safePage >= totalPages}
                            data-testid="page-last"
                            className="w-6 h-6 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            <ChevronsRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {detail && (
                <div className="absolute inset-0 z-30 flex items-center justify-center p-3 bg-background/80 backdrop-blur-sm" onClick={() => setDetail(null)} data-testid="trx-detail-modal">
                    <div onClick={(e) => e.stopPropagation()} className="w-[640px] max-h-full card-grad border border-border rounded-lg overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-3 h-9 border-b border-border">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-accent">{detail.trx_code}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${gradeStyles[detail.grade] || gradeStyles["Mutu III"]}`}>
                                    {detail.grade}
                                </span>
                            </div>
                            <button onClick={() => setDetail(null)} data-testid="trx-detail-close" className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-[260px_1fr] gap-3 p-3">
                            <div className="rounded-md overflow-hidden border border-border aspect-[4/3] relative bg-black"
                                 style={{
                                     background: detail.annotated_path || detail.image_path
                                         ? `url('${process.env.REACT_APP_BACKEND_URL}/api/uploads/${(detail.annotated_path || detail.image_path).split('/').pop()}') center/cover`
                                         : "url('https://images.unsplash.com/photo-1610450949065-1f2841536c88?w=600') center/cover",
                                 }}>
                                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[8px] font-mono text-emerald-400 flex items-center gap-1">
                                    <Aperture className="w-2 h-2" />
                                    {detail.annotated_path ? "Hasil Analisis" : "Hasil Capture"}
                                </div>
                            </div>
                            <div className="space-y-2 text-[11px]">
                                <div>
                                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Tanggal</div>
                                    <div>{formatDate(detail.created_at)}</div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Berat</div>
                                        <div className="num-display font-bold">{detail.weight_g.toFixed(1)}g</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Bean/100g</div>
                                        <div className="num-display font-bold">{detail.bean_count_100g.toFixed(1)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Total Biji</div>
                                        <div className="num-display font-bold">{detail.total_beans}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5">
                                    <div className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1">
                                        <div className="text-[8px] uppercase text-emerald-400">Bagus</div>
                                        <div className="num-display font-bold">{detail.good_beans}</div>
                                    </div>
                                    <div className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1">
                                        <div className="text-[8px] uppercase text-amber-400">Berjamur</div>
                                        <div className="num-display font-bold">{detail.moldy_beans}</div>
                                    </div>
                                    <div className="rounded-md border border-secondary/30 bg-secondary/10 px-2 py-1">
                                        <div className="text-[8px] uppercase text-red-300">Hitam</div>
                                        <div className="num-display font-bold">{detail.black_beans}</div>
                                    </div>
                                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1">
                                        <div className="text-[8px] uppercase text-destructive">Rusak</div>
                                        <div className="num-display font-bold">{detail.broken_beans}</div>
                                    </div>
                                </div>
                                <div className="border-t border-border pt-2 grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Nilai Fuzzy</div>
                                        <div className="num-display text-sm font-bold text-primary">{detail.fuzzy_value.toFixed(3)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Estimasi Harga/kg</div>
                                        <div className="num-display text-base font-bold text-accent">{formatRupiah(Math.round(detail.estimated_price))}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirmation */}
            <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <AlertDialogContent className="bg-card border-border max-w-[420px]" data-testid="bulk-delete-confirm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-destructive/15 flex items-center justify-center">
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </div>
                            Konfirmasi Hapus Data
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[12px] leading-relaxed pt-2">
                            Apakah Anda yakin ingin menghapus{" "}
                            <span className="font-bold text-foreground">{selected.size}</span>{" "}
                            data transaksi ini?
                            <br />
                            <span className="text-destructive">Tindakan ini tidak dapat dibatalkan.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={deleting}
                            data-testid="bulk-delete-cancel"
                            className="text-[11px]"
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleBulkDelete();
                            }}
                            disabled={deleting}
                            data-testid="bulk-delete-confirm-btn"
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-[11px]"
                        >
                            {deleting ? "Menghapus..." : "Ya, Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default History;