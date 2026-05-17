# 🌰 Sistem Grading Biji Kakao IoT — Deployment Guide

Dashboard real-time klasifikasi mutu & estimasi harga biji kakao berbasis IoT
untuk Raspberry Pi 4B + layar sentuh 7" (800×480).

---

## 📦 Stack

- **Backend**: FastAPI (Python 3.11) + SQLAlchemy (MySQL/SQLite)
- **Frontend**: React 19 + Tailwind + Shadcn UI
- **Realtime**: WebSocket (`/api/ws/sensor`) ←→ MQTT bridge (gmqtt)
- **AI/ML**: YOLO (Ultralytics) + scikit-fuzzy
- **Camera**: Picamera2 (Pi CSI Arducam 8MP)

---

## 🗂️ Struktur Backend

```
/app/backend/
├── server.py                  # Entry FastAPI, lifespan startup
├── .env                       # Konfigurasi (DB, MQTT, JWT, YOLO)
├── core/
│   ├── config.py              # Env loader
│   └── database.py            # SQLAlchemy engine + session
├── db_models/tables.py        # ORM (sesuai 5_database.sql)
├── models/schemas.py          # Pydantic request/response
├── routers/
│   ├── auth.py                # /api/auth/{login,register,me}
│   ├── settings.py            # /api/settings/prices
│   ├── analyze.py             # /api/analyze/{image,analyze-path,fuzzy}
│   ├── camera.py              # /api/camera/capture
│   ├── transactions.py        # /api/transactions
│   └── ws.py                  # /api/ws/sensor + /api/device/status
├── services/
│   ├── fuzzy_service.py       # Port dari 4_fuzzy_logic.ipynb
│   ├── vision_service.py      # Port dari 3_inference_model.ipynb (YOLO)
│   ├── camera_service.py      # Picamera2 wrapper
│   └── mqtt_service.py        # MQTT bridge + WebSocket manager
├── ml_models/
│   └── best.pt                # ⚠️ TARUH MODEL ANDA DI SINI
└── uploads/                   # Hasil capture + annotated images
```

---

## 🚀 Deploy di Raspberry Pi 4B (lokal Anda)

### 1. Install system deps
```bash
sudo apt update
sudo apt install -y python3-pip python3-venv python3-picamera2 \
                    libcap-dev libcamera-apps mosquitto mosquitto-clients \
                    libgl1 libglib2.0-0 mariadb-server   # atau mysql-server
```

### 2. Setup MySQL
```bash
sudo mysql -e "CREATE DATABASE kakao CHARACTER SET utf8mb4;"
sudo mysql kakao < 5_database.sql   # file SQL Anda
```

### 3. Backend
```bash
cd /app/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Pi-only:
pip install ultralytics opencv-python-headless
# picamera2 sudah via apt
```

### 4. Edit `.env`
```env
DATABASE_URL=mysql+pymysql://root:PASSWORD@127.0.0.1/kakao
MQTT_BROKER=127.0.0.1          # mosquitto lokal
JWT_SECRET=<generate-random-string-Anda>
```

### 5. Salin model
```bash
cp /path/to/best.pt /app/backend/ml_models/best.pt
```

### 6. Jalankan
```bash
# Backend
cd /app/backend && uvicorn server:app --host 0.0.0.0 --port 8001

# Frontend (dev)
cd /app/frontend && yarn install && yarn start

# Mosquitto sudah jalan sebagai service (sudo systemctl status mosquitto)

# ESP32 — flash 1_LoadCellMQTT.ino dengan SSID/IP broker Anda
```

---

## 🔌 Endpoints

| Method | Path | Body | Catatan |
|---|---|---|---|
| POST | `/api/auth/register` | `{name,email,password,role}` | JWT |
| POST | `/api/auth/login` | `{email,password}` | JWT |
| GET | `/api/auth/me` | — | Bearer |
| GET | `/api/settings/prices` | — | seed default jika kosong |
| PUT | `/api/settings/prices` | `{mutu_1,mutu_2,mutu_3}` | — |
| POST | `/api/camera/capture` | — | trigger Picamera2 |
| POST | `/api/analyze/image` | multipart `file` | upload + YOLO |
| POST | `/api/analyze/analyze-path?path=...` | — | analisis file di server |
| POST | `/api/analyze/fuzzy` | `{weight_g,total_beans,moldy,black,defective}` | grade + harga |
| GET | `/api/transactions` | — | list desc |
| POST | `/api/transactions` | full payload | save composite |
| GET | `/api/device/status` | — | esp/mqtt/cam |
| WS | `/api/ws/sensor` | — | recv broadcast berat; send `start/stop/tare` |

---

## 🧠 Flow Aplikasi (E2E)

1. **Operator login** → JWT disimpan di localStorage frontend
2. ESP32 publish berat → MQTT `kakao/weight/data` → backend bridge → WebSocket → frontend update real-time
3. Operator klik **Mulai** → frontend kirim `start` ke WS → backend publish ke `kakao/control` → ESP konfirmasi
4. Operator **Kunci Berat** → frontend kirim `stop` → freeze nilai
5. Klik **Capture** → backend trigger picamera2 → simpan jpg → return URL
6. Klik **Analisis Citra** → YOLO `best.pt` deteksi 4 class → return count + annotated image
7. Klik **Analisis Kualitas** → backend jalankan fuzzy (block 1: cacat, block 2: mutu) → return grade + harga
8. Klik **Simpan Transaksi** → INSERT ke 3 tabel: `transactions`, `image_analyses`, `fuzzy_results`
9. Reset → siap transaksi berikutnya

---

## 🛠️ Catatan Penting

- `picamera2` & `ultralytics` di-**lazy import**. Backend tetap start meskipun belum terinstall (endpoint terkait akan return 503 dengan pesan jelas).
- MQTT auto-fallback: jika broker tidak reachable saat startup, log warning saja, tidak crash.
- Backend di cloud preview **menggunakan SQLite** (`./kakao.db`) sebagai fallback. Di Pi production, set `DATABASE_URL=mysql+pymysql://...` di `.env`.
- File schema `5_database.sql` Anda tetap berlaku — schema ORM sudah disinkronkan persis dengan tabel `devices`, `transactions`, `image_analyses`, `fuzzy_results`, `settings`, `users`, dll. Kolom tambahan `black_beans` & `good_beans` ditambahkan di `image_analyses` agar match YOLO 4-class.
- CORS dibuka `*` (sesuaikan saat production).

---

## 🔑 Default Credentials (sebelum Anda register sendiri)

Tidak ada user default. Buat lewat:
```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@kakao.id","password":"admin123","role":"Administrator"}'
```

Atau langsung lewat tab **Daftar** di halaman login.
