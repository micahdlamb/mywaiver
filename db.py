import os
import aioodbc

async def connect():
    global conn
    conn = await aioodbc.connect(dsn=f"""
        DRIVER={os.environ['db_driver']};
        SERVER=medfairprice.database.windows.net;
        DATABASE=medfairprice;
        UID={os.environ['db_uid']};
        PWD={os.environ['db_pwd']};
    """)

async def save_waiver(config, bytes, fields):
    cur = await conn.cursor()
    await cur.execute("""
        insert into waiver(waiver_template_id, pdf_bytes)
        values(?, ?)
    """, config['id'], bytes)
    await cur.execute("SELECT @@IDENTITY")
    row = await cur.fetchone()
    waiver_id = row[0]
    for name, value in fields.items():
        await cur.execute("""
            insert into waiver_field(waiver_id, name, value)
            values(?, ?, ?)
        """, waiver_id, name, value)
    await cur.commit()
