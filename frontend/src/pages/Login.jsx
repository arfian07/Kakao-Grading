import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
    Bean,
    Lock,
    User as UserIcon,
    Loader2,
    Eye,
    EyeOff,
    Mail,
    Briefcase,
} from "lucide-react";
import { toast } from "sonner";

const Login = () => {
    const { login, register } = useApp();
    const navigate = useNavigate();
    const [tab, setTab] = useState("login"); // 'login' | 'register'

    // Login
    const [username, setUsername] = useState("admin@kakao.id");
    const [password, setPassword] = useState("admin123");
    const [showPwd, setShowPwd] = useState(false);

    // Register
    const [regName, setRegName] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regUsername, setRegUsername] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regRole, setRegRole] = useState("Operator");
    const [showRegPwd, setShowRegPwd] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            toast.error("Email & password wajib diisi");
            return;
        }
        setLoading(true);
        try {
            await login(username, password);
            toast.success("Login berhasil");
            navigate("/");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Login gagal");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!regName || !regEmail || !regPassword) {
            toast.error("Lengkapi data registrasi");
            return;
        }
        if (regPassword.length < 6) {
            toast.error("Password minimal 6 karakter");
            return;
        }
        setLoading(true);
        try {
            await register({
                name: regName,
                email: regEmail,
                password: regPassword,
                role: regRole,
            });
            toast.success(`Akun ${regEmail} dibuat — masuk otomatis`);
            navigate("/");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Registrasi gagal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="device-shell">
            <div className="device-frame grain flex">
                {/* LEFT — Brand panel (clean, no status indicators) */}
                <div className="w-[340px] relative overflow-hidden border-r border-border">
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                "radial-gradient(circle at 30% 30%, hsl(234 60% 74% / 0.25), transparent 60%), radial-gradient(circle at 80% 80%, hsl(38 60% 54% / 0.18), transparent 55%)",
                        }}
                    />
                    <div className="relative h-full p-8 flex flex-col justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                                <Bean className="w-5 h-5 text-background" />
                            </div>
                            <div className="leading-tight">
                                <div className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                                    Cocoa Grade
                                </div>
                                <div className="text-sm font-bold">
                                    IoT Station
                                </div>
                            </div>
                        </div>

                        <div>
                            <h1 className="text-[26px] font-bold leading-[1.05] tracking-tight">
                                Sistem Grading
                                <br />
                                <span className="text-accent">Biji Kakao</span>
                            </h1>
                            <p className="text-[11px] text-muted-foreground mt-2.5 leading-relaxed">
                                Klasifikasi mutu & estimasi harga otomatis
                                berbasis fuzzy logic dengan sensor IoT
                                real-time.
                            </p>
                        </div>

                        <div className="text-[9px] text-muted-foreground/70 font-mono tracking-wider">
                            v1.0 · Raspberry Pi Edition
                        </div>
                    </div>
                </div>

                {/* RIGHT — Auth forms */}
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full max-w-[320px]">
                        {/* Tabs */}
                        <div
                            className="grid grid-cols-2 p-0.5 rounded-md bg-muted/40 border border-border mb-4"
                            data-testid="auth-tabs"
                        >
                            <button
                                onClick={() => setTab("login")}
                                data-testid="tab-login"
                                className={`h-7 rounded text-[11px] font-semibold transition-all ${
                                    tab === "login"
                                        ? "bg-primary text-primary-foreground shadow"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Masuk
                            </button>
                            <button
                                onClick={() => setTab("register")}
                                data-testid="tab-register"
                                className={`h-7 rounded text-[11px] font-semibold transition-all ${
                                    tab === "register"
                                        ? "bg-primary text-primary-foreground shadow"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Daftar
                            </button>
                        </div>

                        {tab === "login" ? (
                            <form
                                onSubmit={handleLogin}
                                data-testid="login-form"
                                className="space-y-3"
                            >
                                <div>
                                    <h2 className="text-base font-bold leading-tight">
                                        Masuk Operator
                                    </h2>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Gunakan kredensial stasiun untuk mengakses
                                    </p>
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                        Email
                                    </label>
                                    <div className="mt-1 relative">
                                        <UserIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="email"
                                            value={username}
                                            onChange={(e) =>
                                                setUsername(e.target.value)
                                            }
                                            data-testid="login-username-input"
                                            className="w-full h-9 pl-8 pr-3 rounded-md bg-input border border-border text-[12px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                            placeholder="admin@kakao.id"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                        Password
                                    </label>
                                    <div className="mt-1 relative">
                                        <Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type={showPwd ? "text" : "password"}
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            data-testid="login-password-input"
                                            className="w-full h-9 pl-8 pr-9 rounded-md bg-input border border-border text-[12px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPwd((s) => !s)}
                                            data-testid="login-password-toggle"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                            aria-label="Toggle password visibility"
                                        >
                                            {showPwd ? (
                                                <EyeOff className="w-3.5 h-3.5" />
                                            ) : (
                                                <Eye className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    data-testid="login-submit-btn"
                                    className="w-full h-10 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[13px] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Memverifikasi...
                                        </>
                                    ) : (
                                        "Masuk ke Dashboard"
                                    )}
                                </button>

                                <div className="text-[10px] text-muted-foreground text-center pt-0.5">
                                    Demo ·{" "}
                                    <span className="text-accent font-mono">
                                        admin@kakao.id
                                    </span>
                                    {" / "}
                                    <span className="text-accent font-mono">
                                        admin123
                                    </span>
                                </div>
                            </form>
                        ) : (
                            <form
                                onSubmit={handleRegister}
                                data-testid="register-form"
                                className="space-y-2.5"
                            >
                                <div>
                                    <h2 className="text-base font-bold leading-tight">
                                        Daftar Operator Baru
                                    </h2>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Buat akun baru untuk akses stasiun
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                                            Nama Lengkap
                                        </label>
                                        <div className="mt-1 relative">
                                            <UserIcon className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={regName}
                                                onChange={(e) =>
                                                    setRegName(e.target.value)
                                                }
                                                data-testid="register-name-input"
                                                className="w-full h-8 pl-7 pr-2 rounded-md bg-input border border-border text-[11px] focus:outline-none focus:border-primary"
                                                placeholder="Budi Santoso"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                                            Role
                                        </label>
                                        <div className="mt-1 relative">
                                            <Briefcase className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <select
                                                value={regRole}
                                                onChange={(e) =>
                                                    setRegRole(e.target.value)
                                                }
                                                data-testid="register-role-select"
                                                className="w-full h-8 pl-7 pr-2 rounded-md bg-input border border-border text-[11px] focus:outline-none focus:border-primary appearance-none"
                                            >
                                                <option>Operator</option>
                                                <option>Supervisor</option>
                                                <option>Administrator</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                                        Email
                                    </label>
                                    <div className="mt-1 relative">
                                        <Mail className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="email"
                                            value={regEmail}
                                            onChange={(e) =>
                                                setRegEmail(e.target.value)
                                            }
                                            data-testid="register-email-input"
                                            className="w-full h-8 pl-7 pr-2 rounded-md bg-input border border-border text-[11px] focus:outline-none focus:border-primary"
                                            placeholder="operator@kakao.id"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                                        Username
                                    </label>
                                    <div className="mt-1 relative">
                                        <UserIcon className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={regUsername}
                                            onChange={(e) =>
                                                setRegUsername(e.target.value)
                                            }
                                            data-testid="register-username-input"
                                            className="w-full h-8 pl-7 pr-2 rounded-md bg-input border border-border text-[11px] focus:outline-none focus:border-primary"
                                            placeholder="budi.s"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                                        Password
                                    </label>
                                    <div className="mt-1 relative">
                                        <Lock className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type={
                                                showRegPwd ? "text" : "password"
                                            }
                                            value={regPassword}
                                            onChange={(e) =>
                                                setRegPassword(e.target.value)
                                            }
                                            data-testid="register-password-input"
                                            className="w-full h-8 pl-7 pr-9 rounded-md bg-input border border-border text-[11px] focus:outline-none focus:border-primary"
                                            placeholder="Minimal 6 karakter"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowRegPwd((s) => !s)
                                            }
                                            data-testid="register-password-toggle"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                            aria-label="Toggle password visibility"
                                        >
                                            {showRegPwd ? (
                                                <EyeOff className="w-3 h-3" />
                                            ) : (
                                                <Eye className="w-3 h-3" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    data-testid="register-submit-btn"
                                    className="w-full h-9 rounded-md bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-[12px] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-60 mt-1"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Membuat akun...
                                        </>
                                    ) : (
                                        "Buat Akun & Masuk"
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
