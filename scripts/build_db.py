import sqlite3
import json
import os
import sys

def main():
    db_dir = os.path.join(os.path.dirname(__file__), '..', 'assets', 'db')
    os.makedirs(db_dir, exist_ok=True)
    db_path = os.path.join(db_dir, 'hanzi.db')

    # Connect to SQLite (creates if not exists)
    if os.path.exists(db_path):
        os.remove(db_path) # Fresh start

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create tables
    cursor.execute('''
    CREATE TABLE dictionary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        traditional TEXT,
        simplified TEXT,
        pinyin TEXT,
        meanings TEXT
    )
    ''')

    cursor.execute('''
    CREATE TABLE graphics (
        character TEXT PRIMARY KEY,
        strokes TEXT,
        medians TEXT,
        radical TEXT,
        decomposition TEXT
    )
    ''')

    cursor.execute('''
    CREATE TABLE hsk (
        word TEXT PRIMARY KEY,
        pinyin TEXT,
        meaning TEXT,
        level INTEGER
    )
    ''')

    # Load and insert cedict
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    
    with open(os.path.join(data_dir, 'cedict.json'), 'r', encoding='utf-8') as f:
        cedict_data = json.load(f)
        
    dict_records = []
    for entry in cedict_data:
        meanings_str = json.dumps(entry.get('meanings', []), ensure_ascii=False)
        dict_records.append((
            entry.get('traditional', ''),
            entry.get('simplified', ''),
            entry.get('pinyin', ''),
            meanings_str
        ))
    cursor.executemany(
        'INSERT INTO dictionary (traditional, simplified, pinyin, meanings) VALUES (?, ?, ?, ?)',
        dict_records
    )
    print(f"Inserted {len(dict_records)} records into dictionary.")

    # Load and insert graphics
    with open(os.path.join(data_dir, 'hanzi_graphics.json'), 'r', encoding='utf-8') as f:
        graphics_data = json.load(f)
    
    graph_records = []
    for char, data in graphics_data.items():
        strokes_str = json.dumps(data.get('strokes', []), ensure_ascii=False)
        medians_str = json.dumps(data.get('medians', []), ensure_ascii=False)
        graph_records.append((
            char,
            strokes_str,
            medians_str,
            data.get('radical', ''),
            data.get('decomposition', '')
        ))
    cursor.executemany(
        'INSERT INTO graphics (character, strokes, medians, radical, decomposition) VALUES (?, ?, ?, ?, ?)',
        graph_records
    )
    print(f"Inserted {len(graph_records)} records into graphics.")

    # Load and insert HSK
    with open(os.path.join(data_dir, 'hsk.json'), 'r', encoding='utf-8') as f:
        hsk_data = json.load(f)

    # hsk_data is a dict where keys are words, or it might be a list. Let's handle both.
    hsk_records = []
    if isinstance(hsk_data, dict):
        hsk_items = hsk_data.values()
    else:
        hsk_items = hsk_data

    for item in hsk_items:
        hsk_records.append((
            item.get('word', ''),
            item.get('pinyin', ''),
            item.get('meaning', ''),
            item.get('level', 0)
        ))
    cursor.executemany(
        'INSERT OR IGNORE INTO hsk (word, pinyin, meaning, level) VALUES (?, ?, ?, ?)',
        hsk_records
    )
    print(f"Inserted {len(hsk_records)} records into hsk.")

    # Create indexes
    print("Creating indexes...")
    cursor.execute('CREATE INDEX idx_dict_simplified ON dictionary(simplified);')
    cursor.execute('CREATE INDEX idx_dict_traditional ON dictionary(traditional);')
    cursor.execute('CREATE INDEX idx_dict_pinyin ON dictionary(pinyin);')
    cursor.execute('CREATE INDEX idx_hsk_level ON hsk(level);')
    cursor.execute('CREATE INDEX idx_graphics_radical ON graphics(radical);')

    conn.commit()
    conn.close()

    # Get file size
    db_size = os.path.getsize(db_path)
    print(f"Database size: {db_size / (1024*1024):.2f} MB")

if __name__ == '__main__':
    main()
