# PRD — Sistem Grading Biji Kakao IoT Dashboard

## Original Problem
Dashboard real-time klasifikasi mutu & estimasi harga biji kakao berbasis IoT
untuk Raspberry Pi 4B + layar sentuh 7" (800×480), Dark Mode default,
integrasi ESP32 (MQTT) + Arducam 8MP (CSI) + YOLO best.pt + fuzzy logic.

## Stack (BUKAN MOCKUP LAGI)
- **Backend**: FastAPI + SQLAlchemy + PyMySQL/SQLite + gmqtt + scikit-fuzzy + ultralytics + picamera2
- **Frontend**: React 19 + Tailwind + Shadcn + axios + WebSocket client
- **DB target prod**: MySQL/MariaDB di Pi (sesuai 5_database.sql user)
- **DB dev fallback**: SQLite (cloud preview)
- **Realtime**: WS `/api/ws/sensor` ↔ MQTT bridge ↔ ESP32

## Implemented (Feb 9 → May 17, 2026)
### Backend modular (NEW)
- `core/`: config (env loader), database (SQLAlchemy engine)
- `db_models/tables.py`: ORM persis matching `5_database.sql` (devices, transactions, image_analyses, fuzzy_results, settings, users, password_reset_tokens, sessions) + kolom tambahan `good_beans` & `black_beans` di image_analyses untuk YOLO 4-class
- `models/schemas.py`: Pydantic request/response
- `routers/auth.py`: register/login/me (JWT bcrypt)
- `routers/settings.py`: GET/PUT `/api/settings/prices` (auto-seed)
- `routers/analyze.py`: image upload, analyze-path, fuzzy compute
- `routers/camera.py`: `/api/camera/capture` (picamera2 lazy)
- `routers/transactions.py`: CRUD composite (3 tabel join)
- `routers/ws.py`: WebSocket bridge + device status
- `services/fuzzy_service.py`: PORT LANGSUNG dari 4_fuzzy_logic.ipynb (2-block control system, membership functions, rules identik)
- `services/vision_service.py`: PORT dari 3_inference_model.ipynb (YOLO, rounded box, area filter, colors)
- `services/camera_service.py`: Picamera2 wrapper
- `services/mqtt_service.py`: gmqtt bridge (port 2_LoadCellWebsocket.py) + WS ConnectionManager
- Static mount `/api/uploads` untuk serve gambar
- Lazy imports + graceful MQTT fallback → backend tetap start tanpa hardware

### Frontend (UPGRADED dari mockup ke real API)
- `lib/api.js`: axios client + WebSocket helper
- `context/AppContext.jsx`: JWT auth + auto-refresh data + live WS weight
- `pages/Login.jsx`: form pakai email (bukan username) + register hit `/api/auth/register`
- `pages/Dashboard.jsx`: Flow real — Capture(picamera2) → Analisis Citra(YOLO) → Fuzzy → Simpan(DB)
- `pages/History.jsx`: Load dari `/api/transactions`, struct sesuai backend response
- `pages/Settings.jsx`: Pakai `/api/settings/prices`, save persist ke DB
- `Topbar.jsx`: Status ESP32/MQTT live dari `/api/device/status` (poll 5s)

### Test Backend (semua PASS)
- ✅ register/login/me JWT
- ✅ get/put prices
- ✅ fuzzy: weight=121, total=120, moldy=3, black=9, defective=7 → Mutu III, fuzzy=0.149 (match notebook user)
- ✅ create transaction → 3 tabel terisi
- ✅ list transactions

## Test Credentials
`admin@kakao.id` / `admin123` (atau register baru via UI)

## Deferred (User akan handle saat deploy di Pi)
- ⏳ Install `ultralytics`, `opencv-python-headless`, `picamera2` di Pi (di-comment di requirements.txt)
- ⏳ Salin `best.pt` ke `/app/backend/ml_models/best.pt`
- ⏳ Set `DATABASE_URL=mysql+pymysql://...` di .env
- ⏳ Run `mysql kakao < 5_database.sql`
- ⏳ Flash ESP32 dengan `1_LoadCellMQTT.ino`

## Files Map for User
| User file | Diintegrasikan ke |
|---|---|
| `1_LoadCellMQTT.ino` | Tetap flash ke ESP32 (config IP/SSID) |
| `2_LoadCellWebsocket.py` | Sudah diport ke `services/mqtt_service.py` + `routers/ws.py` |
| `3_inference_model.ipynb` | Sudah diport ke `services/vision_service.py` |
| `4_fuzzy_logic.ipynb` | Sudah diport ke `services/fuzzy_service.py` |
| `5_database.sql` | Sudah jadi ORM di `db_models/tables.py` |

## Backlog
- P1: Cache YOLO model di startup (sekarang lazy on first request)
- P1: Endpoint export CSV/PDF laporan
- P2: Auth middleware enforce di semua endpoint (sekarang public kecuali /me)
- P2: Per-user transactions filter
- P2: WebSocket reconnect strategy di frontend
