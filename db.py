import os, json
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
    print('connected to db')

def acquire_cursor(func):
    async def wrap(*args, **kwds):
        for i in range(3):
            try:
                async with conn.cursor() as cur:
                    return await func(cur, *args, **kwds)
            except Exception as e:
                # connect running twice in parallel?
                # pyodbc.Error: ('HY010', '[HY010] [Microsoft][ODBC Driver 13 for SQL Server]Function sequence error (0) (SQLFetch)')
                # AttributeError: 'NoneType' object has no attribute 'cursor'
                await connect()
                err = e
        raise err
    return wrap

########################################################################################################################

@acquire_cursor
async def get_template_names(cur, owner):
    await cur.execute(f"select name from waiver_template where owner=? order by name", owner)
    rows = await cur.fetchall()
    return [row[0] for row in rows]

templates = {}

async def get_template(name):
    try:
        return templates[name]
    except:
        tpl = templates[name] = await _get_template(name)
        return tpl

@acquire_cursor
async def _get_template(cur, name):
    await cur.execute("select id, pdf, config from waiver_template where name = ?", name)
    row = await cur.fetchone()
    return dict(id=row[0], pdf=row[1], config=json.loads(row[2]))

@acquire_cursor
async def create_template(cur, tpl):
    await cur.execute("insert into waiver_template(name, owner, pdf, config) values(?, ?, ?, ?)",
                      tpl['name'], tpl['owner'], tpl["pdf"], tpl["config"])

@acquire_cursor
async def update_template(cur, name, tpl):
    pdfAssign, pdfParam = ("pdf=?,", [tpl["pdf"]]) if tpl["pdf"] else ("", ())
    await cur.execute(f"update waiver_template set name=?, {pdfAssign} config=? where name=? and owner=?",
                      tpl["name"], *pdfParam, tpl["config"], name, tpl["owner"])
    templates.pop(name, None)

########################################################################################################################

@acquire_cursor
async def save_waiver(cur, template, bytes, fields):
    await cur.execute("""
        insert into waiver(template_id, pdf)
        values((select id from waiver_template where name=?), ?)
    """, template, bytes)
    await cur.execute("SELECT @@IDENTITY")
    row = await cur.fetchone()
    waiver_id = row[0]
    for name, value in fields.items():
        await cur.execute("""
            insert into waiver_field(waiver_id, name, value)
            values(?, ?, ?)
        """, waiver_id, name, value)

@acquire_cursor
async def record_use(cur, template, id):
    await cur.execute("""
        update waiver set last_use_date = CURRENT_TIMESTAMP
        where template_id = (select id from waiver_template where name = ?)
          and id = ?
    """, template, id)

@acquire_cursor
async def get_waivers(cur, template, limit=150, **where):
    joins   = '\n'.join(f'''join waiver_field f{i} on f{i}.waiver_id = w.id and f{i}.name = ?'''
                        for i in range(len(where)))
    filters = '\n'.join(f'and f{i}.value = ?' for i in range(len(where)))
    await cur.execute(f"""
        select distinct top (?) w.id, w.last_use_date
        from waiver w
        {joins}
        where w.template_id = (select id from waiver_template where name = ?)
        {filters}
        order by w.last_use_date desc
    """, int(limit), *where, template, *where.values())
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
async def get_submission_pdf(cur, template, id):
    await cur.execute("""
        select pdf from waiver
        where template_id = (select id from waiver_template where name = ?)
          and id = ?
    """, template, id)
    row = await cur.fetchone()
    return row[0]

########################################################################################################################
from datetime import timezone

def to_timestamp(datetime):
    return datetime.replace(tzinfo=timezone.utc).timestamp()