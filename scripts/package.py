#!/usr/bin/env python3
"""Package a built CLI with committed source without publishing."""
import argparse
import hashlib
import pathlib
import shutil
import subprocess
import tarfile
import tempfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--platform', required=True, choices=['macos-arm64', 'linux-x86_64'])
    parser.add_argument('--binary', type=pathlib.Path, default=pathlib.Path('target/release/canharbor'))
    args = parser.parse_args()
    root = pathlib.Path(__file__).resolve().parents[1]
    if subprocess.check_output(['git', 'status', '--porcelain', '--untracked-files=normal'], cwd=root):
        parser.error('Package from a clean checkout so source matches the binary.')
    binary = args.binary.resolve()
    if not binary.is_file():
        parser.error('Build the release CLI first.')
    revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
    destination = root / 'dist/packages'
    destination.mkdir(parents=True, exist_ok=True)
    name = f'canharbor-{revision[:12]}-{args.platform}'
    with tempfile.TemporaryDirectory() as temporary:
        folder = pathlib.Path(temporary) / name
        folder.mkdir()
        shutil.copy2(binary, folder / 'canharbor')
        for item in ['LICENSE', 'THIRD_PARTY_NOTICES', 'LICENSES']:
            source = root / item
            if source.is_dir():
                shutil.copytree(source, folder / item)
            else:
                shutil.copy2(source, folder / item)
        (folder / 'START.txt').write_text('Run ./canharbor serve --open\n\nDefault: two simulated channels. Hardware compatibility is unverified.\n'
            'This binary is unsigned and not notarized.\nSource revision: ' + revision + '\n')
        archive = destination / (name + '.tar.gz')
        with tarfile.open(archive, 'w:gz') as output:
            output.add(folder, arcname=name)
    source_archive = destination / f'canharbor-{revision[:12]}-source.tar.gz'
    subprocess.run(['git', 'archive', '--format=tar.gz', '--prefix=canharbor-source/',
                    '-o', str(source_archive), revision], cwd=root, check=True)
    for archive in [archive, source_archive]:
        with archive.open('rb') as stream:
            digest = hashlib.file_digest(stream, 'sha256').hexdigest()
        archive.with_suffix(archive.suffix + '.sha256').write_text(f'{digest}  {archive.name}\n')
        print(archive)


if __name__ == '__main__':
    main()
