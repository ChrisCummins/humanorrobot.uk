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

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input_txt", help="path to training data")
    # parser.add_argument("checkpoint", help="path to checkpoint file")
    args = parser.parse_args()

    num_extracts = 300
    extract_lines = 10

    human_extracts = []
    with open(args.input_txt) as infile:
        input_txt = infile.read()
        input_lines = input_txt.split('\n')

        for i in range(num_extracts):
            start_i = randrange(0, len(input_lines) - extract_lines)
            extract = ' '.join([cgi.escape(x) for x in
                                 input_lines[start_i:start_i + extract_lines]])
            human_extracts.append(extract)

    robot_extracts = []
    for path in os.listdir('samples'):
        with open(os.path.join('samples', path)) as infile:
            extract = ' '.join([cgi.escape(x) for x in
                                 infile.read().split('\n')])
            robot_extracts.append(extract)


    with open('dataset.js', 'w') as out:
        out.write('var human_extracts = ')
        out.write(json.dumps(human_extracts, indent=2, separators=(',', ': ')))
        out.write('\nvar robot_extracts = ')
        out.write(json.dumps(robot_extracts, indent=2, separators=(',', ': ')))


if __name__ == '__main__':
    main()
