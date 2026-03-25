import json
import urllib.request
import os

files = [
    ("1", "hsk1.json"),
    ("2", "hsk2.json"),
    ("3", "hsk3.json"),
    ("4", "hsk4.json"),
    ("5", "hsk5.json"),
    ("6", "hsk6.json"),
    ("7-9", "hsk7-9.json")
]
base_url = "https://raw.githubusercontent.com/koynoyno/hsk3.0-json/main/"

hsk_data = {}

for level, filename in files:
    url = base_url + filename
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    print(f"Downloading {filename}...")
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            for item in data.get("words", []):
                word = item.get("simplified", "")
                if not word:
                    continue
                pinyin = item.get("pinyin", "")
                meaning = item.get("english", "")
                
                # If word already exists from a lower level, keep the lower level.
                if word not in hsk_data:
                    hsk_data[word] = {
                        "word": word,
                        "pinyin": pinyin,
                        "meaning": meaning,
                        "level": int(level) if level.isdigit() else level
                    }
    except Exception as e:
        print(f"Error fetching {filename}: {e}")

os.makedirs('data', exist_ok=True)
with open('data/hsk.json', 'w', encoding='utf-8') as f:
    json.dump(hsk_data, f, ensure_ascii=False, indent=2)

print(f"Saved {len(hsk_data)} words to data/hsk.json")
