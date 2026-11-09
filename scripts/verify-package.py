#!/usr/bin/env python3
"""Verify packaged archives and smoke-test the extracted native CLI (Python 3.11+)."""
import argparse
import hashlib
import io
import json
import os
import pathlib
import platform
import re
import signal
import struct
import subprocess
import tarfile
import tempfile
import time
import tomllib
import urllib.parse
import urllib.request
from http.cookiejar import CookieJar


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def members(archive):
    entries = archive.getmembers()
    result = {entry.name: entry for entry in entries}
    require(len(result) == len(entries), 'Duplicate archive member names')
    return result


def verify_archives(repository, packages, target, extract):
    revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repository, text=True).strip()
    name = f'canharbor-{revision[:12]}-{target}'
    archives = [name + '.tar.gz', f'canharbor-{revision[:12]}-source.tar.gz']
    expected_files = set(archives + [archive + '.sha256' for archive in archives])
    require({path.name for path in packages.iterdir()} == expected_files,
            'Package directory must contain exactly this revision/platform, source and checksums')
    for filename in archives:
        fields = (packages / (filename + '.sha256')).read_text().split()
        require(len(fields) == 2 and fields[1] == filename
                and re.fullmatch(r'[0-9a-f]{64}', fields[0]), f'Invalid checksum file: {filename}')
        with (packages / filename).open('rb') as stream:
            digest = hashlib.file_digest(stream, 'sha256').hexdigest()
        require(digest == fields[0], f'SHA-256 mismatch: {filename}')

    # Compare all source bytes and modes against the checked-out commit, not
    # just the revision printed in START.txt or a checksum supplied by the packager.
    committed = subprocess.check_output(
        ['git', 'archive', '--format=tar', '--prefix=canharbor-source/', revision], cwd=repository)
    source_files = {}
    with tarfile.open(fileobj=io.BytesIO(committed)) as expected, tarfile.open(packages / archives[1]) as source:
        expected_members, source_members = members(expected), members(source)
        require(expected_members.keys() == source_members.keys(), 'Source archive inventory differs from git')
        for path, entry in expected_members.items():
            actual = source_members[path]
            require((entry.type, entry.mode, entry.linkname) == (actual.type, actual.mode, actual.linkname),
                    f'Source metadata differs from git: {path}')
            if entry.isfile():
                content = source.extractfile(actual).read()
                require(content == expected.extractfile(entry).read(), f'Source content differs from git: {path}')
                source_files[path.removeprefix('canharbor-source/')] = content

    launcher_name = 'Start CANHarbor.command' if target == 'macos-arm64' else 'start-canharbor.sh'
    with tarfile.open(packages / archives[0]) as binary_archive:
        entries = members(binary_archive)
        for path, entry in entries.items():
            parts = pathlib.PurePosixPath(path).parts
            require(parts and parts[0] == name and '..' not in parts
                    and not pathlib.PurePosixPath(path).is_absolute()
                    and (entry.isfile() or entry.isdir()), f'Unsafe binary archive member: {path}')
        for filename in ['canharbor', launcher_name, 'START.txt', 'LICENSE', 'THIRD_PARTY_NOTICES', 'LICENSES']:
            require(f'{name}/{filename}' in entries, f'Missing packaged file: {filename}')
        for filename in ['canharbor', launcher_name]:
            entry = entries[f'{name}/{filename}']
            require(entry.isfile() and entry.mode & 0o111, f'Packaged executable is not executable: {filename}')
        for path, content in source_files.items():
            if path in ['LICENSE', 'THIRD_PARTY_NOTICES'] or path.startswith('LICENSES/'):
                entry = entries.get(f'{name}/{path}')
                require(entry is not None and entry.isfile(), f'Missing packaged license: {path}')
                require(binary_archive.extractfile(entry).read() == content, f'Packaged license differs: {path}')
        start = binary_archive.extractfile(entries[f'{name}/START.txt']).read().decode()
        require(f'Source revision: {revision}\n' in start, 'START.txt source revision mismatch')
        header = binary_archive.extractfile(entries[f'{name}/canharbor']).read(64)
        if target == 'linux-x86_64':
            require(len(header) >= 20 and header[:6] == b'\x7fELF\x02\x01'
                    and struct.unpack_from('<H', header, 18)[0] == 62, 'Expected an ELF64 x86-64 binary')
        else:
            require(len(header) >= 8 and struct.unpack_from('<II', header) == (0xfeedfacf, 0x0100000c),
                    'Expected a Mach-O ARM64 binary')
        binary_archive.extractall(extract, filter='data')
    version = tomllib.loads(source_files['Cargo.toml'].decode())['workspace']['package']['version']
    folder = extract / name
    subprocess.run(['sh', '-n', str(folder / launcher_name)], check=True, timeout=10)
    return folder, launcher_name, version, revision


