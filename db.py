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
async def get_all_users(cur):
    await cur.execute("select distinct owner from waiver_template")
    rows = await cur.fetchall()
    return [row[0] for row in rows if row[0]]

########################################################################################################################

@acquire_cursor
async def get_template_names(cur, owner):
    await cur.execute("select name, json_value(config, '$.title') as title "
                      "from waiver_template where owner=? order by title", owner)
    rows = await cur.fetchall()
    return [[row[0], row[1]] for row in rows]

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
async def get_template_image(cur, id):
    await cur.execute("select bytes from waiver_template_image where id = ?", id)
    row = await cur.fetchone()
    return row[0]

@acquire_cursor
async def create_template(cur, tpl):
    config = await _store_images(cur, tpl["name"], tpl["config"])
    await cur.execute("insert into waiver_template(name, owner, pdf, config) values(?, ?, ?, ?)",
                      tpl['name'], tpl['owner'], tpl["pdf"], config)

@acquire_cursor
async def update_template(cur, name, tpl):
    config = await _store_images(cur, tpl["name"], tpl["config"])
    pdfAssign, pdfParam = ("pdf=?,", [tpl["pdf"]]) if tpl["pdf"] else ("", ())
    await cur.execute(f"""
        update waiver_template set name=?, {pdfAssign} config=?
        where name=? and (owner = '' or owner=?)
    """, tpl["name"], *pdfParam, config, name, tpl["owner"])
    templates.pop(name, None)

async def _store_images(cur, template, config):
    import re, uuid, base64
    ids = []
    new = {}
    def sub(match):
        url = match.group(1)
        if url.startswith("data:"):
            id = str(uuid.uuid4())
            bytes = base64.b64decode(url.split(",")[-1])
            new[id] = bytes
        else:
            id = url.rsplit("/", 1)[-1]
        ids.append(id)
        return f'"src":"/img/{id}"'

    config = re.sub('"src":"(.*?)"', sub, config)

    await cur.execute(f"""
        delete from waiver_template_image
        where template_id = (select id from waiver_template where name=?)
          and id not in (''{',?'*len(ids)})
    """, template, *ids)

    for id, bytes in new.items():
        await cur.execute("""
            insert into waiver_template_image(id, template_id, bytes)
            values(?, (select id from waiver_template where name=?), ?)
        """, id, template, bytes)

    return config

########################################################################################################################

@acquire_cursor
async def submit(cur, template, bytes, fields):
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
async def get_submissions(cur, template, limit=100, **where):
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
    return await _fetchall_waivers(cur)

@acquire_cursor
async def search_submissions(cur, template, query, limit=100):
    await cur.execute("""
        select distinct top (?) w.id, w.last_use_date
        from waiver w
        join waiver_field f on w.id = f.waiver_id
        where w.template_id = (select id from waiver_template where name = ?)
          and f.value like ?
        order by w.last_use_date desc
    """, int(limit), template, query)
    return await _fetchall_waivers(cur)

async def _fetchall_waivers(cur):
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

@acquire_cursor
async def record_use(cur, template, waiver_id):
    await cur.execute("""
        update waiver set last_use_date = CURRENT_TIMESTAMP
        where template_id = (select id from waiver_template where name = ?)
          and id = ?
    """, template, waiver_id)

@acquire_cursor
async def get_use_counts(cur, template, group_by):
    if group_by == 'day':
        group_by = "format(u.timestamp, 'yyyy-MM-dd')"
        from_date = "format(getDate() - 14, 'yyyy-MM-dd')"
    elif group_by == 'month':
        group_by = "format(u.timestamp, 'yyyy-MM')"
        from_date = "format(getDate() - 365, 'yyyy-MM-01')"

    elif group_by == 'year':
        group_by = "FORMAT(u.timestamp, 'yyyy')"
        from_date = "format(getDate() - 1095, 'yyyy-01-01')"

    await cur.execute(f"""
        select {group_by} as group_by, count(*) as count 
        from waiver_use u
        join waiver w on u.waiver_id = w.id
        where w.template_id = (select id from waiver_template where name = ?)
          and u.timestamp > {from_date}
        group by {group_by}
        order by group_by asc
    """, template)
    rows = await cur.fetchall()
    return [*zip(*rows)]

########################################################################################################################
from datetime import timezone

def to_timestamp(datetime):
    return datetime.replace(tzinfo=timezone.utc).timestamp()