import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const client = axios.create({ baseURL: API });

client.interceptors.request.use((cfg) => {
    const token = localStorage.getItem("kakao_token");
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

// Auth
export const apiLogin = (email, password) =>
    client.post("/auth/login", { email, password }).then((r) => r.data);
export const apiRegister = (data) =>
    client.post("/auth/register", data).then((r) => r.data);
export const apiMe = () => client.get("/auth/me").then((r) => r.data);

// Settings (prices)
export const apiGetPrices = () =>
    client.get("/settings/prices").then((r) => r.data);
export const apiUpdatePrices = (prices) =>
    client.put("/settings/prices", prices).then((r) => r.data);

// Analysis
export const apiAnalyzeImage = (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return client
        .post("/analyze/image", fd, {
            headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data);
};
export const apiAnalyzeFuzzy = (payload) =>
    client.post("/analyze/fuzzy", payload).then((r) => r.data);

// Camera (Pi only)
export const apiCapture = () =>
    client.post("/camera/capture").then((r) => r.data);

// Transactions
export const apiListTransactions = () =>
    client.get("/transactions").then((r) => r.data);
export const apiCreateTransaction = (payload) =>
    client.post("/transactions", payload).then((r) => r.data);
export const apiBulkDeleteTransactions = (ids) =>
    client.post("/transactions/bulk-delete", { ids }).then((r) => r.data);

// Device status (ESP/MQTT/Camera)
export const apiDeviceStatus = () =>
    client.get("/device/status").then((r) => r.data);

// WebSocket sensor stream
export const openSensorSocket = (onMessage) => {
    const wsUrl = `${process.env.REACT_APP_BACKEND_URL.replace(
        /^http/,
        "ws"
    )}/api/ws/sensor`;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (e) => {
        try {
            const data = JSON.parse(e.data);
            onMessage(data);
        } catch {
            // ignore non-JSON
        }
    };
    return ws;
};

export const API_BASE = API;