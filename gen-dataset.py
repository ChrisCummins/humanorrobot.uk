#!/usr/bin/env python3
#
# Generate the dataset
#
import argparse
import json
import cgi
import math
import os
import re
import shutil
import sqlite3
import sys

from random import randrange
from functools import partial
from hashlib import md5
from multiprocessing import cpu_count,Pool
from subprocess import Popen,PIPE,STDOUT
from tempfile import NamedTemporaryFile

def get_samples(in_path, num_samples=300):
    samples = []
    sample_lines = 10
    with open(in_path) as infile:
        txt = infile.read()
        lines = txt.split('\n')
        for i in range(num_samples):
            i = randrange(0, len(lines) - sample_lines)
            extract = '<br/>'.join([cgi.escape(x.strip()) for x in
                                    lines[i:i + sample_lines]])
            samples.append(extract)
    return samples


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input_txt", help="path to training data")
    # parser.add_argument("checkpoint", help="path to checkpoint file")
    args = parser.parse_args()

    num_extracts = 300
    extract_lines = 10

    extracts = { 'human': get_samples(args.input_txt) }

    robot_names = ['alpha', 'bravo', 'charlie', 'delta']
    for path in sorted(os.listdir('samples')):
        robot_extracts = get_samples(os.path.join('samples', path))
        extracts[robot_names.pop(0)] = robot_extracts

    with open('dataset.js', 'w') as out:
        out.write('const Extracts = ')
        out.write(json.dumps(extracts, indent=2, separators=(',', ': ')))

if __name__ == '__main__':
    main()
