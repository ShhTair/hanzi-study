Hanzi Study
Phase 2: Parallel Agent Tasks
5 agents running in parallel — each owns their files, no conflicts
Reality Check: What's Actually Built
This is an honest audit of the codebase before agents start. Read this before touching anything.
✅  Navigation shell works — 4 tabs with dark theme
✅  Study screen — HSK level picker + flashcard flip + basic SRS save
✅  Character detail — SVG stroke animation with correct scaleY: -1 transform
✅  Search screen — queries DB, shows results, taps navigate to detail
✅  Writing canvas — PanResponder + grid + polyline drawing
✅  SQLiteProvider + hanzi.db copy-on-first-launch
⚠️  index.tsx (Home) is empty — just 'Database loaded and ready.' with no dark theme
⚠️  lists.tsx is an empty stub — just 'Lists Tab' text
⚠️  App.tsx is the default Expo template — unused, entry is expo-router
⚠️  Write canvas hint is broken — transform inside <View> inside <Svg> doesn't work in RN
⚠️  SRS is only 2 states (1 day / 5 min) — not real SM-2
⚠️  No audio anywhere — no expo-av, no .mp3 files
⚠️  No tone colors on pinyin — cardPinyin is flat #4A90E2, not per-tone
⚠️  DB schema conflict: study.tsx queries 'hsk' table, database.ts queries 'characters' table
CRITICAL for all agents: The DB schema conflict must be resolved FIRST by Agent A before anyone else touches DB queries.
MUST READ: Database Schema
The actual hanzi.db has these tables (from how it was built):
Table name
What's in it
characters
Single hanzi — simplified, traditional, pinyin, meanings, hsk_level, stroke_count, radical, stroke_data, frequency_rank
hsk
HSK word list — word, pinyin, meaning, level. May contain multi-character words
hanzi_graphics
Stroke SVG data — character, graphics JSON with strokes[] and medians[]
user_progress
User ratings — word_id, srs_interval, next_review, ease_factor
⚠️  study.tsx uses 'FROM hsk WHERE level = ?' — this is correct for study mode (word lists)
⚠️  character/[char].tsx uses getCharacterDetail() which queries 'characters' table — correct for single char detail
⚠️  write canvas queries 'hanzi_graphics' table — correct
These are THREE separate tables — not a conflict. But agents must use the RIGHT table for each use case. See above.
Agent Assignment Overview
Each agent owns specific files. No agent should touch files owned by another agent.
Agent
Owns
Task
Depends on
A
src/ shared utilities
PinyinText component + tone colors, audio hook, shared constants
None — start first
B
app/(tabs)/index.tsx
Full Home dashboard — stats, streak, HSK progress bars, heatmap
Agent A (useAudio, PinyinText)
C
app/(tabs)/study.tsx
Upgrade SRS to real SM-2, add swipe gestures, session summary screen
Agent A (PinyinText, audio)
D
app/(tabs)/character/[char].tsx
Scrollable tabs (Meanings/Strokes/Components/Words), audio button, favorites
Agent A (PinyinText, audio)
E
app/(tabs)/lists.tsx + write/[char].tsx
Lists screen (HSK browse + custom sets) + fix write canvas hint bug
Agent A (colors constants)
AGENT
A
Shared Utilities — PinyinText, Audio, Constants
Files: src/components/PinyinText.tsx, src/hooks/useAudio.ts, src/constants/colors.ts, src/utils/pinyin.ts
🔴 Start FIRST — others depend on this
This is the foundation everyone else builds on. Complete these before other agents start their screens.
Task A1 — src/constants/colors.ts (already exists, VERIFY and expand)
Confirm these exports exist, add if missing:
export const TONE_COLORS = {
  1: '#4A90E2',  // flat — blue
  2: '#5BA85A',  // rising — green
  3: '#E8A838',  // dip — orange
  4: '#D95F45',  // falling — red
  5: '#999999',  // neutral — gray
};
export const BG = '#121212';
export const CARD = '#1E1E1E';
export const CARD2 = '#2A2A2A';
export const BORDER = '#333333';
export const TEXT = '#FFFFFF';
export const TEXT_DIM = '#888888';
export const ACCENT = '#4A90E2';
Task A2 — src/utils/pinyin.ts (CREATE NEW)
This utility parses numbered pinyin and converts to tone-marked unicode:
Input: 'zhong1 guo2' → Output: ['zhōng', 'guó']
Input: 'hao3' → Output: 'hǎo'
Also extract tone number: getTone('zhong1') → 1
Handle neutral tone (5 or no number) → no mark
Use tone mark lookup tables, not a library. Keep it simple and dependency-free.
Task A3 — src/components/PinyinText.tsx (CREATE NEW)
A component that renders pinyin with tone colors. Used on EVERY screen.
// Usage examples:
<PinyinText pinyin='zhong1 guo2' size={20} />
// Renders: 中国 pinyin colored per tone
Requirements:
Accept pinyin as numbered string (zhong1) or already marked (zhōng)
Split by syllable, color each by tone using TONE_COLORS
Props: pinyin (string), size (number), style (optional)
Render as a row of colored Text elements, no external deps
Task A4 — src/hooks/useAudio.ts (CREATE NEW)
Simple hook for playing pre-generated audio files:
import { useAudio } from '../../src/hooks/useAudio';
const { play, isPlaying } = useAudio();
// play('你好') — plays assets/audio/你好.mp3 if it exists
Requirements:
Use expo-av (already in package.json? If not: npm install expo-av)
If audio file doesn't exist: fail silently, no crash
Unload sound on component unmount
isPlaying boolean for UI feedback
Agent A Done When:
✅  src/constants/colors.ts has all exports above
✅  src/utils/pinyin.ts: getTone('zhong1') returns 1, convertPinyin('hao3') returns 'hǎo'
✅  PinyinText renders 4 differently colored syllables for 'yi1 er4 san1 si4'
✅  useAudio.play() doesn't crash when file is missing
AGENT
B
Home Screen — Dashboard
Files: app/(tabs)/index.tsx
🟡 Start after Agent A posts colors.ts
The current index.tsx is a stub. Replace it entirely. This is the first screen users see.
Task B1 — Full Home Screen Layout
Sections from top to bottom:
Section 1 — Header:
App name 'Hanzi Study' in large bold text
Subtitle: today's date in Chinese format (e.g. 2026年3月26日)
Section 2 — Today's Stats row (3 cards horizontal):
Cards Reviewed today (query user_progress WHERE DATE(last_reviewed) = today)
Study streak in days (calculate from user_progress dates)
Due for review today (SRS: WHERE next_review <= now)
Section 3 — HSK Progress (scrollable list of 9 bars):
Each row: 'HSK 1' label, progress bar (reviewed / total), percentage
Query: COUNT from user_progress joined with hsk for each level
Color: use ACCENT color for filled portion
Section 4 — Quick Actions (2 large buttons):
'Continue Studying' → navigates to /study
'Browse Characters' → navigates to /lists
Section 5 — 30-day study heatmap (bonus, add if time allows):
Grid of 30 small squares, colored by review count that day
Empty = #1E1E1E, light activity = #2b5c8f, heavy = #4A90E2
Task B2 — Dark Theme
All backgrounds use BG (#121212) and CARD (#1E1E1E) from colors.ts. No white. No light mode for now.
Agent B Done When:
✅  Home screen shows real data from SQLite (not hardcoded zeros)
✅  3 stat cards render with numbers
✅  9 HSK progress bars visible
✅  Both quick action buttons navigate correctly
✅  Full dark theme — no white backgrounds
AGENT
C
Study Screen — Real SRS + Swipe + Session Summary
Files: app/(tabs)/study.tsx, app/(tabs)/study-complete.tsx (new)
🟡 Start after Agent A posts useAudio + PinyinText
The current study.tsx works but needs upgrading. Keep the structure, improve the mechanics.
Task C1 — Replace PinyinText in card reveal
When card flips to reveal, pinyin must use the PinyinText component from Agent A — not flat colored Text.
// Replace this:
<Text style={styles.cardPinyin}>{currentCard.pinyin}</Text>
// With this:
<PinyinText pinyin={currentCard.pinyin} size={28} />
Task C2 — Add audio on reveal
When card flips, auto-play audio using useAudio hook:
const { play } = useAudio();
// In handleFlip():
play(currentCard.word);
Task C3 — Real SM-2 Algorithm
Replace the current 2-state logic with proper SM-2. The formula:
// After rating (1-5 scale):
// If rating < 3: interval = 1 day, ease stays same
// If rating >= 3:
//   new_ease = ease + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
//   new_ease = Math.max(1.3, new_ease)  // floor at 1.3
//   if first review: interval = 1 day
//   if second review: interval = 6 days
//   else: interval = Math.round(last_interval * new_ease)
Map current 'Forgot / Remembered' buttons to ratings 1 and 5. Add 3 more buttons: Hard (2), Good (3), Easy (4).
Task C4 — Swipe Gestures
Add react-native-gesture-handler swipe detection on the card:
Swipe LEFT → rating 1 (Forgot)
Swipe RIGHT → rating 5 (Remembered)
Visual feedback: card tilts slightly while swiping
This is additive — rating buttons still work too
Task C5 — Session Complete Screen
Create app/(tabs)/study-complete.tsx:
'Session Complete!' heading
Stats: cards reviewed, correct (rating >= 3) count, time spent
Ratings breakdown: how many 1s, 2s, 3s, 4s, 5s
Two buttons: 'Study Again' and 'Go Home'
Navigate here when currentIndex reaches cards.length
Agent C Done When:
✅  Pinyin on reveal shows tone colors (uses PinyinText component)
✅  Audio plays on card reveal
✅  5 rating buttons visible after flip
✅  SM-2 calculates intervals correctly: rating 5 after 2 reviews = 6 days
✅  Swipe left/right works on physical device
✅  Session complete screen shows stats after finishing all cards
AGENT
D
Character Detail — Tabs + Audio + Favorites
Files: app/(tabs)/character/[char].tsx
🟡 Start after Agent A posts PinyinText + useAudio
The current character detail has stroke animation and basic info. Needs scrollable tabs and audio.
Task D1 — Replace flat pinyin with PinyinText
The pinyin display under the SVG is currently:
<Text style={styles.pinyin}>{characterData.pinyin}</Text>
Replace with:
<PinyinText pinyin={characterData.pinyin} size={36} />
Task D2 — Add Audio Button
Next to the PinyinText, add a speaker icon button:
const { play } = useAudio();
<TouchableOpacity onPress={() => play(char)}>
  <Ionicons name='volume-high' size={28} color='#4A90E2' />
</TouchableOpacity>
Task D3 — Scrollable Tab Bar
Below the SVG canvas and pinyin, add a horizontal tab bar with 4 tabs:
Meanings — current meanings list (already exists, move here)
Strokes — stroke animation controls (Play/Pause/Step/Replay) + stroke count
Components — show radical and component breakdown from stroke_data.decomposition
Details — radical, stroke count, frequency rank, traditional form (already exists as stats, move here)
Each tab content area scrolls independently. Tab bar stays fixed at top.
Task D4 — Favorites Button
Add a heart icon in the top-right corner of the screen (in Stack.Screen options or as absolute positioned):
On tap: toggle is_favorite in user_progress table for this character
Heart fills red when favorited
Persist across sessions
Task D5 — Fix scaleY issue on playButton text
⚠️  The svgContainer has transform: [{ scaleY: -1 }] which flips the SVG correctly. BUT the 'Replay Animation' button is outside svgContainer so it's fine. VERIFY the button text is not upside down on device. If yes, it means the button is accidentally inside the transformed container — move it outside.
Agent D Done When:
✅  Pinyin shows tone colors
✅  Audio button plays sound
✅  4 tabs render and switch correctly
✅  Meanings tab shows all definitions
✅  Strokes tab has Play/Replay controls
✅  Favorites heart toggles and persists
AGENT
E
Lists Screen + Fix Write Canvas
Files: app/(tabs)/lists.tsx, app/(tabs)/character/write/[char].tsx
🟡 Start after Agent A posts colors.ts
Task E1 — Lists Screen (replace stub)
The current lists.tsx is just 'Lists Tab' text. Build the full screen.
Section 1 — HSK Level Browser:
9 rows, one per HSK level
Each row: 'HSK 1' title, subtitle '300 characters', progress bar (X reviewed), arrow icon
Tap → navigate to a new screen app/(tabs)/lists/[level].tsx that shows all characters for that level
app/(tabs)/lists/[level].tsx — Character Grid Screen:
Grid of character cards (3 columns)
Each card: large character, pinyin below (use PinyinText), HSK badge
Tap any card → navigate to /character/[char]
FlatList with numColumns={3} for performance
Header shows 'HSK [level] — [count] characters'
Section 2 — Custom Sets (below HSK browser):
'+ Create New Set' button → modal with text input for set name
List of existing custom sets (name + character count)
For now: store custom sets in AsyncStorage as JSON
Task E2 — Fix Write Canvas Hint
⚠️  KNOWN BUG: The hint overlay uses <View style={{ transform: [{ scaleY: -1 }] }}> inside <Svg>. This doesn't work in react-native-svg. The transform must be on the SVG element itself.
Fix:
// WRONG — View transform inside Svg doesn't work:
<Svg ...>
  <View style={{ transform: [{ scaleY: -1 }] }}>
    <Path ... />
  </View>
</Svg>
// CORRECT — use SVG transform attribute:
<Svg viewBox='0 0 1024 1024' style={styles.hint}
     transform={[{ scaleY: -1 }, { translateY: -CANVAS_SIZE }]}>
  {characterData.strokes.map((strokePath, index) => (
    <Path key={index} d={strokePath} fill='#FFFFFF' opacity={0.15} />
  ))}
</Svg>
Also fix: the table query in write canvas uses 'hanzi_graphics' — verify this table exists in hanzi.db. If it's actually called 'graphics' or the column is named differently, fix the query to match.
Agent E Done When:
✅  Lists screen shows 9 HSK level rows with real character counts from DB
✅  Tapping HSK 1 shows grid of ~300 characters
✅  Characters in grid show correct pinyin with tone colors
✅  Write canvas hint (semi-transparent character) renders correctly — not upside down bug
✅  Create custom set modal opens and saves set name
How Each Agent Reports Completion
After finishing all tasks, output this block:
=== AGENT [X] COMPLETE ===
Files changed: [list]
Files created: [list]
Tests: [what you manually verified worked]
Known issues: [anything that needs follow-up]
DO NOT TOUCH: [list files from other agents]
=========================
⚠️  If you encounter a conflict with another agent's file: STOP. Document what you needed and why. Do not edit files outside your assignment.
After All Agents Complete — Merge Checklist
Run through this before testing on device:
colors.ts exports are used consistently across all screens — no hardcoded hex values
PinyinText is used on all screens that show pinyin
useAudio is imported but fails gracefully when .mp3 is missing
No TypeScript errors: npx tsc --noEmit
App starts without crash: npx expo start
Test on physical device: all 4 tabs navigate, study session completes, character detail opens
加油！· Keep going!