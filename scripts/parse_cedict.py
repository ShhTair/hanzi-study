import urllib.request
import zipfile
import os
import json

url = "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.zip"
zip_path = "scripts/data/cedict.zip"
extract_path = "scripts/data"

print("Downloading CC-CEDICT...")
os.makedirs(extract_path, exist_ok=True)
urllib.request.urlretrieve(url, zip_path)

print("Extracting...")
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(extract_path)

print("Parsing...")
dict_path = os.path.join(extract_path, "cedict_ts.u8")
output_path = "scripts/data/cedict.json"
results = []

with open(dict_path, 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith("#"):
            continue
        line = line.strip()
        if not line:
            continue
        
        try:
            hanzi_part, rest = line.split(" [", 1)
            traditional, simplified = hanzi_part.split(" ")
            
            pinyin_part, meanings_part = rest.split("] /", 1)
            pinyin = pinyin_part
            meanings = meanings_part.rstrip("/").split("/")
            
            results.append({
                "traditional": traditional,
                "simplified": simplified,
                "pinyin": pinyin,
                "meanings": meanings
            })
        except Exception as e:
            continue

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Parsed {len(results)} entries into {output_path}")
