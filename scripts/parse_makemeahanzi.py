import json
import os

GRAPHICS_FILE = 'scripts/data/graphics.txt'
DICTIONARY_FILE = 'scripts/data/dictionary.txt'
OUTPUT_FILE = 'scripts/data/hanzi_graphics.json'

def main():
    result = {}

    print(f"Parsing {GRAPHICS_FILE}...")
    with open(GRAPHICS_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip(): continue
            data = json.loads(line.strip())
            char = data.get('character')
            if char:
                result[char] = {
                    'strokes': data.get('strokes', []),
                    'medians': data.get('medians', []),
                    'radical': None,
                    'decomposition': None
                }

    print(f"Parsing {DICTIONARY_FILE}...")
    with open(DICTIONARY_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip(): continue
            data = json.loads(line.strip())
            char = data.get('character')
            if char and char in result:
                result[char]['radical'] = data.get('radical')
                result[char]['decomposition'] = data.get('decomposition')

    print(f"Writing to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, separators=(',', ':'))

    print(f"Successfully processed {len(result)} characters.")

if __name__ == '__main__':
    main()
