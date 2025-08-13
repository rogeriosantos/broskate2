import json
import logging
from typing import Dict, List, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket connection manager for real-time communications"""
    
    def __init__(self):
        # Store active connections by user ID
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Store user sessions (websocket -> user_id mapping)
        self.user_sessions: Dict[WebSocket, int] = {}
        # Store subscriptions (user_id -> set of channels)
        self.subscriptions: Dict[int, Set[str]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        
        # Add to active connections
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        
        # Map session
        self.user_sessions[websocket] = user_id
        
        # Initialize subscriptions if not exists
        if user_id not in self.subscriptions:
            self.subscriptions[user_id] = set()
            
        logger.info(f"User {user_id} connected via WebSocket")
        
        # Send initial connection message
        await self.send_personal_message({
            "type": "connection_established",
            "message": "Connected to BroSkate real-time notifications",
            "timestamp": datetime.now().isoformat()
        }, websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        user_id = self.user_sessions.get(websocket)
        if user_id and user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        if websocket in self.user_sessions:
            del self.user_sessions[websocket]
            
        logger.info(f"User {user_id} disconnected from WebSocket")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to send message to websocket: {e}")
            self.disconnect(websocket)
    
    async def send_to_user(self, message: dict, user_id: int):
        """Send a message to all connections of a specific user"""
        if user_id in self.active_connections:
            disconnected_websockets = []
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Failed to send message to user {user_id}: {e}")
                    disconnected_websockets.append(websocket)
            
            # Clean up disconnected websockets
            for ws in disconnected_websockets:
                self.disconnect(ws)
    
    async def broadcast_to_channel(self, message: dict, channel: str):
        """Broadcast a message to all users subscribed to a channel"""
        for user_id, channels in self.subscriptions.items():
            if channel in channels:
                await self.send_to_user(message, user_id)
    
    async def subscribe_to_channel(self, websocket: WebSocket, channel: str):
        """Subscribe a user to a channel"""
        user_id = self.user_sessions.get(websocket)
        if user_id:
            self.subscriptions[user_id].add(channel)
            await self.send_personal_message({
                "type": "subscription_confirmed",
                "channel": channel,
                "message": f"Subscribed to {channel}",
                "timestamp": datetime.now().isoformat()
            }, websocket)
            logger.info(f"User {user_id} subscribed to channel: {channel}")
    
    async def unsubscribe_from_channel(self, websocket: WebSocket, channel: str):
        """Unsubscribe a user from a channel"""
        user_id = self.user_sessions.get(websocket)
        if user_id and channel in self.subscriptions.get(user_id, set()):
            self.subscriptions[user_id].discard(channel)
            await self.send_personal_message({
                "type": "unsubscription_confirmed", 
                "channel": channel,
                "message": f"Unsubscribed from {channel}",
                "timestamp": datetime.now().isoformat()
            }, websocket)
            logger.info(f"User {user_id} unsubscribed from channel: {channel}")
    
    def get_connected_users(self) -> List[int]:
        """Get list of all connected user IDs"""
        return list(self.active_connections.keys())
    
    def is_user_connected(self, user_id: int) -> bool:
        """Check if a user has any active connections"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0
    
    def get_connection_count(self) -> int:
        """Get total number of active connections"""
        return sum(len(connections) for connections in self.active_connections.values())


# Global connection manager instance
manager = ConnectionManager()