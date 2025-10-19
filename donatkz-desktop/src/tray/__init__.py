"""System Tray module for Windows tray integration"""
from .tray_manager import TrayManager
from .phone_link_monitor import PhoneLinkMonitor

__all__ = ["TrayManager", "PhoneLinkMonitor"]

