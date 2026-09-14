# -*- coding: utf-8 -*-
"""
Linux DO WeCom UI - 本地极速开发热重载服务
运行方式: python scripts/dev.py [端口，默认 8000]
"""

import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
REPO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TARGET_FILE = os.path.join(REPO_DIR, "linuxdo-wecom.user.js")

class DevHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=REPO_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        if self.path.startswith('/mtime'):
            mtime = str(int(os.path.getmtime(TARGET_FILE) * 1000)) if os.path.exists(TARGET_FILE) else "0"
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.end_headers()
            self.wfile.write(mtime.encode('utf-8'))
            return
        super().do_GET()

if __name__ == '__main__':
    server = ThreadingHTTPServer(('0.0.0.0', PORT), DevHandler)
    print(f"==================================================")
    print(f"  Linux DO WeCom UI - 热重载开发服务器已启动")
    print(f"  地址: http://127.0.0.1:{PORT}")
    print(f"  监听文件: {TARGET_FILE}")
    print(f"==================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止。")
