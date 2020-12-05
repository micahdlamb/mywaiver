import os
import aioodbc, pyodbc

async def connect():
    global conn
    conn = await aioodbc.connect(dsn=f"""
        DRIVER={os.environ['db_driver']};
        SERVER=medfairprice.database.windows.net;
        DATABASE=medfairprice;
        UID={os.environ['db_uid']};
        PWD={os.environ['db_pwd']};
    """)
    print('connected to db')

def acquire_cursor(func):
    async def wrap(*args, **kwds):
        for i in range(3):
            try:
                async with conn.cursor() as cur:
                    return await func(cur, *args, **kwds)
            except pyodbc.ProgrammingError as e:
                await connect()
                err = e
        raise err
    return wrap

########################################################################################################################

@acquire_cursor
async def save_waiver(cur, template_id, bytes, fields):
    await cur.execute("""
        insert into waiver(waiver_template_id, pdf_bytes)
        values(?, ?)
    """, template_id, bytes)
    await cur.execute("SELECT @@IDENTITY")
    row = await cur.fetchone()
    waiver_id = row[0]
    for name, value in fields.items():
        await cur.execute("""
            insert into waiver_field(waiver_id, name, value)
            values(?, ?, ?)
        """, waiver_id, name, value)

@acquire_cursor
async def record_use(cur, template_id, id):
    await cur.execute("""
        update waiver set last_use_date = CURRENT_TIMESTAMP where waiver_template_id = ? and waiver_id = ?
    """, template_id, id)

@acquire_cursor
async def get_waivers(cur, template_id, limit=150, **where):
    joins   = '\n'.join(f'''join waiver_field f{i} on f{i}.waiver_id = w.waiver_id and f{i}.name = ?'''
                        for i in range(len(where)))
    filters = '\n'.join(f'and f{i}.value = ?' for i in range(len(where)))
    await cur.execute(f"""
        select distinct top (?) w.waiver_id, w.last_use_date
        from waiver w
        {joins}
        where w.waiver_template_id = ?
        {filters}
        order by w.last_use_date desc
    """, limit, *where, template_id, *where.values())
    waivers = [dict(id=row[0], last_use_date=to_timestamp(row[1])) for row in await cur.fetchall()]
    for waiver in waivers:
        await cur.execute("""
            select name, value
            from waiver_field
            where waiver_id = ?
        """, waiver['id'])
        waiver['values'] = {row[0] : row[1] for row in await cur.fetchall()}
    return waivers

@acquire_cursor
async def get_pdf(cur, template_id, id):
    await cur.execute("""
        select pdf_bytes from waiver where waiver_template_id = ? and waiver_id = ?
    """, template_id, id)
    row = await cur.fetchone()
    return row[0]

########################################################################################################################
from datetime import timezone

def to_timestamp(datetime):
    return datetime.replace(tzinfo=timezone.utc).timestamp()