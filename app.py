import os, functools, collections
from quart import Quart, jsonify, url_for, request, send_from_directory, redirect, session, abort
import requests_async as requests
from aiofile import AIOFile

from pathlib import Path
root = Path(__file__).parent

app = Quart(__name__, static_folder='build')
app.secret_key = 'sup3rsp1cy'

configs = [file.stem for file in (root / 'configs').glob('*.json')]

# API ##################################################################################################################

@app.route('/configs', methods=['GET'])
async def get_configs():
    return jsonify(configs)

@app.route('/config/<waiver>', methods=['GET'])
async def get_config(waiver):
    return await send_from_directory(root / 'configs', f"{waiver}.json", cache_timeout=-1)

@app.route('/config/<waiver>', methods=['POST'])
async def save_config(waiver):
    json = await request.get_data()
    async with AIOFile(root / 'configs' / f"{waiver}.json", 'w') as f:
        await f.write(json)

    return jsonify("great success")

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