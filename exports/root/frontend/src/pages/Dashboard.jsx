import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { formatRupiah } from "../lib/mockData";
import { toast } from "sonner";
import {
    Camera,
    CameraOff,
    Aperture,
    Upload,
    Scale,
    Lock,
    RotateCcw,
    Save,
    Activity,
    Sparkles,
    CheckCircle2,
    Hourglass,
    AlertTriangle,
    Bug,
    Circle,
    Layers,
} from "lucide-react";

const SensorBox = ({ label, value, unit, accent }) => (
    <div className="flex flex-col">
        <span className="text-[8px] uppercase tracking-wider text-muted-foreground">
            {label}
        </span>
        <span className={`num-display text-base font-semibold ${accent ?? ""}`}>
            {value}
            {unit && (
                <span className="text-[9px] text-muted-foreground ml-0.5 font-sans">
                    {unit}
                </span>
            )}
        </span>
    </div>
);

const ImageStatCard = ({ icon: Icon, label, value, tone }) => (
    <div
        data-testid={`img-stat-${label.toLowerCase().replace(/\s/g, "-")}`}
        className="card-grad border border-border rounded-md px-2 py-1.5 flex items-center gap-2"
    >
        <div
            className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${tone}`}
        >
            <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="leading-tight min-w-0">
            <div className="text-[8px] uppercase tracking-wider text-muted-foreground truncate">
                {label}
            </div>
            <div className="num-display text-base font-bold">{value}</div>
        </div>
    </div>
);

const ActionBtn = ({
    icon: Icon,
    label,
    onClick,
    variant = "default",
    disabled,
    testid,
}) => {
    const variants = {
        default:
            "bg-muted/60 hover:bg-muted text-foreground border-border",
        primary:
            "bg-primary hover:bg-primary/90 text-primary-foreground border-primary/40 shadow-md shadow-primary/20",
        accent:
            "bg-accent hover:bg-accent/90 text-accent-foreground border-accent/40 shadow-md shadow-accent/20",
        secondary:
            "bg-secondary hover:bg-secondary/90 text-secondary-foreground border-secondary/40",
        danger:
            "bg-destructive/15 hover:bg-destructive/25 text-destructive border-destructive/30",
    };
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            data-testid={testid}
            className={`h-10 px-3 rounded-md border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]}`}
        >
            <Icon className="w-3.5 h-3.5" />
            {label}
        </button>
    );
};

const Dashboard = () => {
    const { prices, addTransaction, activeTrxId } = useApp();
    const [camOn, setCamOn] = useState(true);
    const [captured, setCaptured] = useState(false);
    const [weightLocked, setWeightLocked] = useState(false);
    const [weight, setWeight] = useState(0);
    const [measuring, setMeasuring] = useState(false);
    const [imageAnalyzed, setImageAnalyzed] = useState(false);
    const [fuzzyDone, setFuzzyDone] = useState(false);
    const [imgStats, setImgStats] = useState({
        total: 0,
        moldy: 0,
        black: 0,
        defective: 0,
    });
    const [fuzzy, setFuzzy] = useState(null);
    const fileRef = useRef(null);

    // Simulate live weight reading
    useEffect(() => {
        if (weightLocked) return;
        if (!measuring) return;
        const id = setInterval(() => {
            setWeight((w) => {
                const target = 247.8;
                const next = w + (target - w) * 0.18 + (Math.random() - 0.5) * 0.6;
                return Math.max(0, parseFloat(next.toFixed(1)));
            });
        }, 180);
        return () => clearInterval(id);
    }, [measuring, weightLocked]);

    const handleTare = () => {
        setWeight(0);
        toast.success("Tare berhasil · timbangan dinolkan");
    };

    const handleStartMeasure = () => {
        setMeasuring(true);
        toast("Pengukuran dimulai", { description: "Letakkan sampel pada timbangan" });
    };

    const handleLockWeight = () => {
        if (weight < 10) {
            toast.error("Berat terlalu kecil untuk dikunci");
            return;
        }
        setWeightLocked(true);
        setMeasuring(false);
        toast.success(`Berat dikunci: ${weight.toFixed(1)} g`);
    };

    const handleCapture = () => {
        if (!camOn) {
            toast.error("Aktifkan kamera terlebih dahulu");
            return;
        }
        setCaptured(true);
        toast.success("Citra berhasil di-capture");
    };

    const handleUpload = (e) => {
        if (e.target.files?.[0]) {
            setCaptured(true);
            toast.success("Gambar diunggah · siap dianalisis");
        }
    };

    const handleAnalyzeImage = () => {
        if (!captured) {
            toast.error("Capture/upload citra dahulu");
            return;
        }
        const total = 102 + Math.floor(Math.random() * 18);
        setImgStats({
            total,
            moldy: Math.floor(Math.random() * 6),
            black: Math.floor(Math.random() * 4),
            defective: Math.floor(Math.random() * 8),
        });
        setImageAnalyzed(true);
        toast.success("Analisis citra selesai");
    };

    const handleFuzzy = () => {
        if (!weightLocked || !imageAnalyzed) {
            toast.error("Kunci berat & analisis citra terlebih dahulu");
            return;
        }
        const cleanRatio =
            1 - (imgStats.moldy + imgStats.black + imgStats.defective) / Math.max(imgStats.total, 1);
        const grades = ["Mutu I", "Mutu II", "Mutu III"];
        const idx = cleanRatio > 0.92 ? 0 : cleanRatio > 0.82 ? 1 : 2;
        const grade = grades[idx];
        const priceMap = [prices.mutuI, prices.mutuII, prices.mutuIII];
        const fuzzyValue = (0.55 + cleanRatio * 0.4).toFixed(3);
        const estPrice = Math.round((priceMap[idx] * weight) / 1000);
        setFuzzy({ grade, fuzzyValue, estPrice });
        setFuzzyDone(true);
        toast.success(`Grade ditentukan: ${grade}`);
    };

    const handleSave = () => {
        if (!fuzzyDone) {
            toast.error("Jalankan analisis fuzzy dahulu");
            return;
        }
        const beanCount = Math.round((imgStats.total * 100) / Math.max(weight, 1));
        addTransaction({
            id: activeTrxId,
            date: new Date().toISOString(),
            weight,
            beanCount,
            grade: fuzzy.grade,
            price: fuzzy.estPrice,
            moldy: imgStats.moldy,
            black: imgStats.black,
            defective: imgStats.defective,
            totalBeans: imgStats.total,
            fuzzyValue: fuzzy.fuzzyValue,
        });
        toast.success("Transaksi disimpan");
        handleReset();
    };

    const handleReset = () => {
        setCaptured(false);
        setWeight(0);
        setWeightLocked(false);
        setMeasuring(false);
        setImageAnalyzed(false);
        setFuzzyDone(false);
        setImgStats({ total: 0, moldy: 0, black: 0, defective: 0 });
        setFuzzy(null);
    };

    const beanPer100g = weight > 0 ? Math.round((imgStats.total * 100) / weight) : 0;

    return (
        <div className="h-full flex flex-col p-2.5 gap-2.5" data-testid="dashboard-page">
            <div className="flex-1 grid grid-cols-[1fr_300px] gap-2.5 min-h-0">
                {/* LEFT: Camera column */}
                <div className="flex flex-col gap-2 min-h-0">
                    {/* Camera preview */}
                    <div
                        className="relative rounded-lg overflow-hidden border border-border bg-black flex-1"
                        data-testid="camera-preview"
                    >
                        {camOn ? (
                            <>
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        background:
                                            captured && imageAnalyzed
                                                ? "url('https://images.unsplash.com/photo-1610450949065-1f2841536c88?w=900') center/cover"
                                                : captured
                                                ? "url('https://images.unsplash.com/photo-1610450949065-1f2841536c88?w=900') center/cover"
                                                : "radial-gradient(circle at 50% 50%, hsl(229 35% 18%) 0%, hsl(232 60% 3%) 80%)",
                                    }}
                                />
                                {!captured && (
                                    <>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <Aperture className="w-10 h-10 text-primary/40 mx-auto pulse-dot" />
                                                <div className="text-[10px] text-muted-foreground mt-1.5 tracking-widest uppercase">
                                                    Live Preview
                                                </div>
                                            </div>
                                        </div>
                                        <div className="scanline" />
                                    </>
                                )}
                                {captured && imageAnalyzed && (
                                    <>
                                        {/* bounding boxes */}
                                        {[
                                            { l: "32%", t: "28%", w: "12%", h: "16%", c: "border-emerald-400" },
                                            { l: "48%", t: "44%", w: "10%", h: "14%", c: "border-emerald-400" },
                                            { l: "20%", t: "55%", w: "11%", h: "15%", c: "border-amber-400" },
                                            { l: "62%", t: "30%", w: "13%", h: "17%", c: "border-emerald-400" },
                                            { l: "70%", t: "60%", w: "10%", h: "13%", c: "border-destructive" },
                                        ].map((b, i) => (
                                            <div
                                                key={i}
                                                className={`absolute border-2 ${b.c} rounded-sm shadow-lg`}
                                                style={{
                                                    left: b.l,
                                                    top: b.t,
                                                    width: b.w,
                                                    height: b.h,
                                                }}
                                            />
                                        ))}
                                    </>
                                )}
                                {/* HUD overlay */}
                                <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-start pointer-events-none">
                                    <div className="px-1.5 py-0.5 rounded bg-black/50 backdrop-blur text-[9px] font-mono text-emerald-400 flex items-center gap-1 border border-emerald-400/30">
                                        <Circle className="w-1.5 h-1.5 fill-emerald-400 pulse-dot" />
                                        REC · 1080p
                                    </div>
                                    <div className="px-1.5 py-0.5 rounded bg-black/50 backdrop-blur text-[9px] font-mono text-muted-foreground border border-border">
                                        FPS 30
                                    </div>
                                </div>
                                {captured && (
                                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-accent/90 text-accent-foreground text-[9px] font-bold tracking-wider uppercase">
                                        {imageAnalyzed ? "Analyzed · Locked" : "Captured"}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
                                <div className="text-center">
                                    <CameraOff className="w-10 h-10 text-muted-foreground mx-auto" />
                                    <div className="text-[11px] text-muted-foreground mt-2">
                                        Kamera nonaktif
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Camera controls */}
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => setCamOn((s) => !s)}
                            data-testid="cam-toggle-btn"
                            className={`flex-1 h-9 rounded-md border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                                camOn
                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                    : "bg-muted/60 border-border text-muted-foreground"
                            }`}
                        >
                            <Camera className="w-3.5 h-3.5" />
                            {camOn ? "Kamera Aktif" : "Aktifkan Kamera"}
                        </button>
                        <button
                            onClick={handleCapture}
                            data-testid="cam-capture-btn"
                            className="flex-1 h-9 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-primary/20"
                        >
                            <Aperture className="w-3.5 h-3.5" />
                            Capture
                        </button>
                        <button
                            onClick={() => fileRef.current?.click()}
                            data-testid="cam-upload-btn"
                            className="flex-1 h-9 rounded-md bg-muted/60 hover:bg-muted border border-border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            Upload
                        </button>
                        <input
                            type="file"
                            ref={fileRef}
                            accept="image/*"
                            onChange={handleUpload}
                            className="hidden"
                        />
                    </div>

                    {/* Image stats grid */}
                    <div className="grid grid-cols-4 gap-1.5">
                        <ImageStatCard
                            icon={Layers}
                            label="Total Biji"
                            value={imgStats.total || "—"}
                            tone="bg-primary/15 text-primary"
                        />
                        <ImageStatCard
                            icon={Bug}
                            label="Berjamur"
                            value={imgStats.moldy || "—"}
                            tone="bg-amber-500/15 text-amber-400"
                        />
                        <ImageStatCard
                            icon={Circle}
                            label="Hitam"
                            value={imgStats.black || "—"}
                            tone="bg-secondary/30 text-red-300"
                        />
                        <ImageStatCard
                            icon={AlertTriangle}
                            label="Cacat"
                            value={imgStats.defective || "—"}
                            tone="bg-destructive/15 text-destructive"
                        />
                    </div>
                </div>

                {/* RIGHT: Sensor + Fuzzy column */}
                <div className="flex flex-col gap-2 min-h-0">
                    {/* Weight Card */}
                    <div
                        className="card-grad rounded-lg border border-border p-2.5 relative overflow-hidden"
                        data-testid="weight-card"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                                <Scale className="w-3 h-3 text-primary" />
                                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Berat Real-time
                                </span>
                            </div>
                            <span
                                className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                    weightLocked
                                        ? "bg-accent/20 text-accent"
                                        : measuring
                                        ? "bg-amber-500/20 text-amber-400"
                                        : "bg-emerald-500/20 text-emerald-400"
                                }`}
                            >
                                {weightLocked ? "TERKUNCI" : measuring ? "MENGUKUR" : "STABIL"}
                            </span>
                        </div>
                        <div className="flex items-end gap-1 mb-2">
                            <span
                                className="num-display text-[34px] font-bold leading-none text-foreground"
                                data-testid="weight-value"
                            >
                                {weight.toFixed(1)}
                            </span>
                            <span className="text-[11px] text-muted-foreground mb-1">
                                gram
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            <button
                                onClick={handleTare}
                                disabled={weightLocked}
                                data-testid="tare-btn"
                                className="h-7 rounded-md bg-muted/60 hover:bg-muted border border-border text-[10px] font-semibold transition-colors disabled:opacity-40"
                            >
                                Tare
                            </button>
                            <button
                                onClick={handleStartMeasure}
                                disabled={weightLocked || measuring}
                                data-testid="start-measure-btn"
                                className="h-7 rounded-md bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-[10px] font-semibold transition-colors disabled:opacity-40"
                            >
                                Mulai
                            </button>
                            <button
                                onClick={handleLockWeight}
                                disabled={weightLocked}
                                data-testid="lock-weight-btn"
                                className="h-7 rounded-md bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent text-[10px] font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-1"
                            >
                                <Lock className="w-2.5 h-2.5" />
                                Kunci
                            </button>
                        </div>
                    </div>

                    {/* Bean Count Card */}
                    <div className="card-grad rounded-lg border border-border p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Activity className="w-3 h-3 text-accent" />
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Bean Count / 100g
                            </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                            <span
                                className="num-display text-[26px] font-bold leading-none"
                                data-testid="bean-count-value"
                            >
                                {beanPer100g || "—"}
                            </span>
                            <div className="text-right">
                                <div className="text-[8px] text-muted-foreground uppercase tracking-wider">
                                    Validasi
                                </div>
                                <div
                                    className={`text-[10px] font-semibold ${
                                        beanPer100g > 0
                                            ? "text-emerald-400"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    {beanPer100g > 0 ? "✓ Valid" : "Menunggu"}
                                </div>
                            </div>
                        </div>
                        <div className="text-[8px] text-muted-foreground mt-1 font-mono">
                            (total × 100) ÷ berat_g
                        </div>
                    </div>

                    {/* Fuzzy Card */}
                    <div
                        className={`card-grad rounded-lg border p-2.5 flex-1 relative overflow-hidden ${
                            fuzzyDone
                                ? "border-accent/50 shadow-lg shadow-accent/10"
                                : "border-border"
                        }`}
                        data-testid="fuzzy-card"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-accent" />
                                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Analisis Fuzzy
                                </span>
                            </div>
                            {!fuzzyDone && (
                                <span className="text-[8px] flex items-center gap-1 text-muted-foreground">
                                    <Hourglass className="w-2.5 h-2.5" />
                                    Menunggu
                                </span>
                            )}
                            {fuzzyDone && (
                                <span className="text-[8px] flex items-center gap-1 text-emerald-400">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    Selesai
                                </span>
                            )}
                        </div>
                        {fuzzyDone ? (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="px-2 py-1 rounded-md bg-gradient-to-br from-accent to-accent/70 text-accent-foreground">
                                        <div className="text-[7px] uppercase tracking-widest font-semibold">
                                            Grade
                                        </div>
                                        <div className="text-base font-bold leading-none">
                                            {fuzzy.grade}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[8px] uppercase tracking-wider text-muted-foreground">
                                            Nilai Fuzzy
                                        </div>
                                        <div className="num-display text-sm font-bold text-primary">
                                            {fuzzy.fuzzyValue}
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-border pt-1.5">
                                    <div className="text-[8px] uppercase tracking-wider text-muted-foreground">
                                        Estimasi Harga
                                    </div>
                                    <div
                                        className="num-display text-lg font-bold text-accent"
                                        data-testid="estimated-price"
                                    >
                                        {formatRupiah(fuzzy.estPrice)}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[80px] text-center">
                                <div className="w-8 h-8 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-1">
                                    <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                                <div className="text-[10px] text-muted-foreground leading-tight">
                                    Jalankan analisis kualitas
                                    <br />
                                    untuk menentukan grade
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="grid grid-cols-4 gap-1.5 shrink-0" data-testid="action-bar">
                <ActionBtn
                    icon={Aperture}
                    label="Analisis Citra"
                    onClick={handleAnalyzeImage}
                    variant="secondary"
                    disabled={!captured || imageAnalyzed}
                    testid="btn-analyze-image"
                />
                <ActionBtn
                    icon={Sparkles}
                    label="Analisis Kualitas"
                    onClick={handleFuzzy}
                    variant="accent"
                    disabled={!weightLocked || !imageAnalyzed || fuzzyDone}
                    testid="btn-analyze-fuzzy"
                />
                <ActionBtn
                    icon={Save}
                    label="Simpan Transaksi"
                    onClick={handleSave}
                    variant="primary"
                    disabled={!fuzzyDone}
                    testid="btn-save-trx"
                />
                <ActionBtn
                    icon={RotateCcw}
                    label="Reset Sistem"
                    onClick={handleReset}
                    variant="danger"
                    testid="btn-reset"
                />
            </div>
        </div>
    );
};

export default Dashboard;
