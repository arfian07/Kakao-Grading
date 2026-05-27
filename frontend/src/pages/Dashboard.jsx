import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { apiCapture, apiAnalyzeImage, apiAnalyzeFuzzy, API_BASE } from "../lib/api";
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
    CheckCircle,
} from "lucide-react";

const formatRupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");

const ImageStatCard = ({ icon: Icon, label, value, tone }) => (
    <div data-testid={`img-stat-${label.toLowerCase().replace(/\s/g, "-")}`} className="card-grad border border-border rounded-md px-2 py-1.5 flex items-center gap-2">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${tone}`}>
            <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="leading-tight min-w-0">
            <div className="text-[8px] uppercase tracking-wider text-muted-foreground truncate">{label}</div>
            <div className="num-display text-base font-bold">{value}</div>
        </div>
    </div>
);

const ActionBtn = ({ icon: Icon, label, onClick, variant = "default", disabled, loading, testid }) => {
    const variants = {
        default: "bg-muted/60 hover:bg-muted text-foreground border-border",
        primary: "bg-primary hover:bg-primary/90 text-primary-foreground border-primary/40 shadow-md shadow-primary/20",
        accent: "bg-accent hover:bg-accent/90 text-accent-foreground border-accent/40 shadow-md shadow-accent/20",
        secondary: "bg-secondary hover:bg-secondary/90 text-secondary-foreground border-secondary/40",
        danger: "bg-destructive/15 hover:bg-destructive/25 text-destructive border-destructive/30",
    };
    return (
        <button onClick={onClick} disabled={disabled || loading} data-testid={testid}
            className={`h-10 px-3 rounded-md border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]}`}>
            <Icon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {label}
        </button>
    );
};

const Dashboard = () => {
    const { prices, addTransaction, activeTrxId, deviceStatus, liveWeight, sendWsCommand } = useApp();

    const [camOn, setCamOn] = useState(false);
    const [captured, setCaptured] = useState(false);
    const [capturedUrl, setCapturedUrl] = useState(null);
    const [capturedPath, setCapturedPath] = useState(null);
    const [annotatedUrl, setAnnotatedUrl] = useState(null);

    const [weight, setWeight] = useState(0);
    const [weightLocked, setWeightLocked] = useState(false);
    const [measuring, setMeasuring] = useState(false);

    const [imgStats, setImgStats] = useState({ total: 0, good: 0, moldy: 0, black: 0, defective: 0 });
    const [imageAnalyzed, setImageAnalyzed] = useState(false);
    const [pendingFile, setPendingFile] = useState(null); // File hasil upload, menunggu di-analisis

    const [fuzzy, setFuzzy] = useState(null);
    const [fuzzyDone, setFuzzyDone] = useState(false);

    const [busy, setBusy] = useState({ capture: false, image: false, fuzzy: false, save: false });
    const fileRef = useRef(null);

    // Sync live weight dari WebSocket ke local state (kecuali sudah dikunci)
    useEffect(() => {
        if (!weightLocked && measuring && typeof liveWeight === "number") {
            setWeight(liveWeight);
        }
    }, [liveWeight, measuring, weightLocked]);

    const handleTare = () => {
        sendWsCommand("tare");
        setWeight(0);
        toast.success("Tare dikirim ke ESP32");
    };

    const handleStartMeasure = () => {
        sendWsCommand("start");
        setMeasuring(true);
        toast("Pengukuran dimulai", { description: "Letakkan sampel pada timbangan" });
    };

    const handleLockWeight = () => {
        if (weight <= 0) {
            toast.error("Berat belum terdeteksi");
            return;
        }
        sendWsCommand("stop");
        setWeightLocked(true);
        setMeasuring(false);
        toast.success(`Berat dikunci: ${weight.toFixed(1)} g`);
    };

    const handleCapture = async () => {
        setBusy((b) => ({ ...b, capture: true }));
        try {
            const res = await apiCapture();
            setCaptured(true);
            setCapturedPath(res.path);
            setCapturedUrl(`${process.env.REACT_APP_BACKEND_URL}${res.url}`);
            setPendingFile(null);
            setAnnotatedUrl(null);
            setImageAnalyzed(false);
            setImgStats({ total: 0, good: 0, moldy: 0, black: 0, defective: 0 });
            setCamOn(true);
            toast.success("Citra di-capture — tekan Analisis Citra");
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.message || "Gagal capture";
            toast.error(msg);
        } finally {
            setBusy((b) => ({ ...b, capture: false }));
        }
    };

    const handleUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Tampilkan dulu gambar original; analisis hanya saat user klik Analisis Citra
        setCaptured(true);
        setCapturedUrl(URL.createObjectURL(file));
        setCapturedPath(null);
        setPendingFile(file);
        setAnnotatedUrl(null);
        setImageAnalyzed(false);
        setImgStats({ total: 0, good: 0, moldy: 0, black: 0, defective: 0 });
        toast.success("Gambar dimuat — tekan Analisis Citra untuk deteksi");
        e.target.value = "";
    };

    const applyImageResult = (res) => {
        setImgStats({
            total: res.total_beans,
            good: res.good_beans,
            moldy: res.moldy_beans,
            black: res.black_beans,
            defective: res.broken_beans,
        });
        setImageAnalyzed(true);
        if (res.annotated_url) {
            setAnnotatedUrl(`${process.env.REACT_APP_BACKEND_URL}${res.annotated_url}`);
        }
    };

    const handleAnalyzeImage = async () => {
        if (!capturedPath && !pendingFile) {
            toast.error("Capture atau upload citra dahulu");
            return;
        }
        setBusy((b) => ({ ...b, image: true }));
        try {
            let res;
            if (pendingFile) {
                // Flow upload: kirim file langsung ke endpoint /analyze/image
                res = await apiAnalyzeImage(pendingFile);
                if (res.image_path) setCapturedPath(res.image_path);
                setPendingFile(null);
            } else {
                // Flow capture: file sudah ada di server, pakai analyze-path
                const url = `${API_BASE}/analyze/analyze-path?path=${encodeURIComponent(capturedPath)}`;
                const resp = await fetch(url, { method: "POST" });
                if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}));
                    throw new Error(err.detail || `HTTP ${resp.status}`);
                }
                res = await resp.json();
            }
            applyImageResult(res);
            toast.success(`Analisis selesai · ${res.total_beans} biji terdeteksi`);
        } catch (err) {
            toast.error(err?.message || err?.response?.data?.detail || "Analisis citra gagal");
        } finally {
            setBusy((b) => ({ ...b, image: false }));
        }
    };

    const handleFuzzy = async () => {
        if (!weightLocked || !imageAnalyzed) {
            toast.error("Kunci berat & analisis citra terlebih dahulu");
            return;
        }
        setBusy((b) => ({ ...b, fuzzy: true }));
        try {
            const res = await apiAnalyzeFuzzy({
                weight_g: weight,
                total_beans: imgStats.total,
                moldy: imgStats.moldy,
                black: imgStats.black,
                defective: imgStats.defective,
            });
            setFuzzy(res);
            setFuzzyDone(true);
            toast.success(`Grade: ${res.grade}`);
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Fuzzy gagal");
        } finally {
            setBusy((b) => ({ ...b, fuzzy: false }));
        }
    };

    const handleSave = async () => {
        if (!fuzzyDone) {
            toast.error("Jalankan analisis kualitas dahulu");
            return;
        }
        setBusy((b) => ({ ...b, save: true }));
        try {
            await addTransaction({
                weight_g: weight,
                total_beans: imgStats.total,
                good_beans: imgStats.good,
                broken_beans: imgStats.defective,
                black_beans: imgStats.black,
                moldy_beans: imgStats.moldy,
                image_path: capturedPath,
                annotated_path: annotatedUrl ? annotatedUrl.split("/").pop() : null,
                fuzzy_value: fuzzy.fuzzy_value,
                grade: fuzzy.grade,
                estimated_price: fuzzy.estimasi_harga_per_kg,
                bean_count_100g: fuzzy.bean_count_100g,
            });
            toast.success("Transaksi disimpan ke database");
            handleReset();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Gagal simpan");
        } finally {
            setBusy((b) => ({ ...b, save: false }));
        }
    };

    const handleReset = () => {
        setCaptured(false);
        setCapturedUrl(null);
        setCapturedPath(null);
        setAnnotatedUrl(null);
        setPendingFile(null);
        setWeight(0);
        setWeightLocked(false);
        setMeasuring(false);
        setImageAnalyzed(false);
        setFuzzyDone(false);
        setImgStats({ total: 0, good: 0, moldy: 0, black: 0, defective: 0 });
        setFuzzy(null);
    };

    const beanPer100g = weight > 0 ? Math.round((imgStats.total * 100) / weight) : 0;
    const displayImg = annotatedUrl || capturedUrl;

    // ---- Draggable image (pan) ----
    const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false, sx: 0, sy: 0 });
    useEffect(() => {
        // Reset posisi setiap kali sumber gambar berubah
        setDrag({ x: 0, y: 0, dragging: false, sx: 0, sy: 0 });
    }, [displayImg]);
    const onPointerDown = (e) => {
        if (!displayImg) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setDrag((d) => ({
            ...d,
            dragging: true,
            sx: e.clientX - d.x,
            sy: e.clientY - d.y,
        }));
    };
    const onPointerMove = (e) => {
        setDrag((d) =>
            d.dragging ? { ...d, x: e.clientX - d.sx, y: e.clientY - d.sy } : d
        );
    };
    const endDrag = (e) => {
        try {
            e.currentTarget.releasePointerCapture?.(e.pointerId);
        } catch {}
        setDrag((d) => ({ ...d, dragging: false }));
    };
    const cursorClass = !displayImg
        ? ""
        : drag.dragging
        ? "cursor-grabbing"
        : "cursor-grab";

    return (
        <div className="h-full flex flex-col p-2.5 gap-2.5" data-testid="dashboard-page">
            <div className="flex-1 grid grid-cols-[1fr_300px] gap-2.5 min-h-0">
                <div className="flex flex-col gap-2 min-h-0">
                    <div
                        className={`relative rounded-lg overflow-hidden border border-border bg-black flex-1 ${cursorClass} select-none`}
                        data-testid="camera-preview"
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onDoubleClick={() => setDrag({ x: 0, y: 0, dragging: false, sx: 0, sy: 0 })}
                        title={displayImg ? "Klik & tarik untuk geser · dobel-klik untuk reset" : ""}
                    >
                        {displayImg ? (
                            <img
                                src={displayImg}
                                alt="Preview"
                                className="absolute inset-0 w-full h-full object-cover will-change-transform"
                                style={{
                                    objectPosition: `calc(50% + ${drag.x}px) calc(50% + ${drag.y}px)`,
                                    transition: drag.dragging ? "none" : "object-position 0.18s ease-out",
                                    pointerEvents: "none",
                                }}
                                data-testid="draggable-image-layer"
                            />
                        ) : camOn ? (
                            <>
                                <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 50%, hsl(229 35% 18%) 0%, hsl(232 60% 3%) 80%)" }} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <Aperture className="w-10 h-10 text-primary/40 mx-auto pulse-dot" />
                                        <div className="text-[10px] text-muted-foreground mt-1.5 tracking-widest uppercase">Live Preview</div>
                                    </div>
                                </div>
                                <div className="scanline" />
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
                                <div className="text-center">
                                    <CameraOff className="w-10 h-10 text-muted-foreground mx-auto" />
                                    <div className="text-[11px] text-muted-foreground mt-2">Kamera siaga · Tekan Capture untuk ambil gambar</div>
                                </div>
                            </div>
                        )}
                        <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-start pointer-events-none">
                            <div className={`px-1.5 py-0.5 rounded backdrop-blur text-[9px] font-mono flex items-center gap-1 border ${deviceStatus?.camera_ready ? "bg-black/50 text-emerald-400 border-emerald-400/30" : "bg-black/50 text-muted-foreground border-border"}`}>
                                <Circle className={`w-1.5 h-1.5 ${deviceStatus?.camera_ready ? "fill-emerald-400 pulse-dot" : "fill-muted-foreground"}`} />
                                {deviceStatus?.camera_ready ? "Pi CAM READY" : "Pi CAM OFFLINE"}
                            </div>
                            {imageAnalyzed && !busy.image && (
                                <div className="px-1.5 py-0.5 rounded bg-accent/90 text-accent-foreground text-[9px] font-bold tracking-wider uppercase">
                                    Analyzed · {imgStats.total} biji
                                </div>
                            )}
                        </div>

                        {/* Loading overlay saat sedang analisis citra */}
                        {busy.image && (
                            <div
                                className="absolute inset-0 z-20 analysis-loading-bg flex items-center justify-center"
                                data-testid="analysis-loading-overlay"
                            >
                                <div className="text-center px-4">
                                    <div className="analysis-ring mx-auto" />
                                    <div className="mt-3 text-[13px] font-semibold tracking-tight text-foreground">
                                        Menganalisis citra biji kakao
                                        <span className="analysis-dots ml-1">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </span>
                                    </div>
                                    <div className="mt-1 text-[10px] text-muted-foreground leading-snug">
                                        Model AI sedang menghitung jumlah & klasifikasi mutu biji.
                                        <br />
                                        Mohon tunggu sebentar.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-1.5">
                        <button onClick={() => setCamOn((s) => !s)} data-testid="cam-toggle-btn"
                            className={`flex-1 h-9 rounded-md border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${camOn ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-muted/60 border-border text-muted-foreground"}`}>
                            <Camera className="w-3.5 h-3.5" />
                            {camOn ? "Standby" : "Aktifkan"}
                        </button>
                        <button onClick={handleCapture} disabled={busy.capture} data-testid="cam-capture-btn"
                            className="flex-1 h-9 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-primary/20 disabled:opacity-50">
                            <Aperture className={`w-3.5 h-3.5 ${busy.capture ? "animate-spin" : ""}`} />
                            Capture
                        </button>
                        <button onClick={() => fileRef.current?.click()} data-testid="cam-upload-btn"
                            className="flex-1 h-9 rounded-md bg-muted/60 hover:bg-muted border border-border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            Upload
                        </button>
                        <input type="file" ref={fileRef} accept="image/*" onChange={handleUpload} className="hidden" />
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                        <ImageStatCard icon={CheckCircle} label="Bagus" value={imgStats.good || "—"} tone="bg-emerald-500/15 text-emerald-400" />
                        <ImageStatCard icon={Bug} label="Berjamur" value={imgStats.moldy || "—"} tone="bg-amber-500/15 text-amber-400" />
                        <ImageStatCard icon={Circle} label="Hitam" value={imgStats.black || "—"} tone="bg-secondary/30 text-red-300" />
                        <ImageStatCard icon={AlertTriangle} label="Rusak" value={imgStats.defective || "—"} tone="bg-destructive/15 text-destructive" />
                    </div>
                </div>

                <div className="flex flex-col gap-2 min-h-0">
                    <div className="card-grad rounded-lg border border-border p-2.5 relative overflow-hidden" data-testid="weight-card">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                                <Scale className="w-3 h-3 text-primary" />
                                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Berat Real-time</span>
                            </div>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${weightLocked ? "bg-accent/20 text-accent" : measuring ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                                {weightLocked ? "TERKUNCI" : measuring ? "MENGUKUR" : "STABIL"}
                            </span>
                        </div>
                        <div className="flex items-end gap-1 mb-2">
                            <span className="num-display text-[34px] font-bold leading-none text-foreground" data-testid="weight-value">{weight.toFixed(1)}</span>
                            <span className="text-[11px] text-muted-foreground mb-1">gram</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            <button onClick={handleTare} disabled={weightLocked} data-testid="tare-btn"
                                className="h-7 rounded-md bg-muted/60 hover:bg-muted border border-border text-[10px] font-semibold transition-colors disabled:opacity-40">
                                Tare
                            </button>
                            <button onClick={handleStartMeasure} disabled={weightLocked || measuring} data-testid="start-measure-btn"
                                className="h-7 rounded-md bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-[10px] font-semibold transition-colors disabled:opacity-40">
                                Mulai
                            </button>
                            <button onClick={handleLockWeight} disabled={weightLocked} data-testid="lock-weight-btn"
                                className="h-7 rounded-md bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent text-[10px] font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                Kunci
                            </button>
                        </div>
                    </div>

                    <div className="card-grad rounded-lg border border-border p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Activity className="w-3 h-3 text-accent" />
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Bean Count / 100g</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                            <span className="num-display text-[26px] font-bold leading-none" data-testid="bean-count-value">{beanPer100g || "—"}</span>
                            <div className="text-right">
                                <div className="text-[8px] text-muted-foreground uppercase tracking-wider">Validasi</div>
                                <div className={`text-[10px] font-semibold ${beanPer100g > 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                                    {beanPer100g > 0 ? "✓ Valid" : "Menunggu"}
                                </div>
                            </div>
                        </div>
                        <div className="text-[8px] text-muted-foreground mt-1 font-mono">(total × 100) ÷ berat_g</div>
                    </div>

                    <div className={`card-grad rounded-lg border p-2.5 flex-1 relative overflow-hidden ${fuzzyDone ? "border-accent/50 shadow-lg shadow-accent/10" : "border-border"}`} data-testid="fuzzy-card">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-accent" />
                                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Analisis Fuzzy</span>
                            </div>
                            {!fuzzyDone ? (
                                <span className="text-[8px] flex items-center gap-1 text-muted-foreground">
                                    <Hourglass className="w-2.5 h-2.5" />
                                    Menunggu
                                </span>
                            ) : (
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
                                        <div className="text-[7px] uppercase tracking-widest font-semibold">Grade</div>
                                        <div className="text-base font-bold leading-none">{fuzzy.grade}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8px] uppercase tracking-wider text-muted-foreground">Nilai Fuzzy</div>
                                        <div className="num-display text-sm font-bold text-primary">{fuzzy.fuzzy_value.toFixed(3)}</div>
                                    </div>
                                </div>
                                <div className="border-t border-border pt-1.5">
                                    <div className="text-[8px] uppercase tracking-wider text-muted-foreground">Estimasi Harga/kg</div>
                                    <div className="num-display text-lg font-bold text-accent" data-testid="estimated-price">
                                        {formatRupiah(Math.round(fuzzy.estimasi_harga_per_kg))}
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
                                    <br />untuk menentukan grade
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 shrink-0" data-testid="action-bar">
                <ActionBtn icon={Aperture} label="Analisis Citra" onClick={handleAnalyzeImage}
                    variant="secondary" disabled={!captured || imageAnalyzed} loading={busy.image} testid="btn-analyze-image" />
                <ActionBtn icon={Sparkles} label="Analisis Kualitas" onClick={handleFuzzy}
                    variant="accent" disabled={!weightLocked || !imageAnalyzed || fuzzyDone} loading={busy.fuzzy} testid="btn-analyze-fuzzy" />
                <ActionBtn icon={Save} label="Simpan Transaksi" onClick={handleSave}
                    variant="primary" disabled={!fuzzyDone} loading={busy.save} testid="btn-save-trx" />
                <ActionBtn icon={RotateCcw} label="Reset Sistem" onClick={handleReset}
                    variant="danger" testid="btn-reset" />
            </div>
        </div>
    );
};

export default Dashboard;