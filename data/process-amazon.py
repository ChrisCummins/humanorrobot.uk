#!/usr/bin/env python3
#
# Extract and format the JSON review files from the Amazon dataset:
#
#     http://jmcauley.ucsd.edu/data/amazon/
#
import json

from argparse import ArgumentParser

def score2txt(score):
    return str(score) + ' / 5.0'

def json2review(data):
    # Ignore empty reviews
    if len(data['reviewText']) < 10:
        raise KeyError("foo")

    return (
        score2txt(data['overall']) + '\n' +
        data['summary'] + '\n' +
        'By ' + data['reviewerName'] + '\n\n' +
        data['reviewText']
    )

def main():
    parser = ArgumentParser()
    parser.add_argument('input', help='path to input JSON')
    parser.add_argument('output', help='path to output file')
    parser.add_argument('-n', type=int, default=100000,
                        help='number of entries')
    args = parser.parse_args()

    input_path = args.input
    output_path = args.output
    num_entries = args.n

    with open(input_path) as infile:
        data = infile.read()
        lines = data.split('\n')
        lines = lines[:num_entries]
        data = '[' + ',\n'.join(lines) + ']'
        obj = json.loads(data)

        txt = []
        for i,x in enumerate(obj):
            try:
                txt.append(json2review(x))
            except KeyError as e:
                print('error with line', i)

        with open(output_path, 'w') as outfile:
            outfile.write('\n\n**********\n\n'.join(txt))

    print('done')


if __name__ == '__main__':
    main()
