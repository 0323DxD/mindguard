"""
Fixes admin password by re-hashing it with passlib (same as the login system uses).
Run: python fix_admin_password.py
"""
import pymysql
from passlib.context import CryptContext

# This is exactly what main.py uses
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Generate hash using passlib (compatible with the login endpoint)
hashed = pwd_context.hash("kapeeryu123")

print(f"Generated hash: {hashed[:30]}...")

conn = pymysql.connect(
    host="localhost",
    port=3307,
    user="root",
    password="1213",
    database="mindguard",
    charset="utf8mb4"
)

try:
    cur = conn.cursor()

    # Check if user exists
    cur.execute("SELECT id, email, role FROM users WHERE email = %s", ("kapeeryu@mindguard.edu.ph",))
    existing = cur.fetchone()

    if existing:
        # Update with passlib-compatible hash
        cur.execute(
            "UPDATE users SET password_hash = %s, role = 'admin', is_primary_admin = 1 WHERE email = %s",
            (hashed, "kapeeryu@mindguard.edu.ph")
        )
        conn.commit()
        print(f"✅ Updated password hash for existing admin (id={existing[0]})")
    else:
        # Insert fresh
        cur.execute(
            """INSERT INTO users (email, password_hash, role, fullname, is_primary_admin)
               VALUES (%s, %s, 'admin', 'Ka-PEER Yu (Primary Admin)', 1)""",
            ("kapeeryu@mindguard.edu.ph", hashed)
        )
        conn.commit()
        print(f"✅ Created admin account (rows={cur.rowcount})")

    # Verify result
    cur.execute("SELECT id, email, role, is_primary_admin FROM users WHERE email = %s",
                ("kapeeryu@mindguard.edu.ph",))
    row = cur.fetchone()
    if row:
        print(f"\n📋 DB Record: id={row[0]}, email={row[1]}, role={row[2]}, primary={row[3]}")
        
        # Verify the password will work
        cur.execute("SELECT password_hash FROM users WHERE email = %s", ("kapeeryu@mindguard.edu.ph",))
        stored_hash = cur.fetchone()[0]
        valid = pwd_context.verify("kapeeryu123", stored_hash)
        print(f"🔐 Password verification test: {'✅ PASS' if valid else '❌ FAIL'}")
    else:
        print("❌ User not found after insert!")

except Exception as e:
    print(f"❌ Error: {e}")
    conn.rollback()
finally:
    conn.close()
