#!/usr/bin/env python3
"""Point the extension download page at a new EPV release.

extension-download/release.json records what the page currently shows. This script swaps every
one of those values (download URL, file name, version, size, SHA-256) for the new release's
values, then saves the new values back to release.json.

Usage:
  python3 scripts/update-download-page.py --tag v0.2.0 --file epv-0.2.0-extension-chrome.zip \
      --bytes 310000 --sha256 <64 hex chars>
Run by .github/workflows/update-download-page.yml when a release is published.
"""
import argparse
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / 'extension-download' / 'index.html'
STATE = ROOT / 'extension-download' / 'release.json'
REPO_URL = 'https://github.com/KasunRocz-Softwares/EPV-Site'


def values(tag, file, size_bytes, sha256):
    version = tag[1:] if tag.startswith('v') else tag
    return {
        'tag': tag,
        'version': version,
        'file': file,
        'url': f'{REPO_URL}/releases/download/{tag}/{file}',
        'size_kb': round(size_bytes / 1024),
        'sha256': sha256.lower(),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--tag', required=True)
    ap.add_argument('--file', required=True)
    ap.add_argument('--bytes', type=int, required=True)
    ap.add_argument('--sha256', required=True)
    a = ap.parse_args()

    if not re.fullmatch(r'[0-9a-fA-F]{64}', a.sha256):
        sys.exit(f'Not a SHA-256: {a.sha256!r}')

    old = json.loads(STATE.read_text(encoding='utf-8'))
    new = values(a.tag, a.file, a.bytes, a.sha256)
    html = PAGE.read_text(encoding='utf-8')

    # Most specific first: the URL contains the file name, which contains the version.
    swaps = [
        (old['url'], new['url']),
        (old['file'], new['file']),
        (old['sha256'], new['sha256']),
        (f"Download EPV {old['version']}", f"Download EPV {new['version']}"),
        (f"ZIP, {old['size_kb']} KB.", f"ZIP, {new['size_kb']} KB."),
    ]
    for before, after in swaps:
        if before not in html:
            sys.exit(f'The page no longer contains {before!r}; update extension-download/release.json to match the page.')
        html = html.replace(before, after)

    PAGE.write_text(html, encoding='utf-8', newline='\n')
    STATE.write_text(json.dumps(new, indent=2) + '\n', encoding='utf-8', newline='\n')
    changed = old != new
    print(('Updated' if changed else 'Already showing') + f" EPV {new['version']}: {new['file']}, {new['size_kb']} KB, sha256 {new['sha256'][:12]}…")


if __name__ == '__main__':
    main()
