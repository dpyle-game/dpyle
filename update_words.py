# Sphinx parsing from https://github.com/Rapptz/RoboDanny/blob/rewrite/cogs/api.py
# This file is licensed under MPL 2.0 (see `update_words_license`)

import datetime
import requests
import os
import io
import zlib
import re
import random
import json

class SphinxObjectFileReader:
    BUFSIZE = 16 * 1024

    def __init__(self, buffer):
        self.stream = io.BytesIO(buffer)

    def readline(self):
        return self.stream.readline().decode('utf-8')

    def skipline(self):
        self.stream.readline()

    def read_compressed_chunks(self):
        decompressor = zlib.decompressobj()
        while True:
            chunk = self.stream.read(self.BUFSIZE)
            if len(chunk) == 0:
                break
            yield decompressor.decompress(chunk)
        yield decompressor.flush()

    def read_compressed_lines(self):
        buf = b''
        for chunk in self.read_compressed_chunks():
            buf += chunk
            pos = buf.find(b'\n')
            while pos != -1:
                yield buf[:pos].decode('utf-8')
                buf = buf[pos + 1:]
                pos = buf.find(b'\n')


def parse_object_inv(stream, url):
    result = {}

    inv_version = stream.readline().rstrip()
    if inv_version != '# Sphinx inventory version 2':
        raise RuntimeError('Invalid objects.inv file version.')

    projname = stream.readline().rstrip()[11:]
    version = stream.readline().rstrip()[11:]

    line = stream.readline()
    if 'zlib' not in line:
        raise RuntimeError('Invalid objects.inv file, not z-lib compatible.')

    entry_regex = re.compile(r'(?x)(.+?)\s+(\S*:\S*)\s+(-?\d+)\s+(\S+)\s+(.*)')
    for line in stream.read_compressed_lines():
        match = entry_regex.match(line.rstrip())
        if not match:
            continue

        name, directive, prio, location, dispname = match.groups()
        domain, _, subdirective = directive.partition(':')
        if directive == 'py:module' and name in result:
            continue

        if directive == 'std:doc':
            subdirective = 'label'

        if location.endswith('$'):
            location = location[:-1] + name

        key = name if dispname == '-' else dispname
        prefix = f'{subdirective}:' if domain == 'std' else ''

        if projname == 'discord.py':
            key = key.replace('discord.ext.commands.', '').replace('discord.', '')

        result[f'{prefix}{key}'] = os.path.join(url, location)

    return result

key = "master"
page = "https://discordpy.readthedocs.io/en/master"
resp = requests.get(page + "/objects.inv")
stream = SphinxObjectFileReader(resp.content)
obj = parse_object_inv(stream, page)

words = set()
for x in obj.keys():
    for r in x.lower().rsplit("."):
        if all(c.isalpha() or c == "_" for c in r):
            words.add(r)

if __name__ == "__main__":
    words_to_write = []
    prefix = "const answers = "
    with open("data.js", "r+") as f:
        current = eval(f.read().removeprefix(prefix))
        day = (datetime.datetime.utcnow() - datetime.datetime(2022, 3, 23)).days
        past = current[:day+1]
        words_to_write.extend(past)
        words -= set(past)
        word_list = list(words)
        random.shuffle(word_list)
        words_to_write.extend(word_list)
        f.seek(0)
        f.truncate()
        f.write(prefix)
        json.dump(words_to_write, f)
        f.write("\n")
