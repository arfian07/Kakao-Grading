import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { initialPrices, formatRupiah } from "../lib/mockData";
import { toast } from "sonner";
import {
    Save,
    RotateCcw,
    BadgeCheck,
    BarChart3,
    AlertCircle,
    Info,
    Quote,
} from "lucide-react";

const QualityBadge = ({ tone, children }) => {
    const tones = {
        primary: "bg-primary/15 text-primary border border-primary/30",
        accent: "bg-accent/15 text-accent border border-accent/30",
        secondary:
            "bg-secondary/20 text-red-300 border border-secondary/40",
    };
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide ${tones[tone]}`}
        >
            {children}
        </span>
    );
};

const PriceInput = ({ value, onChange, testid }) => (
    <div
        className="relative rounded-md border border-border bg-input/60 h-9 flex items-center"
        data-testid={`${testid}-wrap`}
    >
        <span className="pl-2.5 text-[10px] font-mono text-muted-foreground">
            Rp
        </span>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value || 0, 10))}
            data-testid={testid}
            className="flex-1 bg-transparent px-2 text-[13px] font-mono font-semibold focus:outline-none text-foreground"
        />
        <span className="pr-2.5 text-[10px] font-mono text-muted-foreground border-l border-border h-full flex items-center pl-2.5 whitespace-nowrap">
            /Kg
        </span>
    </div>
);

const QualityCard = ({
    badge,
    badgeTone,
    grade,
    desc,
    icon: Icon,
    iconTone,
    value,
    onChange,
    testid,
    inline = false,
}) => (
    <div
        data-testid={testid}
        className={`card-grad rounded-lg border border-border p-2.5 flex flex-col ${
            inline ? "" : "h-full"
        }`}
    >
        <div className="flex items-start justify-between mb-1.5">
            <QualityBadge tone={badgeTone}>{badge}</QualityBadge>
            <Icon className={`w-3.5 h-3.5 ${iconTone}`} />
        </div>
        {inline ? (
            <div className="flex items-center gap-3 flex-1">
                <div className="min-w-[80px]">
                    <div className="text-sm font-bold leading-tight">
                        {grade}
                    </div>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug flex-1">
                    {desc}
                </p>
                <div className="w-[200px]">
                    <PriceInput
                        value={value}
                        onChange={onChange}
                        testid={testid + "-input"}
                    />
                </div>
            </div>
        ) : (
            <>
                <div className="text-sm font-bold leading-tight mb-0.5">
                    {grade}
                </div>
                <p className="text-[9.5px] text-muted-foreground leading-snug mb-2">
                    {desc}
                </p>
                <div className="mt-auto">
                    <PriceInput
                        value={value}
                        onChange={onChange}
                        testid={testid + "-input"}
                    />
                </div>
            </>
        )}
    </div>
);

const Settings = () => {
    const { prices, setPrices, user } = useApp();
    const [draft, setDraft] = useState(prices);
    const [lastUpdate] = useState(() => {
        const stored = localStorage.getItem("kakao_prices_meta");
        if (stored) return JSON.parse(stored);
        return {
            at: new Date(2026, 1, 8, 9, 45).toISOString(),
            by: user?.name || "Admin Station-01",
        };
    });

    const dirty =
        draft.mutuI !== prices.mutuI ||
        draft.mutuII !== prices.mutuII ||
        draft.mutuIII !== prices.mutuIII;

    const handleSave = () => {
        setPrices(draft);
        const meta = {
            at: new Date().toISOString(),
            by: user?.name || "Admin Station-01",
        };
        localStorage.setItem("kakao_prices_meta", JSON.stringify(meta));
        toast.success("Konfigurasi harga disimpan");
    };

    const handleReset = () => {
        setDraft(initialPrices);
        toast("Direset ke harga default");
    };

    const updateDate = new Date(lastUpdate.at).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
    const updateTime = new Date(lastUpdate.at).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="h-full flex flex-col p-3 gap-2.5" data-testid="settings-page">
            {/* Header */}
            <div className="shrink-0">
                <div className="text-[9px] font-semibold uppercase tracking-widest text-primary">
                    Master Data Management
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                    <h2 className="text-base font-bold leading-tight">
                        Pengaturan Harga Referensi
                    </h2>
                    <p className="text-[10px] text-muted-foreground max-w-[440px] text-right leading-tight">
                        Konfigurasikan standar harga beli per kategori mutu.
                        Perubahan diterapkan langsung pada modul kalkulasi
                        otomatis.
                    </p>
                </div>
            </div>

            {/* Main grid: cards | info panel */}
            <div className="flex-1 grid grid-cols-[1fr_220px] gap-2.5 min-h-0">
                {/* Left: Quality cards */}
                <div className="grid grid-rows-[1fr_auto] gap-2 min-h-0">
                    <div className="grid grid-cols-2 gap-2">
                        <QualityCard
                            testid="price-mutu-1"
                            badge="Kualitas Utama"
                            badgeTone="primary"
                            grade="Mutu I"
                            desc="Kadar air < 7%, biji pecah < 1%, fermentasi sempurna."
                            icon={BadgeCheck}
                            iconTone="text-primary"
                            value={draft.mutuI}
                            onChange={(v) => setDraft({ ...draft, mutuI: v })}
                        />
                        <QualityCard
                            testid="price-mutu-2"
                            badge="Kualitas Menengah"
                            badgeTone="accent"
                            grade="Mutu II"
                            desc="Kadar air 7–9%, biji pecah 2–3%, fermentasi sebagian."
                            icon={BarChart3}
                            iconTone="text-accent"
                            value={draft.mutuII}
                            onChange={(v) =>
                                setDraft({ ...draft, mutuII: v })
                            }
                        />
                    </div>
                    <QualityCard
                        testid="price-mutu-3"
                        inline
                        badge="Kualitas Dasar"
                        badgeTone="secondary"
                        grade="Mutu III"
                        desc="Biji kakao dengan kadar air > 9% atau persentase berjamur di atas ambang batas standar."
                        icon={AlertCircle}
                        iconTone="text-red-300"
                        value={draft.mutuIII}
                        onChange={(v) => setDraft({ ...draft, mutuIII: v })}
                    />
                </div>

                {/* Right: Info panel */}
                <aside
                    data-testid="info-update-panel"
                    className="card-grad rounded-lg border border-border p-3 flex flex-col gap-2.5 relative overflow-hidden"
                >
                    <div
                        className="absolute inset-0 opacity-[0.04] pointer-events-none"
                        style={{
                            background:
                                "url('https://images.unsplash.com/photo-1610450949065-1f2841536c88?w=400') center/cover",
                        }}
                    />
                    <div className="relative flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[11px] font-semibold">
                            Informasi Update
                        </span>
                    </div>

                    <div className="relative space-y-1.5 text-[10px]">
                        <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">
                                Update Terakhir
                            </span>
                            <span
                                className="text-right font-mono"
                                data-testid="info-update-at"
                            >
                                {updateDate}, {updateTime}
                            </span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">Oleh</span>
                            <span
                                className="text-right truncate"
                                data-testid="info-update-by"
                            >
                                {lastUpdate.by}
                            </span>
                        </div>
                        <div className="flex justify-between gap-2 pt-1 border-t border-border/60">
                            <span className="text-muted-foreground">
                                Market Ref
                            </span>
                            <span className="text-right text-accent font-semibold">
                                ICCO London
                            </span>
                        </div>
                    </div>

                    <div className="relative mt-auto rounded-md bg-muted/40 border border-border/60 p-2 flex gap-1.5">
                        <Quote className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                        <p className="text-[9.5px] leading-snug text-muted-foreground italic">
                            Harga ini akan digunakan sebagai pengali otomatis
                            pada Smart Scale yang terintegrasi.
                        </p>
                    </div>
                </aside>
            </div>

            {/* Bottom action bar */}
            <div className="shrink-0 flex items-center justify-between border-t border-border pt-2.5">
                <div className="text-[10px] text-muted-foreground">
                    Selisih{" "}
                    <span className="text-foreground font-mono">
                        Mutu I → III
                    </span>{" "}
                    ·{" "}
                    <span className="text-accent font-mono font-semibold">
                        {formatRupiah(draft.mutuI - draft.mutuIII)}/kg (
                        {Math.round(
                            ((draft.mutuI - draft.mutuIII) /
                                Math.max(draft.mutuI, 1)) *
                                100
                        )}
                        %)
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        data-testid="settings-reset-btn"
                        className="h-9 px-4 rounded-md bg-transparent hover:bg-destructive/10 border border-destructive/40 text-destructive text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset Default
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!dirty}
                        data-testid="settings-save-btn"
                        className="h-9 px-5 rounded-md bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-primary/25"
                    >
                        <Save className="w-3.5 h-3.5" />
                        Simpan Konfigurasi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
