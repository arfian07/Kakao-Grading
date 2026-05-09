import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Settings from "./pages/Settings";
import { Toaster } from "sonner";

function App() {
    return (
        <div className="App">
            <AppProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route element={<Layout />}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/history" element={<History />} />
                            <Route path="/settings" element={<Settings />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
                <Toaster
                    position="top-center"
                    theme="dark"
                    toastOptions={{
                        style: {
                            background: "hsl(229 44% 9%)",
                            border: "1px solid hsl(229 35% 18%)",
                            color: "hsl(227 67% 94%)",
                            fontSize: "12px",
                        },
                    }}
                />
            </AppProvider>
        </div>
    );
}

export default App;
