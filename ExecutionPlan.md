Hanzi Study
Agent Execution Plan
Step-by-step build instructions for autonomous execution
Pair with: HanziStudy_TechBrief.docx
Instructions for the Agent
You have two documents: the Tech Brief (background, datasets, features, design) and this Execution Plan (what to build and in what order). Read both before starting.
Rules:
Complete each phase fully before moving to the next. Do not skip ahead.
At the end of each phase, output a short status summary: what was built, file structure, and any blockers.
If you hit an error or blocker, try to fix it yourself first. If stuck after 3 attempts, document the blocker clearly and move to the next task.
Write clean, commented code. This project will be maintained and iterated on.
Target platform: React Native with Expo. Use TypeScript.
All data must work offline. No runtime API calls for core features.
Never hardcode data. Everything comes from the SQLite database.
1
Data Pipeline — SQLite Database
Est. 2–4 hrs
Start here
Goal: Build the complete data foundation. No UI. Just data scripts and a working database.
1.1 — Project Setup
mkdir hanzi-study && cd hanzi-study
npx create-expo-app@latest . --template blank-typescript
npm install expo-sqlite expo-file-system
mkdir -p scripts/data assets/db assets/audio
1.2 — Download & Parse CC-CEDICT
Download from: https://www.mdbg.net/chinese/dictionary?page=cc-cedict
Parse format: Traditional Simplified [pin1 yin1] /meaning1/meaning2/
# scripts/parse_cedict.py
# Output: cedict.json — array of {traditional, simplified, pinyin, meanings[]}
Validation: should have ~124,000 entries. Log count on completion.
1.3 — Download & Parse Make Me a Hanzi
Download: https://github.com/skishore/makemeahanzi
Files needed: dictionary.txt (meanings/radicals) and graphics.txt (stroke SVG paths)
# scripts/parse_makemeahanzi.py
# Output: hanzi_graphics.json — {character, strokes[], medians[], radical, decomposition}
Validation: should have ~9,000 entries with stroke data.
1.4 — Download & Parse HSK 3.0
Download from: https://github.com/drkameleon/complete-hsk-vocabulary
Import all 9 levels. Each entry needs: simplified, pinyin, meaning, hsk_level, frequency.
# scripts/parse_hsk.py
# Output: hsk_words.json — array of {simplified, pinyin, meaning, level, frequency}
Validation: HSK 1-6 should have ~5,000 words. HSK 7-9 adds ~6,000 more.
1.5 — Build SQLite Database
Merge all three sources into a single hanzi_study.db file. Schema:
CREATE TABLE characters (
  id INTEGER PRIMARY KEY,
  simplified TEXT NOT NULL,
  traditional TEXT,
  pinyin TEXT NOT NULL,
  pinyin_numbered TEXT,
  tone INTEGER,
  meanings TEXT,          -- JSON array
  hsk_level INTEGER,      -- 1-9, NULL if not in HSK
  frequency_rank INTEGER,
  stroke_count INTEGER,
  radical TEXT,
  components TEXT,        -- JSON array from decomposition
  stroke_data TEXT,       -- JSON from Make Me a Hanzi graphics.txt
  audio_path TEXT         -- relative path to .mp3 file
);
CREATE TABLE words (
  id INTEGER PRIMARY KEY,
  simplified TEXT NOT NULL,
  traditional TEXT,
  pinyin TEXT NOT NULL,
  meanings TEXT,          -- JSON array
  hsk_level INTEGER,
  frequency_rank INTEGER,
  classifiers TEXT,       -- JSON array
  audio_path TEXT
);
CREATE TABLE sentences (
  id INTEGER PRIMARY KEY,
  chinese TEXT NOT NULL,
  pinyin TEXT,
  english TEXT NOT NULL,
  source TEXT DEFAULT 'tatoeba'
);
CREATE TABLE user_progress (
  character_id INTEGER,
  rating INTEGER DEFAULT 0,   -- 0=unseen, 1-5=user rating
  is_favorite INTEGER DEFAULT 0,
  last_reviewed TEXT,
  review_count INTEGER DEFAULT 0,
  next_review TEXT            -- for SRS
);
After building: run a coverage check. Log how many HSK words have stroke data, how many have audio, etc.
1.6 — Generate Audio (HSK 1-4 first)
Use edge-tts (pip install edge-tts) to pre-generate .mp3 for HSK 1-4 words (~2,100 words).
# scripts/generate_audio.py
# Voice: zh-CN-XiaoxiaoNeural
# Output: assets/audio/{simplified}.mp3
# Update audio_path in database after generation
Phase 1 Done When:
#
Task
Done when...
1
hanzi_study.db exists with all 4 tables populated
Row counts logged in terminal
2
CC-CEDICT data imported: ~124k words
Query returns correct entry for '你好'
3
Make Me a Hanzi data imported: ~9k characters with stroke JSON
Query for '中' returns stroke path array
4
HSK 3.0 all 9 levels imported: ~11k words
hsk_level field populated correctly
5
Cross-reference complete: each HSK word linked to CC-CEDICT + stroke data
Coverage stats printed
6
Audio generated for HSK 1-4
assets/audio/ folder has .mp3 files
2
App Shell & Navigation
Est. 2–3 hrs
After Phase 1
Goal: A working app that opens, navigates, and can read from the database. No study features yet.
2.1 — Install Dependencies
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install @react-navigation/stack react-native-screens react-native-safe-area-context
npm install zustand @react-native-async-storage/async-storage
npm install react-native-gesture-handler react-native-reanimated
2.2 — App Structure
Create this folder structure:
src/
  navigation/          -- tab and stack navigators
  screens/
    HomeScreen.tsx     -- dashboard with study stats
    BrowseScreen.tsx   -- browse by HSK level or list
    SearchScreen.tsx   -- search characters
    CharacterScreen.tsx -- single character detail
    StudyScreen.tsx    -- flashcard study (Phase 3)
  components/
    CharacterCard.tsx  -- reusable card component
    PinyinText.tsx     -- renders pinyin with tone colors
    StrokeAnimation.tsx -- Hanzi Writer wrapper
  store/
    useAppStore.ts     -- Zustand store
  db/
    database.ts        -- SQLite connection + queries
  constants/
    colors.ts          -- tone colors + theme
