"""
Run this once to:
1. Add missing columns to MariaDB (is_primary_admin if missing)
2. Create the primary admin account

Usage: python seed_admin.py
"""
from sqlalchemy import text
from database import SessionLocal, engine
import models
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def migrate_and_seed():
    db = SessionLocal()
    try:
        # Step 1: Add is_primary_admin column if it doesn't exist
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'users'
                AND COLUMN_NAME = 'is_primary_admin'
            """))
            col_exists = result.scalar()

        if not col_exists:
            with engine.connect() as conn:
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN is_primary_admin BOOLEAN NOT NULL DEFAULT FALSE"
                ))
                conn.commit()
            print("✅ Added column: is_primary_admin")
        else:
            print("ℹ️  Column is_primary_admin already exists.")

        # Step 2: Run create_all to handle any other new tables/columns
        models.Base.metadata.create_all(bind=engine)

        # Step 3: Create primary admin if not exists
        existing = db.query(models.User).filter(
            models.User.email == "kapeeryu@mindguard.edu.ph"
        ).first()

        if existing:
            # Make sure is_primary_admin is True
            existing.is_primary_admin = True
            db.commit()
            print("✅ Primary admin already exists — ensured is_primary_admin=True")
        else:
            admin = models.User(
                email="kapeeryu@mindguard.edu.ph",
                password_hash=pwd_context.hash("kapeeryu123"),
                role="admin",
                fullname="Ka-PEER Yu (Primary Admin)",
                student_id=None,
                program=None,
                is_primary_admin=True,
                trusted_contacts=None,
            )
            db.add(admin)
            db.commit()
            print("✅ Primary admin created successfully!")
            print("   Email:    kapeeryu@mindguard.edu.ph")
            print("   Password: kapeeryu123")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_and_seed()
