"""
Seeds the new primary admin account and converts the existing
kapeeryu@mindguard.edu.ph account to staff role.

Run: python seed_new_admin.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine
import models
import bcrypt as _bcrypt

def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode('utf-8'), _bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

models.Base.metadata.create_all(bind=engine)

def run():
    db = SessionLocal()
    try:
        # 1. Convert kapeeryu to staff role
        kapeeryu = db.query(models.User).filter(
            models.User.email == "kapeeryu@mindguard.edu.ph"
        ).first()
        if kapeeryu:
            kapeeryu.role = "staff"
            kapeeryu.is_primary_admin = False
            kapeeryu.program = "Ka-PEER Yu"
            db.commit()
            print("✅ kapeeryu@mindguard.edu.ph role updated to 'staff'")
        else:
            print("⚠️  kapeeryu account not found, creating it...")
            new_staff = models.User(
                email="kapeeryu@mindguard.edu.ph",
                password_hash=hash_password("kapeeryu123"),
                fullname="Ka-PEER Yu Staff",
                role="staff",
                program="Ka-PEER Yu",
                is_primary_admin=False,
            )
            db.add(new_staff)
            db.commit()
            print("✅ kapeeryu@mindguard.edu.ph staff account created")

        # 2. Create new primary admin
        existing_admin = db.query(models.User).filter(
            models.User.email == "adminkapeeryu@edu.ph"
        ).first()

        if existing_admin:
            existing_admin.role = "admin"
            existing_admin.is_primary_admin = True
            existing_admin.password_hash = hash_password("adminpiyu123")
            db.commit()
            print("✅ adminkapeeryu@edu.ph already exists — updated role to admin.")
        else:
            admin = models.User(
                email="adminkapeeryu@edu.ph",
                password_hash=hash_password("adminpiyu123"),
                fullname="MindGuard Administrator",
                role="admin",
                is_primary_admin=True,
                program=None,
                student_id=None,
                trusted_contacts=None,
            )
            db.add(admin)
            db.commit()
            print("✅ New admin account created!")
            print("   Email:    adminkapeeryu@edu.ph")
            print("   Password: adminpiyu123")

        # 3. Verify
        admin_check = db.query(models.User).filter(models.User.email == "adminkapeeryu@edu.ph").first()
        if admin_check:
            pw_ok = verify_password("adminpiyu123", admin_check.password_hash)
            print(f"\n📋 Admin: {admin_check.email} | role={admin_check.role} | pw_verify={'✅ PASS' if pw_ok else '❌ FAIL'}")
        
        staff_check = db.query(models.User).filter(models.User.email == "kapeeryu@mindguard.edu.ph").first()
        if staff_check:
            pw_ok = verify_password("kapeeryu123", staff_check.password_hash)
            print(f"📋 Staff: {staff_check.email} | role={staff_check.role} | pw_verify={'✅ PASS' if pw_ok else '❌ FAIL'}")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        import traceback; traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run()
