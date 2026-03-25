Hanzi Study
Tech Brief & Build Plan
Tair Shaikhadin · 2026
Overview
This document is a technical brief for Hanzi Study — a Chinese character learning app modeled after the philosophy, features, and design quality of Kanji Study by Chase Colburn. The goal is to build the definitive tool for learning Chinese characters (汉字): stroke order, radicals, tones, HSK levels, SRS, writing practice, and a full dictionary — all offline, ad-free, and beautifully crafted.
This brief covers: all available open-source datasets and resources, a full feature map translated from Kanji Study, design philosophy, and a phased build plan.
Open Source Datasets & Resources
The Chinese language learning ecosystem has excellent open-source coverage. Everything needed to build Hanzi Study exists in the public domain or under permissive licenses.
1. Stroke Order & Character Graphics
This is the most critical visual layer of the app — animations showing how to write each character stroke by stroke.
Resource
What it provides
License
Make Me a Hanzi (skishore/makemeahanzi)
SVG stroke data + decomposition for 9,000+ simplified & traditional characters. The gold standard.
Arphic Public License
Hanzi Writer (chanind/hanzi-writer)
JS library built on Make Me a Hanzi. Ready-to-use animations + writing practice quizzes. React Native compatible.
MIT
animCJK (parsimonhi/animCJK)
Animated SVG files for 7,726 simplified + 1,014 traditional characters. Includes all HSK characters.
LGPL
HanziVG (Connum/hanzivg)
KanjiVG-style SVG stroke files adapted for Chinese. Includes radical/component metadata.
CC-BY-SA
Recommended approach: Use Hanzi Writer as the rendering library (it handles animation, writing detection, and canvas interaction out of the box) backed by Make Me a Hanzi data.
2. Dictionary Data
The vocabulary and definition layer — meanings, pinyin, example words, classifiers.
Resource
What it provides
License
CC-CEDICT (mdbg.net)
124,397 entries (as of March 2026). Simplified + traditional + pinyin + English. The EDICT equivalent for Chinese. Updated weekly.
CC BY-SA 4.0
CC-CEDICT Structurizer
Converts CC-CEDICT to clean JSON/CSV/XML. Ready for database import.
MIT
edvardsr/cc-cedict (npm)
Node.js library for querying CC-CEDICT. Handles pinyin case merging, classifiers, variants.
MIT
Unicode Unihan Database
Radical assignments, stroke counts, frequency data, cross-references for all CJK characters.
Free / Unicode Terms
CC-CEDICT is the backbone. It covers the same role that KANJIDIC2 plays in Kanji Study — it's actively maintained, complete, and has a huge community.
3. HSK Level Data (Chinese Proficiency Test)
HSK is the Chinese equivalent of JLPT. The new HSK 3.0 (2021) has 9 levels covering 11,000+ words and 3,000 characters. This is the primary study sequence for the app.
Resource
What it provides
License
drkameleon/complete-hsk-vocabulary
Complete HSK 2.0 + 3.0 vocabulary in JSON. Includes frequency, POS, classifiers, meanings. Split by level (inclusive/exclusive).
MIT
ivankra/hsk30
Cleaned HSK 3.0 CSV with pinyin, POS, traditional variants, writing levels. Cross-referenced with CC-CEDICT.
MIT
krmanik/HSK-3.0
HSK 3.0 PDF OCR'd to text files. Includes hanzi, words, grammar lists for all 9 levels.
Open
clem109/hsk-vocabulary
HSK vocabulary with example sentences in English + Chinese with pinyin.
Open
HSK 3.0 levels map: HSK 1 (300 words), HSK 2 (600), HSK 3 (900), HSK 4 (1,200), HSK 5 (1,500), HSK 6 (2,500), HSK 7-9 (5,000+). Total: ~11,092 words. This is the study backbone — like JLPT N5-N1 in Kanji Study.
4. Example Sentences
Sentences provide context for each character and word — a key feature in Kanji Study.
Resource
What it provides
License
Tatoeba (tatoeba.org)
40,000+ Chinese-English sentence pairs with audio from native speakers. Freely downloadable.
CC BY 2.0
Tatoeba + CC-CEDICT merged
Community-built dataset linking Tatoeba sentences to CC-CEDICT entries. Up to 15 examples per word.
CC BY
5. Audio / Pronunciation
Tone pronunciation is arguably more critical in Chinese than in Japanese — 4 tones + neutral completely change meaning.
Resource
What it provides
License
Microsoft Edge TTS (edge-tts)
High-quality neural TTS for Mandarin. Free API. Voices: zh-CN-XiaoxiaoNeural, zh-CN-YunxiNeural. Can generate audio for all 11k HSK words offline.
Free for non-commercial
MeloTTS (myshell-ai)
Open-source neural TTS, MIT licensed. Mandarin support, deployable on Azure.
MIT
AISHELL-3
85 hours, 218 native speakers, character+pinyin transcripts. For custom model training.
Free non-commercial
eSpeak-NG
Lightweight open-source TTS. Supports Mandarin + pinyin. Good for offline fallback.
GPL
Practical approach: Pre-generate audio files for all HSK vocabulary using edge-tts during build. Bundle with app for offline use. Use MeloTTS on Azure for on-demand generation of non-HSK words.
6. Radicals & Components
Chinese has 214 Kangxi radicals — the building blocks of characters, equivalent to kanji radicals in Kanji Study.
Resource
What it provides
License
Make Me a Hanzi decomposition
Full component tree for each character. Shows which radicals/components make up each hanzi.
Arphic
Unicode Unihan kRSUnicode
Official radical + residual stroke count for all CJK characters. 214 Kangxi radicals.
Free
CJK Decomposition (cjkvi)
Character component breakdown data. 20,000+ characters decomposed.
Public Domain
7. Additional Tools & Libraries
pypinyin (GitHub) — Python library for hanzi→pinyin conversion with tone support. Handles polyphones.
pinyin4j (GitHub) — Java/Android library for pinyin conversion.
jieba (GitHub) — Chinese word segmentation. Splits sentences into words for dictionary lookups.
hanziconv (PyPI) — Simplified ↔ Traditional Chinese conversion.
chinese-frequency-list — Word frequency ranking from large Chinese corpora. Useful for sorting study priority.
Feature Map: Kanji Study → Hanzi Study
Full translation of Kanji Study's features into Chinese equivalents, with notes on implementation complexity.
Core Study Modes
Kanji Study Feature
Hanzi Study Equivalent
Notes
Flashcard study
Flashcard study
Same mechanic. Show: character, pinyin, tones, meaning, radical breakdown, stroke count.
Study ratings (1-5 stars)
Study ratings (1-5 stars)
User assigns confidence rating per character. Filters study queue.
Multiple-choice quiz
Multiple-choice quiz
Quiz on: meaning, pinyin, tone, character recognition.
Writing challenge (stroke detection)
Writing challenge
Most complex feature. Use Hanzi Writer library for stroke detection + canvas.
SRS (Guided Study)
SRS (Guided Study)
Spaced repetition scheduler. Priority add-on. SM-2 algorithm.
Free draw mode
Free draw mode
Canvas to practice writing without feedback.
Stroke order animation
Stroke order animation
Hanzi Writer handles this from Make Me a Hanzi SVG data.
Dictionary & Search
Kanji Study Feature
Hanzi Study Equivalent
Notes
6k+ kanji dictionary
11k+ hanzi/word dictionary
CC-CEDICT provides 124k entries. Filter to most relevant for learners.
Search by reading/meaning/radical
Search by pinyin/meaning/radical/stroke count
Full-text search across CC-CEDICT + Unihan data.
Radical filter
Radical filter (214 Kangxi)
214 Kangxi radicals instead of Japanese radical list.
Example words & compounds
Example words & compounds
CC-CEDICT entries contain compounds. Tatoeba adds example sentences.
Furigana on sentences
Pinyin above characters
Display pinyin with tone marks above each character in sentences.
On/kun readings
Mandarin pinyin + tones
4 tones displayed visually (marks + color coding).
JLPT level badge
HSK level badge (1-9)
HSK 3.0 levels 1-9 replace JLPT N5-N1.
Outlier dictionary add-on
Character etymology (future)
Character origin stories. Can use Outlier's Chinese dictionary if licensed.
Navigation & Organization
Kanji Study Feature
Hanzi Study Equivalent
Notes
JLPT sequence / School grade / Frequency
HSK sequence / Frequency / Stroke count
Primary browse sequences for Chinese learners.
List view / Grid view
List view / Grid view
Same UX pattern.
Custom sets
Custom sets
User-created character lists. Essential for topic-based study.
Favorites
Favorites
Star any character, word, or sentence.
Study calendar
Study calendar
Daily study time tracking heatmap.
Progress by JLPT level
Progress by HSK level
Visual progress bars per HSK level.
350+ tags
Topic tags
Situational vocab: travel, food, tech, medicine, etc.
Chinese-Specific Features (Beyond Kanji Study)
These features are unique to Chinese and have no direct Kanji Study equivalent — they're opportunities to go beyond the source of inspiration:
Tone visualization: Color-code the 4 tones (+ neutral) consistently throughout the app. Tone 1 = blue, Tone 2 = green, Tone 3 = orange, Tone 4 = red. This is a major UX win.
Simplified ↔ Traditional toggle: Let users switch between simplified (mainland) and traditional (Taiwan/HK) characters at the app level.
Pinyin input: Allow searching by pinyin without tone marks (type 'zhong' to find 中).
Measure words (classifiers): CC-CEDICT includes classifier data. Show which measure word goes with each noun.
Chengyu (成语): Four-character idioms. A separate browsable section. 5,000+ entries available in open datasets.
Polyphone handling: Many characters have multiple readings (多音字). Show all readings with context on when to use each.
HSK writing levels: HSK 3.0 specifies which characters require writing vs recognition only. Reflect this in the writing practice module.
Design Philosophy & Visual Style
Chase built Kanji Study with a clear philosophy: depth without clutter. Every screen earns its information density. The app is dark-mode first, uses clean typography, and never wastes screen real estate.
Visual Language to Preserve
Dark theme first: Deep dark background (#1A1A2E or similar). Light mode as option.
Card-based layouts: Each character/word is a self-contained card. Information revealed progressively.
SVG characters rendered crisply: Never use system fonts for character display — always SVG or canvas rendering.
Minimal chrome: No heavy navigation bars, no banners, no ads ever. Content is king.
Consistent color coding: Use color purposefully — for tones, difficulty levels, study ratings.
Generous tap targets: Designed for one-handed mobile use. Buttons are large and well-spaced.
Offline first: All core functionality works without internet. Data bundled with the app.
Tone Color System (New for Chinese)
Implement a consistent tone color system throughout the entire app — on flashcards, in the dictionary, in quizzes, in stroke animations:
Tone 1 (—)
Tone 2 (/)
Tone 3 (∨)
Tone 4 (\)
Blue #4A90E2
Green #5BA85A
Orange #E8A838
Red #D95F45
Typography
UI font: System default (SF Pro on iOS, Roboto on Android)
Character display: SVG from Make Me a Hanzi / Hanzi Writer — never a font
Pinyin font: A clean sans-serif that handles diacritics well (Noto Sans, Source Han Sans)
Size hierarchy: Character large (80-120px canvas), pinyin medium, meaning small
Phased Build Plan
Build in phases. Each phase ships something usable. Don't build everything before releasing.
Phase 1 — Data Foundation (Week 1-2)
No UI. Just data pipeline.
Download and parse CC-CEDICT into SQLite database
Import Make Me a Hanzi dictionary.txt and graphics.txt
Import HSK 3.0 word lists (all 9 levels) with pinyin and meanings
Cross-reference: link each HSK word to CC-CEDICT entry + Make Me a Hanzi stroke data
Pre-generate pinyin audio for all HSK 1-6 vocabulary using edge-tts (~3,600 words)
Build search index: by pinyin, by meaning, by radical, by stroke count
Output: A complete SQLite database with ~11k words, stroke data, audio paths, and HSK levels. This is the foundation everything builds on.
Phase 2 — MVP App (Week 2-4)
React Native (Expo) or Flutter. Just enough to be useful.
Character detail screen: SVG animation, pinyin + tones, meaning, HSK level, radical breakdown
Browse by HSK level: scrollable list/grid of characters
Flashcard study: show character → reveal pinyin + meaning → tap to rate
Basic search: type pinyin or English → get character list
Audio playback for each character and example word
Output: Installable APK/TestFlight build. Show this to Chase.
Phase 3 — Study System (Week 4-7)
Multiple-choice quizzes: 4 modes (meaning, pinyin, tone, character)
Writing challenge: Hanzi Writer integration with stroke detection
Study ratings: assign 1-5 per character, filter by rating
Custom sets: create and name character lists
Favorites system
Study calendar and progress tracking
Phase 4 — Polish & Launch (Week 7-10)
SRS (Guided Study): SM-2 algorithm, daily review scheduling
Full dictionary: all 124k CC-CEDICT entries searchable
Example sentences from Tatoeba with pinyin display
Simplified ↔ Traditional toggle
Dark/light mode
Offline mode verification: everything works on airplane mode
Google Play + App Store submission
Phase 5 — Add-ons (Post-launch)
Chengyu (成语) section: 5,000+ four-character idioms
Graded reading sets (like Kanji Study's add-on)
Cantonese pronunciation support (CC-Canto dataset)
Etymology add-on (partner with Outlier Linguistics)
Recommended Tech Stack
Layer
Choice
Why
Framework
React Native (Expo)
Cross-platform iOS+Android. Huge ecosystem. Good for vibe-coding.
Character rendering
Hanzi Writer (React Native wrapper)
Built on Make Me a Hanzi. Handles animation + stroke detection.
Local database
SQLite via expo-sqlite
Offline first. Fast queries. Bundles with app.
Audio
expo-av
Plays pre-generated .mp3 files bundled in app.
State management
Zustand
Simple, fast, no boilerplate.
Navigation
React Navigation
Standard. Well documented.
Cloud (optional)
Azure (your grant)
Sync, backup, future web version. Not needed for Phase 1-2.
All Resources Quick Reference
GitHub Repositories
skishore/makemeahanzi — SVG stroke order data for 9,000+ characters
chanind/hanzi-writer — JS library for stroke animations + writing practice
parsimonhi/animCJK — Animated SVG files for 7,726 simplified characters
Connum/hanzivg — KanjiVG-style SVG stroke files for Chinese
drkameleon/complete-hsk-vocabulary — Complete HSK 2.0 + 3.0 vocabulary JSON
ivankra/hsk30 — Cleaned HSK 3.0 CSV with full metadata
krmanik/HSK-3.0 — HSK 3.0 all 9 levels, hanzi + words + grammar
clem109/hsk-vocabulary — HSK vocab with example sentences
edvardsr/cc-cedict — Node.js CC-CEDICT query library
SilentByte/cc-cedict-structurizer — CC-CEDICT to JSON/CSV/XML converter
myshell-ai/MeloTTS — Open-source neural TTS for Mandarin (MIT)
Data Downloads
CC-CEDICT Download — 124,397 entries — main dictionary source
Tatoeba Download — Chinese sentence pairs with translations
Unicode Unihan Database — Radical, stroke count, frequency data
Built with intention. Shipped with care. 汉字学习