import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum

logger = logging.getLogger(__name__)


class NotificationType(str, Enum):
    """Types of notifications"""
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    EVENT_INVITE = "event_invite"
    SHOP_UPDATE = "shop_update"
    USER_FOLLOW = "user_follow"
    SPOT_UPDATE = "spot_update"
    MESSAGE = "message"


class NotificationService:
    """Service for managing real-time notifications"""
    
    def __init__(self):
        # In-memory storage for demo (in production, use database)
        self.notifications: Dict[int, List[dict]] = {}  # user_id -> notifications
        self.read_notifications: Dict[int, set] = {}    # user_id -> set of read notification IDs
    
    async def send_notification(
        self,
        user_id: int,
        notification_type: str,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        sender_id: Optional[int] = None,
        persistent: bool = True
    ) -> str:
        """Send a notification to a user"""
        
        from app.websocket.connection_manager import manager
        
        # Generate unique notification ID
        notification_id = f"notif_{datetime.now().timestamp()}_{user_id}"
        
        notification = {
            "id": notification_id,
            "type": notification_type,
            "title": title,
            "message": message,
            "data": data or {},
            "sender_id": sender_id,
            "timestamp": datetime.now().isoformat(),
            "read": False
        }
        
        # Store notification if persistent
        if persistent:
            if user_id not in self.notifications:
                self.notifications[user_id] = []
            self.notifications[user_id].append(notification)
            
            # Keep only last 100 notifications per user
            if len(self.notifications[user_id]) > 100:
                self.notifications[user_id] = self.notifications[user_id][-100:]
        
        # Send via WebSocket if user is connected
        if manager.is_user_connected(user_id):
            await manager.send_to_user({
                "type": "notification",
                **notification
            }, user_id)
            logger.info(f"Sent real-time notification to user {user_id}: {title}")
        else:
            logger.info(f"User {user_id} offline, notification stored: {title}")
        
        return notification_id
    
    async def send_event_notification(self, event_data: dict, attendee_ids: List[int]):
        """Send event-related notifications to attendees"""
        
        title = f"Event Update: {event_data.get('title', 'Skate Event')}"
        message = f"Event on {event_data.get('date', 'TBD')} has been updated"
        
        for user_id in attendee_ids:
            await self.send_notification(
                user_id=user_id,
                notification_type=NotificationType.EVENT_INVITE,
                title=title,
                message=message,
                data={
                    "event_id": event_data.get("id"),
                    "action": "event_updated"
                }
            )
    
    async def send_follow_notification(self, follower_id: int, followed_user_id: int, follower_username: str):
        """Send notification when someone follows a user"""
        
        await self.send_notification(
            user_id=followed_user_id,
            notification_type=NotificationType.USER_FOLLOW,
            title="New Follower",
            message=f"{follower_username} started following you!",
            data={
                "follower_id": follower_id,
                "action": "user_followed"
            },
            sender_id=follower_id
        )
    
    async def send_spot_notification(self, spot_data: dict, nearby_user_ids: List[int]):
        """Send spot-related notifications to nearby users"""
        
        title = f"New Spot: {spot_data.get('name', 'Skate Spot')}"
        message = f"A new skate spot was added near you!"
        
        for user_id in nearby_user_ids:
            await self.send_notification(
                user_id=user_id,
                notification_type=NotificationType.SPOT_UPDATE,
                title=title,
                message=message,
                data={
                    "spot_id": spot_data.get("id"),
                    "action": "spot_created"
                }
            )
    
    async def send_shop_notification(self, shop_data: dict, member_ids: List[int]):
        """Send shop-related notifications to members"""
        
        title = f"Shop Update: {shop_data.get('name', 'Skate Shop')}"
        message = shop_data.get('announcement', 'New update from your shop!')
        
        for user_id in member_ids:
            await self.send_notification(
                user_id=user_id,
                notification_type=NotificationType.SHOP_UPDATE,
                title=title,
                message=message,
                data={
                    "shop_id": shop_data.get("id"),
                    "action": "shop_updated"
                }
            )
    
    async def get_notifications(self, user_id: int, limit: int = 50) -> List[dict]:
        """Get notifications for a user"""
        
        user_notifications = self.notifications.get(user_id, [])
        read_notifications = self.read_notifications.get(user_id, set())
        
        # Mark read status
        for notification in user_notifications:
            notification["read"] = notification["id"] in read_notifications
        
        # Return most recent first
        return sorted(user_notifications, key=lambda x: x["timestamp"], reverse=True)[:limit]
    
    async def get_unread_count(self, user_id: int) -> int:
        """Get count of unread notifications for a user"""
        
        user_notifications = self.notifications.get(user_id, [])
        read_notifications = self.read_notifications.get(user_id, set())
        
        unread_count = sum(1 for notif in user_notifications if notif["id"] not in read_notifications)
        return unread_count
    
    async def mark_as_read(self, notification_id: str, user_id: int):
        """Mark a notification as read"""
        
        if user_id not in self.read_notifications:
            self.read_notifications[user_id] = set()
        
        self.read_notifications[user_id].add(notification_id)
        
        # Send updated unread count
        from app.websocket.connection_manager import manager
        
        unread_count = await self.get_unread_count(user_id)
        if manager.is_user_connected(user_id):
            await manager.send_to_user({
                "type": "unread_count_updated",
                "count": unread_count
            }, user_id)
        
        logger.info(f"Notification {notification_id} marked as read for user {user_id}")
    
    async def mark_all_as_read(self, user_id: int):
        """Mark all notifications as read for a user"""
        
        user_notifications = self.notifications.get(user_id, [])
        
        if user_id not in self.read_notifications:
            self.read_notifications[user_id] = set()
        
        for notification in user_notifications:
            self.read_notifications[user_id].add(notification["id"])
        
        # Send updated count
        from app.websocket.connection_manager import manager
        
        if manager.is_user_connected(user_id):
            await manager.send_to_user({
                "type": "unread_count_updated",
                "count": 0
            }, user_id)
        
        logger.info(f"All notifications marked as read for user {user_id}")
    
    async def send_pending_notifications(self, user_id: int):
        """Send any pending notifications when user connects"""
        
        unread_count = await self.get_unread_count(user_id)
        recent_notifications = await self.get_notifications(user_id, limit=10)
        
        from app.websocket.connection_manager import manager
        
        # Send unread count
        await manager.send_to_user({
            "type": "unread_count",
            "count": unread_count
        }, user_id)
        
        # Send recent notifications
        if recent_notifications:
            await manager.send_to_user({
                "type": "recent_notifications",
                "notifications": recent_notifications
            }, user_id)