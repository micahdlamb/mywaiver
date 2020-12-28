import os
from quart import Quart, jsonify, request, session, send_from_directory, make_response, url_for, exceptions
import httpx; http = httpx.AsyncClient()
import db

from pathlib import Path
root = Path(__file__).parent

app = Quart(__name__, static_folder='build')
app.secret_key = 'sup3rsp1cy'
app.config['JSON_SORT_KEYS'] = False
app.before_serving(db.connect)

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

# Admin ----------------------------------------------------------------------------------------------------------------

@app.route('/get_all_users', methods=['GET'])
async def get_all_users():
    require_admin()
    return jsonify(await db.get_all_users())

@app.route('/login_as/<user>')
async def login_as(user):
    require_admin()
    session['user'] = user
    return "great success"

def require_admin():
    if session.get('user') != "micah.d.lamb@gmail.com":
        raise exceptions.Unauthorized()

#-----------------------------------------------------------------------------------------------------------------------

@app.route('/get_my_template_names', methods=['GET'])
async def get_my_template_names():
    return jsonify(await db.get_template_names(session['user']))

@app.route('/get_demo_template_names', methods=['GET'])
async def get_demo_template_names():
    return jsonify(await db.get_template_names(''))

@app.route('/<template>/get_template_pdf', methods=['GET'])
async def get_template_pdf(template):
    tpl = await db.get_template(template)
    resp = await make_response(tpl['pdf'])
    resp.headers.set('Content-Type', 'application/pdf')
    resp.headers.set('Content-Disposition', 'inline', filename=f'{template}.pdf')
    return resp

@app.route('/<template>/get_template_config', methods=['GET'])
async def get_template_config(template):
    tpl = await db.get_template(template)
    return jsonify(tpl['config'])

@app.route('/<template>/get_template')
async def get_template(template):
    tpl = await db.get_template(template)
    copy = tpl.copy()
    copy['name'] = template
    copy['pdf'] = url_for('get_template_pdf', template=template)
    return jsonify(copy)

@app.route('/create_template', methods=['POST'])
async def create_template():
    await db.create_template(await _getTemplateFromRequest())
    return jsonify("great success")

@app.route('/<template>/update_template', methods=['POST'])
async def update_template(template):
    await db.update_template(template, await _getTemplateFromRequest())
    return jsonify("great success")

async def _getTemplateFromRequest():
    files = await request.files
    form = await request.form

    return dict(
        owner = session.get('user', ''),
        name = form['name'],
        pdf = files['pdf'].read() if 'pdf' in files else None,
        config = form['config']
    )

#-----------------------------------------------------------------------------------------------------------------------

@app.route('/<template>/submit', methods=['POST'])
async def submit(template):
    files = await request.files
    pdf = files['pdf'].read()
    form = await request.form
    await db.save_waiver(template, pdf, form)

    tpl = await db.get_template(template)
    email_to = tpl['config'].get('emailTo')
    if (email_to):
        await email_pdf(pdf, email_to)

    return jsonify("great success")

@app.route('/<template>/get_submissions', methods=['GET'])
async def get_submissions(template):
    return jsonify(await db.get_waivers(template, **request.args))

@app.route('/<template>/search_submissions', methods=['GET'])
async def search_submissions(template):
    query = request.args.get('query')
    return jsonify(await (db.search_waivers(template, query) if query else db.get_waivers(template)))

@app.route('/<template>/<id>/get_submission_pdf')
async def get_submission_pdf(template, id):
    pdf = await db.get_submission_pdf(template, id)
    resp = await make_response(pdf)
    resp.headers.set('Content-Type', 'application/pdf')
    resp.headers.set('Content-Disposition', 'inline', filename=f'{template}-{id}.pdf')
    return resp

@app.route('/<template>/<id>/record_use', methods=['POST'])
async def record_use(template, id):
    await db.record_use(template, id)
    return jsonify("great success")

#-----------------------------------------------------------------------------------------------------------------------

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
        await server.send_message(msg, os.environ['from_email'], to)

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