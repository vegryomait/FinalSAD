"""
Vercel Serverless Entry Point - Labora API
==========================================
Digunakan untuk deploy All-in-One ke Vercel.
Vercel membaca file ini sebagai ASGI serverless function.
Static frontend dilayani langsung oleh Vercel CDN dari frontend/dist.
"""
import sys
import os

# Tambahkan root project ke Python path agar bisa import backend.*
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import app dari main.py (sudah handle conditional static files)
from backend.app.main import app  # noqa: F401 — Vercel butuh nama 'app'
