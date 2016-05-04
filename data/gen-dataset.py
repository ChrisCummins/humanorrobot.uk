#!/usr/bin/env python3
#
# Get artifacts.
#
import json
import cgi
import math
import os
import re
import shutil
import sqlite3
import sys

from argparse import ArgumentParser
from random import randrange
from functools import partial
from hashlib import md5
from multiprocessing import cpu_count,Pool
from subprocess import Popen,PIPE,STDOUT
from tempfile import NamedTemporaryFile

min_lit_charlen = 300
min_lit_lines = 2
max_lit_charlen = 500
max_lit_lines = 10

def get_lit_kernels(s, n):
    ignored_artifacts_count = 0

    artifacts = []
    lines = s.split('\n')

    samples = [lines]
    while len(artifacts) < n:
        sample_i = randrange(0, len(samples))
        sample = lines

        l = randrange(0, len(lines) - min_lit_lines)

        extract = []
        c = 0
        while (l < len(sample) and
               len(extract) < max_lit_lines and
               c < max_lit_charlen):
            nextline = sample[l]
            c += len(nextline)
            l += 1

            extract.append(nextline)
            if c > max_lit_charlen or l == max_lit_lines:
                break

        if len(extract) > min_lit_lines and c > min_lit_charlen:
            artifacts.append('\n'.join(extract).lstrip())
        else:
            ignored_artifacts_count += 1

        # TODO: split sample
    print('ignored artifacts:', ignored_artifacts_count, file=sys.stderr)

    return artifacts

min_kern_charlen = 100
min_kern_lines = 4
max_kern_charlen = 1000
max_kern_lines = 25

def get_cl_kernels(s, n):
    truncated_artifacts_count = 0
    ignored_artifacts_count = 0

    artifacts = []
    while len(artifacts) < n:
        # trash everything up to first kernel declaration:
        i = s.find('__kernel void')
        if i == -1:
            print('warning: ran out of data after', len(artifacts), 'artifacts',
                  file=sys.stderr)
            break
        s = s[i:]

        i = s.find('{') + 1
        l = 1  # number of lines
        d = 1  # depth
        while i < len(s) and i < max_kern_charlen and l < max_kern_lines and d > 0:
            if s[i] == '{':
                d += 1
            elif s[i] == '}':
                d -= 1
            elif s[i] == '\n':
                l += 1
            i += 1

        kernel = s[:i]

        if i == max_kern_charlen or l == max_kern_lines:
            kernel += '\n/* --- TRUNCATED --- */'
            truncated_artifacts_count += 1

        if l > min_kern_lines and i > min_kern_charlen:
            artifacts.append(kernel)
        else:
            ignored_artifacts_count

        # Pop the kernel from the front of the string.
        s = s[i:]

    print('truncated artifacts:', truncated_artifacts_count, file=sys.stderr)
    print('ignored artifacts:', ignored_artifacts_count, file=sys.stderr)
    return artifacts


def get_artifacts_from_file(inpath, mode="literature", num_artifacts=300):
    print('processing', inpath, '...', file=sys.stderr)
    artifacts = []
    if not os.path.exists(inpath):
        print('File not found:', inpath, file=sys.stderr)
        sys.exit(1)

    with open(inpath, 'r') as infile:
        s = infile.read()

        if mode == "literature":
            artifacts = get_lit_kernels(s, num_artifacts)
        elif mode == "cl":
            artifacts = get_cl_kernels(s, num_artifacts)
        else:
            print('Unrecognised mode', mode, file=sys.stderr)

    for i in range(len(artifacts)):
        artifacts[i] = encode(artifacts[i])

    return artifacts


def get_opencl_game():
    human = get_artifacts_from_file('opencl/human.txt', mode="cl")
    alpha = get_artifacts_from_file('opencl/alpha.txt', mode="cl")
    bravo = get_artifacts_from_file('opencl/bravo.txt', mode="cl")
    charlie = get_artifacts_from_file('opencl/charlie.txt', mode="cl")
    delta = get_artifacts_from_file('opencl/delta.txt', mode="cl")

    data = {
        "name": "Programming: OpenCL kernels",
        "description": "Source code for GPU programming OpenCL kernels",
        "modes": ["nitt", "abt", "rabt"],
        "artifact_type": "code",
        "data_src": "OpenCL code on GitHub",
        "human": { "samples": human },
        "opponents": {
            "alpha": { "samples": alpha },
            "bravo": { "samples": bravo },
            "charlie": { "samples": charlie },
            "delta": { "samples": delta }
        }
    }

    return data


def get_shakespeare_game():
    human = get_artifacts_from_file('shakespeare/human.txt',
                                    mode="literature")
    romeo = get_artifacts_from_file('shakespeare/sample1.txt',
                                    mode="literature")
    juliet = get_artifacts_from_file('shakespeare/sample2.txt',
                                     mode="literature")
    montague = get_artifacts_from_file('shakespeare/sample3.txt',
                                       mode="literature")
    capulet = get_artifacts_from_file('shakespeare/sample4.txt',
                                      mode="literature")

    data = {
        "name": "Literature: Shakespeare",
        "description": "The complete writings of William Shakespeare",
        "modes": ["nitt", "abt", "rabt"],
        "artifact_type": "literature",
        "data_src": "the writings of William Shakespeare",
        "human": { "samples": human },
        "opponents": {
            "Romeo": { "samples": romeo },
            "Juliet": { "samples": juliet },
            "Montague": { "samples": montague },
            "Capulet": { "samples": capulet }
        }
    }

    return data


def encode(s):
    return '<br/>'.join([cgi.escape(x.rstrip()) for x in s.split('\n')])


def obj2json(obj):
    return json.dumps(obj, indent=2, separators=(',', ': '))


def main():
    GameData = {
        "shakespeare": get_shakespeare_game(),
        "opencl": get_opencl_game()
    }
    print('var GameData =', obj2json(GameData))


if __name__ == '__main__':
    main()
