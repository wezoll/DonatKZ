#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Test script to verify database initialization"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path.cwd() / "src"))

from config import Config
from database.db_manager import DatabaseManager

print("=" * 60)
print("Initialization of DatabaseManager...")
print("=" * 60)

# Initialize DB
db_manager = DatabaseManager(Config.DONATIONS_DB_FILE)

print(f"[OK] DB file: {Config.DONATIONS_DB_FILE}")
print(f"[OK] DB file exists: {Config.DONATIONS_DB_FILE.exists()}")
print(f"[OK] DB file size: {Config.DONATIONS_DB_FILE.stat().st_size if Config.DONATIONS_DB_FILE.exists() else 0} bytes")
print(f"[OK] Current week: {db_manager.get_current_week()}")
print(f"[OK] All weeks in DB: {db_manager.get_all_weeks()}")

print("=" * 60)
print("[SUCCESS] Database successfully initialized!")
print("=" * 60)