def cleanup(process):
    if process is not None and process.poll() is None:
        process.kill()
        process.communicate(timeout=10)


def smoke(folder, launcher_name, version, runtime):
    binary = str(folder / 'canharbor')
    env = {**os.environ, 'TMPDIR': str(runtime)}
    service = listener = None
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}),
                                        urllib.request.HTTPCookieProcessor(CookieJar()))

    def cli(*args):
        result = subprocess.run([binary, *args], env=env, capture_output=True, text=True, timeout=20)
        require(result.returncode == 0, f'CLI {args} exited {result.returncode}: {result.stderr}')
        return result.stdout

    def get(path):
        with opener.open(origin + path, timeout=10) as response:
            require(response.status == 200, f'HTTP {path}: {response.status}')
            return response.read()

    with tempfile.TemporaryFile(mode='w+') as log:
        try:
            service = subprocess.Popen([binary, 'serve', '--port', '0'], env=env,
                                       stdout=log, stderr=log)
            deadline = time.monotonic() + 30
            origin = None
            while time.monotonic() < deadline:
                log.seek(0)
                output = log.read()
                require(service.poll() is None, f'Packaged service exited before readiness: {output}')
                ready = re.search(r'local service ready at (http://127\.0\.0\.1:\d+)', output)
                if ready:
                    origin = ready.group(1)
                    break
                time.sleep(0.05)
            require(origin is not None, 'Packaged service readiness deadline')
            devices = json.loads(cli('devices', '--json'))['devices']
            require(all(device['simulated'] for device in devices), 'Smoke test must use virtual devices only')
            channels = sorted(channel['id'] for device in devices for channel in device['channels'])
            require(channels == ['virtual:0', 'virtual:1'], 'Expected two packaged virtual channels')
            reported = json.loads(get('/api/v1/version'))
            require(reported['version'] == version and reported['web_ui'] is True,
                    'Packaged version or embedded web UI mismatch')
            html = get('/').decode()
            require('CANHarbor' in html, 'Embedded workbench HTML missing')
            assets = re.findall(r'(?:src|href)="(/assets/[A-Za-z0-9_./-]+)"', html)
            require(any(path.endswith('.js') for path in assets) and any(path.endswith('.css') for path in assets),
                    'Embedded JavaScript or CSS missing')
            for path in assets:
                require(len(get(path)) > 100, f'Empty embedded asset: {path}')

            # Exercise the extracted launcher, stubbing only the OS browser
            # opener. Its real CLI must reuse this isolated default service.
            stub = runtime / 'bin'
            stub.mkdir()
            browser = stub / ('open' if platform.system() == 'Darwin' else 'xdg-open')
            browser.write_text('#!/bin/sh\nset -eu\nprintf "%s\\n" "$1" > "$CANHARBOR_SMOKE_OPEN_LOG"\n')
            browser.chmod(0o755)
            link = runtime / 'opened-url'
            result = subprocess.run([str(folder / launcher_name)], cwd='/tmp', timeout=20,
                                    env={**env, 'PATH': str(stub) + os.pathsep + env['PATH'],
                                         'CANHARBOR_SMOKE_OPEN_LOG': str(link)}, capture_output=True, text=True)
            require(result.returncode == 0 and link.is_file(), f'Extracted launcher failed: {result.stderr}')
            url = urllib.parse.urlsplit(link.read_text().strip())
            require(f'{url.scheme}://{url.netloc}' == origin and url.path == '/', 'Launcher did not reuse service')
            codes = urllib.parse.parse_qs(url.fragment).get('pair', [])
            require(len(codes) == 1, 'Launcher did not create a browser pairing link')
            request = urllib.request.Request(origin + '/api/v1/auth/pair',
                      data=json.dumps({'code': codes[0]}).encode(),
                      headers={'Content-Type': 'application/json', 'Origin': origin}, method='POST')
            with opener.open(request, timeout=10) as response:
                paired = json.load(response)
            require(json.loads(get('/api/v1/auth/session'))['client_id'] == paired['client_id'],
                    'Packaged browser pairing did not establish a session')

            listener = subprocess.Popen([binary, 'monitor', '--channel', 'virtual:1', '--listen-only', '--count', '1'],
                                        env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            deadline = time.monotonic() + 20
            while time.monotonic() < deadline:
                require(listener.poll() is None, 'Packaged monitor exited before acquisition')
                sessions = json.loads(cli('session', 'list'))['sessions']
                if any(s['channel_id'] == 'virtual:1' and s['state'] == 'running' for s in sessions):
                    break
                time.sleep(0.05)
            else:
                raise RuntimeError('Packaged monitor readiness deadline')
            cli('send', '--channel', 'virtual:0', '--id', '123', '--data', '01020304', '--active')
            output, error = listener.communicate(timeout=20)
            require(listener.returncode == 0, f'Packaged monitor failed: {error}')
            frames = [json.loads(line) for line in output.splitlines()]
            require(any(frame['type'] == 'frame_received' and frame['frame']['id'] == 291
                        and frame['frame']['data_hex'] == '01020304' for frame in frames),
                    'Packaged virtual exchange did not receive the submitted frame')
            require(json.loads(cli('session', 'list'))['sessions'] == [], 'Smoke test left CAN sessions open')
            service.send_signal(signal.SIGINT)
            require(service.wait(timeout=20) == 0, 'Packaged service did not shut down cleanly')
            require(not (runtime / f'canharbor-{os.geteuid()}' / 'service.sock').exists(),
                    'Packaged service left its socket after shutdown')
        finally:
            cleanup(listener)
            cleanup(service)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--platform', required=True, choices=['macos-arm64', 'linux-x86_64'])
    parser.add_argument('--packages-dir', type=pathlib.Path, default=pathlib.Path('dist/packages'))
    args = parser.parse_args()
    host = (platform.system(), platform.machine())
    expected = ('Darwin', 'arm64') if args.platform == 'macos-arm64' else ('Linux', 'x86_64')
    require(host == expected, f'Run {args.platform} smoke test on its native platform (got {host})')
    repository = pathlib.Path(__file__).resolve().parents[1]
    # A short runtime path avoids the macOS Unix socket limit; extraction under
    # a path containing spaces also verifies the launcher's quoting.
    with tempfile.TemporaryDirectory(prefix='ch-pkg-', dir='/tmp') as temporary:
        runtime = pathlib.Path(temporary)
        extract = runtime / 'extracted with spaces'
        folder, launcher, version, revision = verify_archives(repository, args.packages_dir.resolve(),
                                                              args.platform, extract)
        smoke(folder, launcher, version, runtime)
    print(json.dumps({'platform': args.platform, 'revision': revision, 'checksums': 'verified',
                      'source': 'matches git', 'architecture': 'verified', 'embedded_web': 'verified',
                      'launcher_and_pairing': 'verified', 'virtual_exchange': 'verified', 'shutdown': 'clean'}))


if __name__ == '__main__':
    main()
