export function getTone(pinyin: string): number {
  const match = pinyin.match(/(\d)$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 5;
}

const TONE_MARKS: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à', 'a'],
  e: ['ē', 'é', 'ě', 'è', 'e'],
  i: ['ī', 'í', 'ǐ', 'ì', 'i'],
  o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
  u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
  'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
};

export function convertPinyin(pinyinWithNum: string): string {
  const tone = getTone(pinyinWithNum);
  let basePinyin = pinyinWithNum.replace(/\d$/, '');
  basePinyin = basePinyin.replace(/v/g, 'ü');
  
  if (tone === 5) {
    return basePinyin;
  }

  let vowelToMark = '';
  if (basePinyin.includes('a')) vowelToMark = 'a';
  else if (basePinyin.includes('e')) vowelToMark = 'e';
  else if (basePinyin.includes('ou')) vowelToMark = 'o';
  else {
    const vowels = basePinyin.match(/[iouü]/g);
    if (vowels) {
      vowelToMark = vowels[vowels.length - 1];
    }
  }

  if (vowelToMark && TONE_MARKS[vowelToMark]) {
    const mark = TONE_MARKS[vowelToMark][tone - 1];
    basePinyin = basePinyin.replace(vowelToMark, mark);
  }

  return basePinyin;
}
