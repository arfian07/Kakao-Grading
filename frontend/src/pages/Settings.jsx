import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { initialPrices, formatRupiah } from "../lib/mockData";
import { toast } from "sonner";
import { Save, RotateCcw, Tag, Coins, Award } from "lucide-react";

const PriceInput = ({ icon: Icon, tone, label, sub, value, onChange, testid }) => (
    <div
        data-testid={testid}
        className="card-grad rounded-lg border border-border p-3 flex items-center gap-3"
    >
        <div
            className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 ${tone}`}
        >
            <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
            <div className="flex items-baseline justify-between mb-0.5">
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        {label}
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                        {sub}
                    </div>
                </div>
                <div className="num-display text-[11px] text-muted-foreground">
                    {formatRupiah(value)}/kg
                </div>
            </div>
            <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                    Rp
                </span>
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value || 0, 10))}
                    className="w-full h-9 pl-7 pr-3 rounded-md bg-input border border-border text-[13px] font-mono font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
            </div>
        </div>
    </div>
);

const Settings = () => {
    const { prices, setPrices } = useApp();
    const [draft, setDraft] = useState(prices);

    const dirty =
        draft.mutuI !== prices.mutuI ||
        draft.mutuII !== prices.mutuII ||
        draft.mutuIII !== prices.mutuIII;

    const handleSave = () => {
        setPrices(draft);
        toast.success("Pengaturan harga disimpan");
    };

    const handleReset = () => {
        setDraft(initialPrices);
        toast("Direset ke harga default");
    };

    return (
        <div className="h-full flex flex-col p-3 gap-3" data-testid="settings-page">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold leading-tight">
                        Pengaturan Harga Referensi
                    </h2>
                    <p className="text-[10px] text-muted-foreground">
                        Harga per kilogram untuk perhitungan estimasi otomatis
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={handleReset}
                        data-testid="settings-reset-btn"
                        className="h-9 px-3 rounded-md bg-muted/60 hover:bg-muted border border-border text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset Default
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!dirty}
                        data-testid="settings-save-btn"
                        className="h-9 px-4 rounded-md bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-primary/20"
                    >
                        <Save className="w-3.5 h-3.5" />
                        Simpan Perubahan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 flex-1">
                <PriceInput
                    icon={Award}
                    tone="bg-gradient-to-br from-accent to-accent/70 text-accent-foreground"
                    label="Mutu I — Premium"
                    sub="Cacat ≤ 5%"
                    value={draft.mutuI}
                    onChange={(v) => setDraft({ ...draft, mutuI: v })}
                    testid="price-mutu-1"
                />
                <PriceInput
                    icon={Tag}
                    tone="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground"
                    label="Mutu II — Standar"
                    sub="Cacat 6–15%"
                    value={draft.mutuII}
                    onChange={(v) => setDraft({ ...draft, mutuII: v })}
                    testid="price-mutu-2"
                />
                <PriceInput
                    icon={Coins}
                    tone="bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground"
                    label="Mutu III — Reguler"
                    sub="Cacat > 15%"
                    value={draft.mutuIII}
                    onChange={(v) => setDraft({ ...draft, mutuIII: v })}
                    testid="price-mutu-3"
                />
            </div>

            <div className="card-grad rounded-md border border-border px-3 py-2 flex items-center justify-between">
                <div className="text-[10px] text-muted-foreground">
                    Selisih harga{" "}
                    <span className="text-foreground font-mono">
                        Mutu I → III
                    </span>
                </div>
                <div className="num-display text-[11px] font-semibold text-accent">
                    {formatRupiah(draft.mutuI - draft.mutuIII)}/kg ·{" "}
                    {Math.round(((draft.mutuI - draft.mutuIII) / draft.mutuI) * 100)}%
                </div>
            </div>
        </div>
    );
};

export default Settings;
