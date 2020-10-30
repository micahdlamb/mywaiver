import os, functools, collections
from quart import Quart, jsonify, url_for, request, send_from_directory, redirect, session, abort
import requests_async as requests
from aiofile import AIOFile

from pathlib import Path
root = Path(__file__).parent

app = Quart(__name__, static_folder='build')
app.secret_key = 'sup3rsp1cy'

# API ##################################################################################################################

@app.route('/config', methods=['GET'])
async def get_config():
    return await send_from_directory(root, "config.json", cache_timeout=-1)

@app.route('/config', methods=['POST'])
async def save_config():
    json = await request.get_data()
    async with AIOFile(root / "config.json", 'w') as f:
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