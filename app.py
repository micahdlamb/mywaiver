import os, json
from quart import Quart, jsonify, request, session, send_from_directory
from aiofile import AIOFile

from pathlib import Path
root = Path(__file__).parent

app = Quart(__name__, static_folder='build')
app.secret_key = 'sup3rsp1cy'

configs = {path.stem : json.loads(path.read_text()) for path in (root / 'configs').glob('*.json')}

# API ##################################################################################################################

@app.route('/login', methods=['POST'])
async def login():
    form = await request.form
    session['user'] = form['email'].split("@")[0]
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
    config = configs[waiver]
    email_to = config['pdf'].get('emailTo')
    if (email_to):
        await email_pdf(pdf, email_to)

    return jsonify("great success")

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