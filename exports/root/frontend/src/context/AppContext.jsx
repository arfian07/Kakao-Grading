import React, { createContext, useContext, useState, useEffect } from "react";
import {
    initialPrices,
    sampleTransactions,
    generateTrxId,
} from "../lib/mockData";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const raw = localStorage.getItem("kakao_user");
        return raw ? JSON.parse(raw) : null;
    });
    const [prices, setPrices] = useState(() => {
        const raw = localStorage.getItem("kakao_prices");
        return raw ? JSON.parse(raw) : initialPrices;
    });
    const [transactions, setTransactions] = useState(() => {
        const raw = localStorage.getItem("kakao_trx");
        return raw ? JSON.parse(raw) : sampleTransactions;
    });
    const [activeTrxId, setActiveTrxId] = useState(generateTrxId());

    useEffect(() => {
        localStorage.setItem("kakao_prices", JSON.stringify(prices));
    }, [prices]);
    useEffect(() => {
        localStorage.setItem("kakao_trx", JSON.stringify(transactions));
    }, [transactions]);
    useEffect(() => {
        if (user) localStorage.setItem("kakao_user", JSON.stringify(user));
        else localStorage.removeItem("kakao_user");
    }, [user]);

    const login = (username) => {
        setUser({
            username,
            name: username === "admin" ? "Operator Admin" : username,
            role: username === "admin" ? "Administrator" : "Operator",
            loginAt: new Date().toISOString(),
        });
    };
    const logout = () => setUser(null);

    const addTransaction = (trx) => {
        setTransactions((prev) => [trx, ...prev]);
        setActiveTrxId(generateTrxId());
    };

    return (
        <AppContext.Provider
            value={{
                user,
                login,
                logout,
                prices,
                setPrices,
                transactions,
                addTransaction,
                activeTrxId,
                setActiveTrxId,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
