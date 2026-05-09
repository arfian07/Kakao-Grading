import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import { useApp } from "../context/AppContext";

const Layout = () => {
    const { user } = useApp();
    if (!user) return <Navigate to="/login" replace />;

    return (
        <div className="device-shell">
            <div className="device-frame flex flex-col grain">
                <Topbar />
                <main className="flex-1 overflow-hidden relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
