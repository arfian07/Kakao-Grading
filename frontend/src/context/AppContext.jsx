import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
    apiLogin,
    apiRegister,
    apiGetPrices,
    apiUpdatePrices,
    apiListTransactions,
    apiCreateTransaction,
    apiDeviceStatus,
    openSensorSocket,
} from "../lib/api";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const raw = localStorage.getItem("kakao_user");
        return raw ? JSON.parse(raw) : null;
    });
    const [prices, setPrices] = useState({ mutu_1: 50000, mutu_2: 42000, mutu_3: 33000 });
    const [transactions, setTransactions] = useState([]);
    const [activeTrxId, setActiveTrxId] = useState(() => `TRX-NEW-${Date.now().toString().slice(-4)}`);
    const [deviceStatus, setDeviceStatus] = useState({
        esp_online: false,
        mqtt_connected: false,
        camera_ready: false,
    });
    const [liveWeight, setLiveWeight] = useState(0);

    // Load initial data on login
    const refreshAll = useCallback(async () => {
        try {
            const [p, t, s] = await Promise.all([
                apiGetPrices(),
                apiListTransactions(),
                apiDeviceStatus(),
            ]);
            setPrices(p);
            setTransactions(t);
            setDeviceStatus(s);
        } catch (e) {
            console.warn("refreshAll failed", e?.message);
        }
    }, []);

    useEffect(() => {
        if (user) refreshAll();
    }, [user, refreshAll]);

    // Poll device status every 5s
    useEffect(() => {
        if (!user) return;
        const id = setInterval(() => {
            apiDeviceStatus().then(setDeviceStatus).catch(() => {});
        }, 5000);
        return () => clearInterval(id);
    }, [user]);

    // WebSocket live weight
    useEffect(() => {
        if (!user) return;
        let ws;
        try {
            ws = openSensorSocket((data) => {
                if (typeof data.berat === "number") setLiveWeight(data.berat);
            });
        } catch (e) {
            console.warn("WS failed", e);
        }
        return () => ws?.close?.();
    }, [user]);

    const login = async (email, password) => {
        const data = await apiLogin(email, password);
        localStorage.setItem("kakao_token", data.token);
        localStorage.setItem("kakao_user", JSON.stringify(data.user));
        setUser(data.user);
    };

    const register = async (payload) => {
        const data = await apiRegister(payload);
        localStorage.setItem("kakao_token", data.token);
        localStorage.setItem("kakao_user", JSON.stringify(data.user));
        setUser(data.user);
    };

    const logout = () => {
        localStorage.removeItem("kakao_token");
        localStorage.removeItem("kakao_user");
        setUser(null);
    };

    const updatePrices = async (newPrices) => {
        const updated = await apiUpdatePrices(newPrices);
        setPrices(updated);
    };

    const sendWsCommand = (cmd) => {
        // Simple: open new WS, send, close (for control). Real impl could keep a singleton.
        const wsUrl = `${process.env.REACT_APP_BACKEND_URL.replace(/^http/, "ws")}/api/ws/sensor`;
        const ws = new WebSocket(wsUrl);
        ws.onopen = () => {
            ws.send(cmd);
            setTimeout(() => ws.close(), 200);
        };
    };

    const addTransaction = async (trx) => {
        const created = await apiCreateTransaction(trx);
        setTransactions((prev) => [created, ...prev]);
        setActiveTrxId(`TRX-NEW-${Date.now().toString().slice(-4)}`);
        return created;
    };

    return (
        <AppContext.Provider
            value={{
                user,
                login,
                register,
                logout,
                prices,
                updatePrices,
                transactions,
                addTransaction,
                refreshAll,
                activeTrxId,
                deviceStatus,
                liveWeight,
                sendWsCommand,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
