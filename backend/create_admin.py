"""
Standalone script to create the primary admin.
Run: python create_admin.py
"""
import pymysql
import bcrypt

password = b"kapeeryu123"
hashed = bcrypt.hashpw(password, bcrypt.gensalt()).decode("utf-8")

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

    # Check if already exists
    cur.execute("SELECT id, email FROM users WHERE email = %s", ("kapeeryu@mindguard.edu.ph",))
    existing = cur.fetchone()

    if existing:
        # Update password hash and ensure primary admin flag
        cur.execute(
            "UPDATE users SET password_hash = %s, role = 'admin', is_primary_admin = 1 WHERE email = %s",
            (hashed, "kapeeryu@mindguard.edu.ph")
        )
        conn.commit()
        print(f"✅ Admin already existed (id={existing[0]}). Password reset + is_primary_admin confirmed.")
    else:
        cur.execute(
            """INSERT INTO users 
               (email, password_hash, role, fullname, is_primary_admin) 
               VALUES (%s, %s, %s, %s, %s)""",
            ("kapeeryu@mindguard.edu.ph", hashed, "admin", "Ka-PEER Yu (Primary Admin)", 1)
        )
        conn.commit()
        print("✅ Primary admin created!")

    print("\n   Email:    kapeeryu@mindguard.edu.ph")
    print("   Password: kapeeryu123")
    print("   Role:     admin")
    print("   Primary:  Yes")

    # Show all users
    cur.execute("SELECT id, email, role, is_primary_admin FROM users")
    rows = cur.fetchall()
    print(f"\n📋 All users in DB ({len(rows)} total):")
    for r in rows:
        print(f"   id={r[0]}, email={r[1]}, role={r[2]}, primary={r[3]}")

except Exception as e:
    print(f"❌ Error: {e}")
    conn.rollback()
finally:
    conn.close()
