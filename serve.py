#!/usr/bin/env python3
"""
Dev-only static server with HTTP Range support.

Python's built-in `python -m http.server` ignores the Range header and always
returns the full file with 200 OK. That's harmless for HTML/CSS/JS/JSON, but
Safari's <video> element requires a real 206 Partial Content response to play
media at all — without it, Video1.mp4 plays in Chrome and silently fails (or
never starts) in Safari.

This is a drop-in replacement: same usage, adds Range support.

    python serve.py [port]      (defaults to 8000)

Not part of the shipped site — this is local tooling only, same category as
choosing python -m http.server, XAMPP or VS Code Live Server to preview the
site. No dependency beyond the Python standard library.
"""
import sys
import re
from http.server import HTTPServer, SimpleHTTPRequestHandler


class RangeRequestHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path)
        range_header = self.headers.get('Range')

        if not range_header or not (path and self._is_file(path)):
            return super().send_head()

        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None

        file_size = self._file_size(path)
        match = re.match(r'bytes=(\d*)-(\d*)', range_header)
        if not match:
            f.close()
            return super().send_head()

        start_s, end_s = match.groups()
        start = int(start_s) if start_s else 0
        end = int(end_s) if end_s else file_size - 1
        end = min(end, file_size - 1)

        if start >= file_size or start > end:
            f.close()
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{file_size}')
            self.end_headers()
            return None

        self.send_response(206)
        self.send_header('Content-type', self.guess_type(path))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()

        f.seek(start)
        self._range_start, self._range_end = start, end
        return f

    def copyfile(self, source, outputfile):
        if not hasattr(self, '_range_start'):
            return super().copyfile(source, outputfile)
        remaining = self._range_end - self._range_start + 1
        chunk = 64 * 1024
        while remaining > 0:
            data = source.read(min(chunk, remaining))
            if not data:
                break
            outputfile.write(data)
            remaining -= len(data)

    def end_headers(self):
        if not self.headers.get('Range'):
            self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    @staticmethod
    def _is_file(path):
        import os
        return os.path.isfile(path)

    @staticmethod
    def _file_size(path):
        import os
        return os.path.getsize(path)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    server = HTTPServer(('127.0.0.1', port), RangeRequestHandler)
    print(f'Serving on http://127.0.0.1:{port}  (Ctrl+C to stop)')
    print('Range requests supported — video will play correctly in Safari.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStopped.')
