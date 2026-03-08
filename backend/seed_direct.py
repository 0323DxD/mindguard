"""
Direct pymysql seed - bypasses SQLAlchemy model issues.
Run: python seed_direct.py
"""
import pymysql
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

conn = pymysql.connect(
    host="localhost",
    port=3307,
    user="root",
    password="1213",
    database="mindguard",
    charset="utf8mb4"
)

try:
    cursor = conn.cursor()
    
    # Check if admin exists
    cursor.execute("SELECT id, email, role FROM users WHERE email = %s", ("kapeeryu@mindguard.edu.ph",))
    existing = cursor.fetchone()
    
    if existing:
        # Update is_primary_admin and role just in case
        cursor.execute(
            "UPDATE users SET is_primary_admin = 1, role = 'admin' WHERE email = %s",
            ("kapeeryu@mindguard.edu.ph",)
        )
        conn.commit()
        print(f"✅ Admin already exists (id={existing[0]}). Ensured is_primary_admin=1")
    else:
        hashed = pwd_context.hash("kapeeryu123")
        cursor.execute("""
            INSERT INTO users (email, password_hash, role, fullname, is_primary_admin)
            VALUES (%s, %s, %s, %s, %s)
        """, ("kapeeryu@mindguard.edu.ph", hashed, "admin", "Ka-PEER Yu (Primary Admin)", 1))
        conn.commit()
        print("✅ Primary admin created!")
        print("   Email:    kapeeryu@mindguard.edu.ph")
        print("   Password: kapeeryu123")
    
    # Verify
    cursor.execute("SELECT id, email, role, fullname, is_primary_admin FROM users WHERE email = %s", ("kapeeryu@mindguard.edu.ph",))
    row = cursor.fetchone()
    print(f"\n📋 DB Record: id={row[0]}, email={row[1]}, role={row[2]}, name={row[3]}, primary={row[4]}")
    
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    conn.close()
