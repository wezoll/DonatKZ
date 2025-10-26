#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Test parser with updated patterns for donations with comments"""
import sys
import os
from pathlib import Path

# Установим UTF-8 для вывода
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

sys.path.insert(0, str(Path.cwd() / 'src'))

from notification.parser import KaspiNotificationParser

parser = KaspiNotificationParser()

test_cases = [
    ("Пополнение: 100 Т\nАспандияр Т.: Рахмет", "Format 1a - with colon"),
    ("Пополнение: 100 Т\nАспандияр Т. Рахмет", "Format 1b - without colon"),
    ("Kaspi.kz Kaspi Gold Пополнение: 100 ₸\nАспандияр Т.", "Format 0 - Kaspi Gold (no comment)"),
    ("Kaspi.kz Kaspi Gold Пополнение: 100 ₸\nАспандияр Т. Рахмет", "Format 0 - Kaspi Gold (with comment)"),
]

print("=" * 70)
print("PARSER TEST - DONATIONS WITH COMMENTS")
print("=" * 70)

for i, (test_text, description) in enumerate(test_cases, 1):
    print(f"\nTest {i}: {description}")
    print(f"  Input: {repr(test_text)}")
    
    result = parser.parse(test_text)
    
    if result:
        print(f"  [OK] SUCCESS")
        print(f"     Sender: {result.sender_name}")
        print(f"     Amount: {result.amount}")
        print(f"     Message: {result.message}")
    else:
        print(f"  [FAILED] Parsing returned None")

print("\n" + "=" * 70)