2.3 — Tone Color System
Define in src/constants/colors.ts — use throughout the entire app:
export const TONE_COLORS = {
  1: '#4A90E2',  // Tone 1 — flat — Blue
  2: '#5BA85A',  // Tone 2 — rising — Green
  3: '#E8A838',  // Tone 3 — dip — Orange
  4: '#D95F45',  // Tone 4 — falling — Red
  5: '#999999',  // Neutral — Gray
};
2.4 — Database Layer
Build src/db/database.ts with these functions:
initDatabase() — copy .db from assets to document directory, open connection
getCharactersByHSKLevel(level) — returns array of characters for a given HSK level
getCharacterDetail(simplified) — returns full data for one character
searchCharacters(query) — search by pinyin or English meaning
updateProgress(characterId, rating) — update user progress
2.5 — Bottom Tab Navigation
4 tabs: Home (house icon), Browse (grid icon), Search (magnifier icon), Profile (person icon).
Phase 2 Done When:
#
Task
Done when...
1
App launches without errors on Expo Go
No red screen on startup
2
4 tabs navigate correctly
Tapping each tab shows correct screen
3
BrowseScreen lists HSK levels 1-9
Tapping HSK 1 shows ~300 characters
4
SearchScreen returns results for 'zhong'
中 appears in results
5
CharacterScreen shows character + pinyin + meaning
Data comes from SQLite, not hardcoded
6
Tone colors render correctly on PinyinText component
Tone 1 is blue, Tone 4 is red
3
Character Detail Screen
Est. 3–4 hrs
After Phase 2
Goal: The most important screen in the app. When you tap any character, you see everything about it.
3.1 — Install Hanzi Writer
npm install hanzi-writer
For React Native, use a WebView wrapper or the react-native-hanzi-writer package if available.
Alternatively: render SVG paths directly from Make Me a Hanzi stroke data using react-native-svg.
npm install react-native-svg
3.2 — Character Detail Screen Layout
Top section (40% of screen):
Large character display — SVG rendered, not font. Size: ~150px
Pinyin with tone marks, colored by tone
Audio play button — plays pre-generated .mp3
Stroke count badge + HSK level badge
Middle section — scrollable tabs:
Meanings tab: list of definitions from CC-CEDICT, part of speech
Stroke Order tab: animated stroke order using Hanzi Writer. Play/pause/replay controls
Components tab: show radical + component breakdown with tap-to-look-up
Words tab: example compound words containing this character
Sentences tab: 3-5 example sentences from Tatoeba with pinyin
Bottom bar:
Study rating buttons (1-5 stars)
Favorite button (heart)
Practice Writing button — opens writing challenge
3.3 — Stroke Order Animation
Use Make Me a Hanzi graphics.txt stroke data (already in database as JSON).
Build StrokeAnimation component that:
Renders strokes sequentially on a canvas/SVG
Shows stroke number badges
Has Play, Pause, Step-by-step, and Replay controls
Animation speed adjustable
3.4 — Pinyin Display Component
PinyinText component requirements:
Parse numbered pinyin (zhong1) into tone-marked pinyin (zhōng)
Color each syllable by tone using TONE_COLORS
Support display above characters (ruby-style) and standalone
Phase 3 Done When:
#
Task
Done when...
1
Character detail screen opens for any character
No crashes for any of the 9,000 characters
2
Stroke animation plays correctly for '中', '国', '人'
Strokes appear in correct order
3
Audio plays on tap
Sound plays for HSK 1-4 characters
4
Pinyin is colored by tone throughout
First tone is blue, no uncolored pinyin
5
Meaning, stroke, components, words tabs all work
Each tab shows real data from DB
6
Rating and favorite buttons save to user_progress table
Persist across app restarts
4
Flashcard Study Mode
Est. 2–3 hrs
After Phase 3
Goal: The core study loop. User picks an HSK level, studies flashcards, rates each one.
4.1 — Study Session Setup Screen
Before starting, user chooses:
Which HSK level(s) to study
Study direction: Character → Meaning, or Meaning → Character
Filter by rating: All / Unseen only / Low ratings only
Session size: 10 / 20 / 50 / All
4.2 — Flashcard Screen
Front of card (shown first):
Large character (SVG, ~120px)
Stroke count. HSK level badge.
'Tap to reveal' hint text
Back of card (after tap):
Pinyin with tone colors + audio auto-plays
Primary meaning (large), secondary meanings (small)
Radical + component badges
Quick preview of stroke order animation
Rating bar at bottom (after reveal):
5 buttons: Again / Hard / Good / Easy / Known
Maps to ratings 1-5. Tapping advances to next card.
4.3 — Swipe Gestures
Swipe left = Again (rating 1)
Swipe right = Known (rating 5)
Tap = Reveal answer
4.4 — Session Complete Screen
After all cards reviewed: show summary — cards studied, ratings distribution, time spent, streak.
Phase 4 Done When:
#
Task
Done when...
1
Can start a study session for any HSK level
Session loads correct cards from DB
2
Card flips on tap, audio plays on reveal
No lag on flip animation
3
Rating saved to database on button tap
Re-opening app shows correct ratings
4
Swipe gestures work
Left/right swipe rates correctly
5
Session complete screen shows stats
Time, count, ratings shown
5
Writing Practice
Est. 3–5 hrs
After Phase 4
Goal: User writes the character on screen. App detects strokes and gives feedback. This is the hardest phase.
5.1 — Writing Canvas
Build using react-native-svg + PanResponder (or react-native-gesture-handler).
Grey grid background (4 quadrants, like a Chinese writing practice grid)
Semi-transparent character hint shown underneath (fadeable)
User draws strokes with finger
5.2 — Stroke Detection (Two Modes)
Mode A — Self Assessment (easier to build first):
App shows animated stroke order
User writes without automatic checking
After writing: user taps Correct or Wrong themselves
Mode B — Auto Detection (advanced):
Use Hanzi Writer's built-in quiz mode — it handles stroke matching
Each drawn stroke is compared to expected stroke path
Correct strokes snap into place with animation
Incorrect strokes shake and fade
Start with Mode A. Add Mode B after core app is working.
Phase 5 Done When:
#
Task
Done when...
1
Writing canvas opens from character detail screen
Canvas renders with grid background
2
Mode A works: user writes, self-rates
Rating saves to DB
3
Stroke order guide visible (semi-transparent)
Can toggle hint on/off
6
Search, Browse & Polish
Est. 2–3 hrs
After Phase 5
6.1 — Search Screen
Search by pinyin (with or without tone numbers): 'zhong' or 'zhong1' both find 中
Search by English meaning: 'middle' finds 中
Search by radical: tap radical → list all characters with that radical
Filter by HSK level, stroke count, study rating
Recent searches history
6.2 — Browse Screen
Browse by HSK level: tap level → scrollable character grid
Grid shows character + tone-colored pinyin + rating star
Toggle: List view (character + pinyin + meaning) vs Grid view (character only)
Sort by: HSK order / Frequency / Stroke count / Study rating
6.3 — Home/Dashboard Screen
Today's stats: characters reviewed, time studied
Study streak counter
Quick resume: continue last study session
HSK level progress bars: X of Y characters at rating 3+
Study calendar heatmap (last 30 days)
6.4 — Settings Screen
Simplified / Traditional character toggle
Theme: Dark / Light
Audio: auto-play on reveal yes/no
Study session default size
Reset progress option
7
Multiple Choice Quizzes
Est. 2 hrs
After Phase 6
4 quiz modes — all built on same quiz engine:
Character → Meaning: show character, pick correct English meaning from 4 options
Meaning → Character: show English, pick correct character from 4 options
Character → Pinyin: show character, pick correct pinyin (with tone marks) from 4 options
Pinyin → Character: show pinyin, pick correct character from 4 options
Quiz Engine Requirements
Distractors: wrong answers should be plausible (same HSK level, similar meaning or similar-looking character)
Timer per question (optional, toggleable)
Immediate feedback: green highlight correct, red highlight wrong
Wrong answers added to review queue
Session end: score, time, list of missed characters
8
SRS & Final Release Prep
Est. 3–4 hrs
Final phase
8.1 — SRS (Spaced Repetition System)
Implement SM-2 algorithm for Guided Study mode:
After each review, calculate next_review date based on rating and previous interval
Daily review queue: characters due today, sorted by overdue amount
New cards per day: configurable (default 10)
'Due today' badge on home screen
SM-2 formula: next_interval = previous_interval * ease_factor. Ease factor adjusts based on rating.
8.2 — Offline Verification
Test entire app in airplane mode
All characters, audio, stroke animations must work offline
Only feature that needs internet: future cloud sync (not in v1)
8.3 — Performance
App startup: under 3 seconds
Character search: results in under 300ms
Stroke animation: smooth 60fps
Database queries: use indexes on simplified, hsk_level, frequency_rank
CREATE INDEX idx_hsk_level ON characters(hsk_level);
CREATE INDEX idx_simplified ON characters(simplified);
CREATE INDEX idx_frequency ON characters(frequency_rank);
8.4 — Release Checklist
#
Task
Done when...
1
App icon and splash screen created
1024x1024 icon, 2048x2048 splash
2
app.json configured: name, bundle ID, version
com.hanzistudy.app
3
Expo build: eas build --platform android
APK generated without errors
4
Tested on real Android device
No crashes in 30 min session
5
Privacy policy URL added
Required for Play Store
6
Google Play Console: app created, APK uploaded
Internal testing track
Agent: How to Report Progress
After completing each phase, output this summary block before starting the next:
=== PHASE [N] COMPLETE ===
Built: [list of files created/modified]
DB state: [row counts or N/A]
Working: [what you can do in the app now]
Blockers: [anything that needs human input]
Next: Starting Phase [N+1] — [phase name]
=========================
If you hit a blocker you cannot resolve: document it clearly, skip that specific task, and continue with the rest of the phase. Do not stop entirely.
The goal is a working app — not perfect code. Ship first, polish later.
好好学习，天天向上 · Study hard, improve every day