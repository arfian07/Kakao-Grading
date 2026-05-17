import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    History,
    Settings,
    LogOut,
    Cpu,
    Radio,
    User,
} from "lucide-react";
import { useApp } from "../context/AppContext";

const StatusIcon = ({ icon: Icon, label, ok = true, testid }) => (
    <div
        data-testid={testid}
        title={`${label} ${ok ? "Online" : "Offline"}`}
        className="relative w-7 h-7 rounded-md bg-muted/60 border border-border flex items-center justify-center"
    >
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span
            className={`pulse-dot absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-background ${
                ok ? "bg-emerald-400" : "bg-destructive"
            }`}
        />
    </div>
);

const Topbar = () => {
    const { user, activeTrxId, logout } = useApp();
    const navigate = useNavigate();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const time = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const tabCls = ({ isActive }) =>
        `flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-medium transition-all ${
            isActive
                ? "bg-primary/15 text-primary shadow-inner"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
        }`;

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header
            data-testid="app-topbar"
            className="h-12 shrink-0 px-3 flex items-center justify-between border-b border-border glass relative z-20"
        >
            {/* LEFT — Brand */}
            <div className="flex items-center gap-2 min-w-0 w-[180px]">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md shrink-0">
                    <span className="text-[13px] font-bold text-background">
                        K
                    </span>
                </div>
                <div className="leading-tight min-w-0">
                    <div className="text-[11px] font-semibold tracking-tight truncate">
                        Sistem Grading
                    </div>
                    <div className="text-[9px] text-muted-foreground -mt-0.5 truncate">
                        Biji Kakao · IoT
                    </div>
                </div>
            </div>

            {/* CENTER — Nav tabs */}
            <nav className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/30 border border-border">
                <NavLink to="/" end className={tabCls} data-testid="nav-dashboard">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                </NavLink>
                <NavLink
                    to="/history"
                    className={tabCls}
                    data-testid="nav-history"
                >
                    <History className="w-3.5 h-3.5" />
                    Riwayat
                </NavLink>
                <NavLink
                    to="/settings"
                    className={tabCls}
                    data-testid="nav-settings"
                >
                    <Settings className="w-3.5 h-3.5" />
                    Harga
                </NavLink>
            </nav>

            {/* RIGHT — Status + clock + user */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                    <StatusIcon
                        icon={Cpu}
                        label="ESP32"
                        ok
                        testid="status-esp32"
                    />
                    <StatusIcon
                        icon={Radio}
                        label="MQTT"
                        ok
                        testid="status-mqtt"
                    />
                </div>

                <div className="h-7 w-px bg-border" />

                <div className="text-right leading-tight">
                    <div
                        className="text-[12px] font-mono font-semibold"
                        data-testid="topbar-clock"
                    >
                        {time}
                    </div>
                    <div
                        className="text-[9px] font-mono text-accent -mt-0.5"
                        data-testid="topbar-trx-id"
                    >
                        {activeTrxId}
                    </div>
                </div>

                <div className="h-7 w-px bg-border" />

                <button
                    onClick={handleLogout}
                    data-testid="topbar-user-logout"
                    className="flex items-center gap-1.5 px-2 h-8 rounded-md bg-muted/60 hover:bg-muted border border-border transition-colors"
                >
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-3 h-3 text-primary" />
                    </div>
                    <div className="leading-tight text-left">
                        <div className="text-[10px] font-medium">
                            {user?.name?.split(" ")[0] ?? "Tamu"}
                        </div>
                        <div className="text-[8px] text-muted-foreground -mt-0.5">
                            {user?.role ?? "—"}
                        </div>
                    </div>
                    <LogOut className="w-3 h-3 text-muted-foreground ml-1" />
                </button>
            </div>
        </header>
    );
};

export default Topbar;
