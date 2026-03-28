import * as Speech from 'expo-speech'
export function useAudio() {
  const speak = (text: string, language = 'zh-CN') => {
    Speech.speak(text, {
      language,
      rate: 0.8,
      pitch: 1.0,
    })
  }
  const stop = () => Speech.stop()
  const speakCharacter = (char: string) => speak(char, 'zh-CN')
  const speakSentence = (sentence: string) => speak(sentence, 'zh-CN')
  const speakPinyin = (pinyin: string) => speak(pinyin, 'zh-CN')
  return { speak, stop, speakCharacter, speakSentence, speakPinyin }
}
