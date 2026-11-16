import os
import sys
import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    print(f"================================================================")
    print(f"  labora. - Sistem Layanan Laboratorium Terpadu")
    print(f"  Web & REST API aktif di: http://{host}:{port}")
    print(f"  Dokumentasi Swagger API: http://{host}:{port}/docs")
    print(f"================================================================")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=True)
