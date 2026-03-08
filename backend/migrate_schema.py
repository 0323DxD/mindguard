"""
Ensures all columns from models.py exist in MariaDB.
"""
import pymysql
from database import SQLALCHEMY_DATABASE_URL
import re

# Parse URL: mysql+pymysql://root:1213@localhost:3307/mindguard
match = re.match(r"mysql\+pymysql://(.*?):(.*?)@(.*?):(.*?)/(.*)", SQLALCHEMY_DATABASE_URL)
user, password, host, port, db_name = match.groups()

conn = pymysql.connect(
    host=host,
    port=int(port),
    user=user,
    password=password,
    database=db_name,
    charset="utf8mb4"
)

try:
    cursor = conn.cursor()
    
    # Check current columns
    cursor.execute("DESCRIBE users")
    existing_cols = [row[0] for row in cursor.fetchall()]
    print(f"Existing columns: {existing_cols}")

    # Columns that should exist
    required_cols = {
        "is_primary_admin": "TINYINT(1) NOT NULL DEFAULT 0",
        "trusted_contacts": "VARCHAR(255) NULL",
    }

    for col, definition in required_cols.items():
        if col not in existing_cols:
            print(f"Adding column {col}...")
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {definition}")
            conn.commit()
            print(f"✅ Added {col}")
        else:
            print(f"ℹ️ {col} already exists")

    # Verify again
    cursor.execute("DESCRIBE users")
    print(f"Final columns: {[row[0] for row in cursor.fetchall()]}")

except Exception as e:
    print(f"❌ Error: {e}")
finally:
    conn.close()
