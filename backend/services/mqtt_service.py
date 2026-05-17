"""
MQTT bridge service — port dari file #2 (LoadCellWebsocket.py).
- Subscribe topic `kakao/weight/data` dari broker user
- Broadcast ke semua WebSocket client (/api/ws)
- Frontend kirim perintah (start/stop/tare) → publish ke `kakao/control`

Pakai gmqtt (async) seperti notebook user. Auto-reconnect built-in.
Jika broker tidak reachable saat startup, log warning saja tanpa crash.
"""
import asyncio
import logging
from typing import List, Optional
from fastapi import WebSocket

from core.config import MQTT_BROKER, MQTT_PORT, MQTT_TOPIC_DATA, MQTT_TOPIC_CONTROL

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []
        self.lock = asyncio.Lock()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        async with self.lock:
            self.active.append(ws)
        logger.info("WS client connected. Total: %d", len(self.active))

    async def disconnect(self, ws: WebSocket):
        async with self.lock:
            if ws in self.active:
                self.active.remove(ws)
        logger.info("WS client disconnected. Total: %d", len(self.active))

    async def broadcast(self, message: str):
        dead = []
        for c in list(self.active):
            try:
                await c.send_text(message)
            except Exception:
                dead.append(c)
        for d in dead:
            await self.disconnect(d)


manager = ConnectionManager()


class MQTTBridge:
    def __init__(self):
        self.client = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self.connected = False

    async def start(self):
        try:
            from gmqtt import Client as MQTTClient
        except ImportError:
            logger.warning("gmqtt belum terinstall. MQTT bridge dinonaktifkan.")
            return

        self.loop = asyncio.get_event_loop()
        self.client = MQTTClient("FastAPI_Bridge_Client")
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect

        try:
            await asyncio.wait_for(
                self.client.connect(MQTT_BROKER, MQTT_PORT), timeout=5
            )
        except Exception as e:
            logger.warning("MQTT broker %s:%s tidak reachable: %s. "
                           "Bridge tetap berjalan tanpa MQTT (mode dev).",
                           MQTT_BROKER, MQTT_PORT, e)

    def _on_connect(self, client, flags, rc, properties):
        self.connected = True
        logger.info("MQTT connected to %s:%s", MQTT_BROKER, MQTT_PORT)
        client.subscribe(MQTT_TOPIC_DATA)

    def _on_disconnect(self, client, packet, exc=None):
        self.connected = False
        logger.warning("MQTT disconnected")

    def _on_message(self, client, topic, payload, qos, properties):
        try:
            data = payload.decode()
        except Exception:
            return
        logger.debug("MQTT [%s]: %s", topic, data)
        if self.loop and not self.loop.is_closed():
            asyncio.run_coroutine_threadsafe(manager.broadcast(data), self.loop)

    def publish_control(self, command: str) -> bool:
        """Publish perintah start/stop/tare ke ESP."""
        if not self.client or not self.connected:
            logger.warning("MQTT not connected, command '%s' tidak dikirim", command)
            return False
        self.client.publish(MQTT_TOPIC_CONTROL, command)
        logger.info("Published '%s' to %s", command, MQTT_TOPIC_CONTROL)
        return True

    async def stop(self):
        if self.client:
            try:
                await self.client.disconnect()
            except Exception:
                pass


mqtt_bridge = MQTTBridge()
