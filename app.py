import os, json
from quart import Quart, jsonify, request, session, send_from_directory, make_response
from aiofile import AIOFile
import httpx; http = httpx.AsyncClient()
import db

from pathlib import Path
root = Path(__file__).parent

app = Quart(__name__, static_folder='build')
app.secret_key = 'sup3rsp1cy'
app.before_serving(db.connect)

configs = {path.stem : json.loads(path.read_text()) for path in (root / 'configs').glob('*.json')}

# API ##################################################################################################################

@app.route('/login', methods=['POST'])
async def login():
    form = await request.form
    token = form['token']
    resp = await http.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}")
    user = resp.json()
    session['user'] = user['email']
    return jsonify("great success")

@app.route('/logout', methods=['POST'])
def logout():
    del session['user']
    return jsonify("great success")

@app.route('/get_user', methods=['GET'])
def get_user():
    return jsonify(session.get("user"))

@app.route('/get_configs', methods=['GET'])
async def get_configs():
    return jsonify([waiver for waiver, config in configs.items() if config.get('owner') == session.get('user')])

@app.route('/<waiver>/get_config', methods=['GET'])
async def get_config(waiver):
    return await send_from_directory(root / 'configs', f"{waiver}.json", cache_timeout=-1)

@app.route('/<waiver>/save_config', methods=['POST'])
async def save_config(waiver):
    json = await request.get_data()
    async with AIOFile(root / 'configs' / f"{waiver}.json", 'w') as f:
        await f.write(json)

    return jsonify("great success")

@app.route('/<waiver>/submit', methods=['POST'])
async def submit_waiver(waiver):
    files = await request.files
    pdf = files['pdf'].read()
    form = await request.form
    config = configs[waiver]
    await db.save_waiver(config['id'], pdf, form)
    email_to = config['pdf'].get('emailTo')
    if (email_to):
        await email_pdf(pdf, email_to)

    return jsonify("great success")

@app.route('/<waiver>/<id>/record_use', methods=['POST'])
async def record_use(waiver, id):
    config = configs[waiver]
    await db.record_use(config['id'], id)
    return jsonify("great success")

@app.route('/<waiver>/get_submissions', methods=['GET'])
async def get_waivers(waiver):
    config = configs[waiver]
    return jsonify(await db.get_waivers(config['id'], **request.args))

@app.route('/<waiver>/<id>/download')
async def download_pdf(waiver, id):
    config = configs[waiver]
    pdf = await db.get_pdf(config['id'], id)
    resp = await make_response(pdf)
    resp.headers.set('Content-Type', 'application/pdf')
    resp.headers.set('Content-Disposition', 'inline', filename=f'{waiver}-{id}.pdf')
    return resp

async def email_pdf(pdf, to):
    import aiosmtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.application import MIMEApplication

    msg = MIMEMultipart()
    msg['Subject'] = "Signed Waiver"

    part = MIMEApplication(pdf, _subtype='pdf')
    part.add_header('Content-Disposition', 'attachment; filename="waiver.pdf"')
    msg.attach(part)

    async with aiosmtplib.SMTP('smtp.gmail.com', 587) as server:
        await server.starttls()
        await server.login(os.environ['from_email'], os.environ['gmail_app_password'])
        await server.send_message(msg, os.environ['from_email'], to.split())

# Serve React App ######################################################################################################

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
async def serve(path):
    if path and (Path(app.static_folder) / path).exists():
        return await send_from_directory(app.static_folder, path)
    else:
        return await send_from_directory(app.static_folder, 'index.html')

# Run ##################################################################################################################

if 'HOST' in os.environ:
    from hypercorn.middleware import HTTPToHTTPSRedirectMiddleware
    redirected_app = HTTPToHTTPSRedirectMiddleware(app, os.environ['HOST'])

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True)