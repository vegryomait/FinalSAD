"""
Script untuk membuat 14 tabel dan mengisi data awal ke Neon Database.
Cara pakai:
    python seed_remote.py "postgresql://..."
"""
import sys
import os

def main():
    if len(sys.argv) > 1:
        db_url = sys.argv[1].strip()
    else:
        db_url = os.getenv("DATABASE_URL", "").strip()

    if not db_url:
        print("\n[ERROR] DATABASE_URL tidak ditemukan!")
        print("Silakan jalankan dengan argumen:")
        print('    .\\.venv\\Scripts\\python.exe seed_remote.py "postgresql://user:password@ep-xxx...neon.tech/neondb?sslmode=require"')
        sys.exit(1)

    # Normalize postgres:// to postgresql://
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    print(f"\n[1/3] Menghubungkan ke Neon PostgreSQL...")
    print(f"Target host: {db_url.split('@')[-1] if '@' in db_url else 'hidden'}")

    os.environ["DATABASE_URL"] = db_url

    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(db_url, pool_pre_ping=True)
        with engine.connect() as conn:
            res = conn.execute(text("SELECT version();")).scalar()
            print(f"[OK] Terhubung ke PostgreSQL: {res[:40]}...")
    except Exception as e:
        print(f"\n[GAGAL] Tidak dapat terhubung ke database Neon:")
        print(f"Error: {e}")
        print("\nTips: Pastikan connection string lengkap dan memiliki '?sslmode=require' di belakangnya.")
        sys.exit(1)

    print("\n[2/3] Membuat 14 tabel relasional...")
    try:
        from backend.app.models import Base
        Base.metadata.create_all(bind=engine)
        print("[OK] 14 tabel relasional berhasil dibuat!")
    except Exception as e:
        print(f"\n[GAGAL] Error saat membuat tabel: {e}")
        sys.exit(1)

    print("\n[3/3] Mengisi data demo (users, ruangan, alat, jadwal, peminjaman)...")
    try:
        from sqlalchemy.orm import sessionmaker
        from backend.app import seed
        seed.engine = engine
        seed.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        seed.seed_database()
        print("[OK] Data demo berhasil di-seed!")
    except Exception as e:
        print(f"\n[GAGAL] Error saat seeding data: {e}")
        sys.exit(1)

    print("\n" + "="*50)
    print("SELESAI! Database Neon sekarang sudah memiliki 14 tabel dan siap dipakai.")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
