"""WebSocket endpoint untuk live sensor data + MQTT bridge command."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.mqtt_service import manager, mqtt_bridge

router = APIRouter()


@router.websocket("/ws/sensor")
async def ws_sensor(ws: WebSocket):
    """
    Client (frontend) connect kesini. Akan menerima broadcast data berat
    dari MQTT (kakao/weight/data), dan boleh mengirim perintah text:
    "start" | "stop" | "tare" → diteruskan ke MQTT (kakao/control) → ESP.
    """
    await manager.connect(ws)
    try:
        while True:
            cmd = await ws.receive_text()
            cmd = cmd.strip().lower()
            if cmd in ("start", "stop", "tare"):
                ok = mqtt_bridge.publish_control(cmd)
                await ws.send_text(f'{{"ack":"{cmd}","sent":{str(ok).lower()}}}')
            else:
                await ws.send_text(f'{{"error":"unknown command: {cmd}"}}')
    except WebSocketDisconnect:
        await manager.disconnect(ws)


@router.get("/device/status", tags=["device"])
def device_status():
    """Status ringkas ESP/MQTT/Camera untuk topbar."""
    cam_ready = False
    try:
        from picamera2 import Picamera2  # noqa: F401
        cam_ready = True
    except Exception:
        cam_ready = False

    return {
        "mqtt_connected": mqtt_bridge.connected,
        "esp_online": mqtt_bridge.connected,  # proxy: kalau MQTT konek anggap ESP online
        "camera_ready": cam_ready,
    }
