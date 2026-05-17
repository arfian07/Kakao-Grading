import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import {
    Search,
    Eye,
    X,
    Aperture,
    Calendar,
    TrendingUp,
} from "lucide-react";

const gradeStyles = {
    "Mutu I": "bg-accent/20 text-accent border-accent/30",
    "Mutu II": "bg-primary/20 text-primary border-primary/30",
    "Mutu III": "bg-muted text-muted-foreground border-border",
};

const formatRupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");
const formatDate = (iso) => {
    const d = new Date(iso);
    return (
        d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) +
        " · " +
        d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    );
};

const History = () => {
    const { transactions } = useApp();
    const [query, setQuery] = useState("");
    const [filterGrade, setFilterGrade] = useState("all");
    const [detail, setDetail] = useState(null);

    const filtered = useMemo(() => {
        return transactions.filter((t) => {
            const q = query.trim().toLowerCase();
            const matchQ =
                !q ||
                t.trx_code.toLowerCase().includes(q) ||
                t.grade.toLowerCase().includes(q);
            const matchG = filterGrade === "all" || t.grade === filterGrade;
            return matchQ && matchG;
        });
    }, [transactions, query, filterGrade]);

    const totalRevenue = filtered.reduce((s, t) => s + (t.estimated_price * t.weight_g) / 1000, 0);
    const totalWeight = filtered.reduce((s, t) => s + t.weight_g, 0);

    return (
        <div className="h-full flex flex-col p-2.5 gap-2.5" data-testid="history-page">
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

            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari ID transaksi atau grade..."
                        data-testid="history-search-input"
                        className="w-full h-8 pl-8 pr-3 rounded-md bg-input border border-border text-[11px] focus:outline-none focus:border-primary"
                    />
                </div>
                <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted/40 border border-border">
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
                <button data-testid="filter-date-btn" className="h-8 px-2.5 rounded-md bg-muted/60 hover:bg-muted border border-border text-[10px] font-medium flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Tanggal
                </button>
            </div>

            <div className="flex-1 min-h-0 rounded-lg border border-border card-grad overflow-hidden flex flex-col">
                <div className="grid grid-cols-[110px_1fr_70px_70px_80px_100px_36px] gap-2 px-3 h-8 items-center border-b border-border bg-muted/30 text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                    <div>ID Trx</div>
                    <div>Tanggal</div>
                    <div className="text-right">Berat</div>
                    <div className="text-right">Bean/100g</div>
                    <div>Grade</div>
                    <div className="text-right">Harga/kg</div>
                    <div></div>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar" data-testid="history-table">
                    {filtered.length === 0 && (
                        <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground">
                            Belum ada transaksi
                        </div>
                    )}
                    {filtered.map((t, i) => (
                        <div
                            key={t.id}
                            data-testid={`trx-row-${i}`}
                            className="grid grid-cols-[110px_1fr_70px_70px_80px_100px_36px] gap-2 px-3 h-9 items-center border-b border-border/50 hover:bg-muted/20 transition-colors text-[11px]"
                        >
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
                    ))}
                </div>
            </div>

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
                                     background: detail.image_path
                                         ? `url('${process.env.REACT_APP_BACKEND_URL}/api/uploads/${detail.image_path.split('/').pop()}') center/cover`
                                         : "url('https://images.unsplash.com/photo-1610450949065-1f2841536c88?w=600') center/cover",
                                 }}>
                                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[8px] font-mono text-emerald-400 flex items-center gap-1">
                                    <Aperture className="w-2 h-2" />
                                    Hasil Capture
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
        </div>
    );
};

export default History;
