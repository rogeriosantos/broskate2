import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Optional

from app.websocket.connection_manager import manager
from app.utils.auth import get_current_user_ws, get_current_user
from app.websocket.notification_service import NotificationService

router = APIRouter()
logger = logging.getLogger(__name__)

notification_service = NotificationService()


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, token: Optional[str] = Query(None)):
    """Main WebSocket endpoint for real-time communications"""
    
    try:
        # Authenticate user via token
        if not token:
            await websocket.close(code=4001, reason="Authentication token required")
            return
            
        # Verify token and user authorization
        try:
            current_user = await get_current_user_ws(token)
            if not current_user or current_user['id'] != user_id:
                await websocket.close(code=4003, reason="Unauthorized")
                return
        except Exception as e:
            logger.error(f"WebSocket authentication failed: {e}")
            await websocket.close(code=4003, reason="Authentication failed")
            return
        
        # Accept connection
        await manager.connect(websocket, user_id)
        
        # Subscribe to default channels
        await manager.subscribe_to_channel(websocket, f"user_{user_id}")
        await manager.subscribe_to_channel(websocket, "global_notifications")
        
        # Send any pending notifications
        await notification_service.send_pending_notifications(user_id)
        
        try:
            while True:
                # Listen for incoming messages
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                await handle_websocket_message(websocket, user_id, message_data)
                
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for user {user_id}")
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received from user {user_id}")
        except Exception as e:
            logger.error(f"WebSocket error for user {user_id}: {e}")
    
    finally:
        manager.disconnect(websocket)


async def handle_websocket_message(websocket: WebSocket, user_id: int, message_data: dict):
    """Handle incoming WebSocket messages"""
    
    message_type = message_data.get("type")
    
    if message_type == "ping":
        # Respond to ping with pong
        await manager.send_personal_message({
            "type": "pong",
            "timestamp": message_data.get("timestamp")
        }, websocket)
    
    elif message_type == "subscribe":
        # Subscribe to a channel
        channel = message_data.get("channel")
        if channel:
            await manager.subscribe_to_channel(websocket, channel)
    
    elif message_type == "unsubscribe":
        # Unsubscribe from a channel
        channel = message_data.get("channel")
        if channel:
            await manager.unsubscribe_from_channel(websocket, channel)
    
    elif message_type == "mark_notification_read":
        # Mark a notification as read
        notification_id = message_data.get("notification_id")
        if notification_id:
            await notification_service.mark_as_read(notification_id, user_id)
    
    elif message_type == "get_unread_count":
        # Get unread notification count
        count = await notification_service.get_unread_count(user_id)
        await manager.send_personal_message({
            "type": "unread_count",
            "count": count
        }, websocket)
    
    else:
        logger.warning(f"Unknown message type: {message_type} from user {user_id}")


# HTTP endpoints for WebSocket management
@router.get("/connections")
async def get_connection_info(current_user: dict = Depends(get_current_user)):
    """Get WebSocket connection information"""
    return {
        "connected_users": manager.get_connected_users(),
        "total_connections": manager.get_connection_count(),
        "is_connected": manager.is_user_connected(current_user["id"])
    }


@router.post("/broadcast/{channel}")
async def broadcast_to_channel(
    channel: str,
    message: dict,
    current_user: dict = Depends(get_current_user)
):
    """Broadcast a message to a specific channel (admin only)"""
    
    # Add sender information
    broadcast_message = {
        "type": "broadcast",
        "channel": channel,
        "sender_id": current_user["id"],
        "sender_username": current_user["username"],
        "data": message,
        "timestamp": None  # Will be set by notification service
    }
    
    await manager.broadcast_to_channel(broadcast_message, channel)
    
    return {"message": f"Broadcast sent to channel: {channel}"}


@router.post("/notify/{user_id}")
async def send_notification_to_user(
    user_id: int,
    notification: dict,
    current_user: dict = Depends(get_current_user)
):
    """Send a direct notification to a specific user"""
    
    await notification_service.send_notification(
        user_id=user_id,
        notification_type=notification.get("type", "info"),
        title=notification.get("title", "New Notification"),
        message=notification.get("message", ""),
        data=notification.get("data", {}),
        sender_id=current_user["id"]
    )
    
    return {"message": f"Notification sent to user {user_id}"}