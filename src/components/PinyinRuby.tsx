import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { convertPinyin, getTone } from '../utils/pinyin';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function PinyinRubySentence({ text, pinyinStr }: { text: string; pinyinStr: string }) {
  const { colors } = useTheme();
  const [showRuby, setShowRuby] = useState(true);
  const [useColors, setUseColors] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('@hanzi_show_tone_colors').then(val => {
      if (val === 'false') setUseColors(false);
    });
  }, []);

  const syllables = (pinyinStr || '').split(/\s+/).filter(Boolean);
  const chars = text.split('');
  
  let pinyinIndex = 0;

  return (
    <View style={{ marginBottom: 12 }}>
      <TouchableOpacity onPress={() => setShowRuby(!showRuby)} style={{ alignSelf: 'flex-start', marginBottom: 4, backgroundColor: colors.cardElevated, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
        <Text style={{ fontSize: 10, color: colors.textMuted }}>pīn</Text>
      </TouchableOpacity>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {chars.map((char, i) => {
          const isChinese = /[\u4e00-\u9fff]/.test(char);
          
          if (!isChinese) {
            return <Text key={i} style={{ fontSize: 18, color: colors.textPrimary, paddingBottom: 2 }}>{char}</Text>;
          }

          const rawSyl = syllables[pinyinIndex] || '';
          pinyinIndex++;
          
          const displaySyl = convertPinyin(rawSyl);
          const tone = getTone(rawSyl) as 1|2|3|4|5;
          const toneColorName = 'tone' + (tone === 5 ? 'N' : tone);
          const color = useColors ? (colors as any)[toneColorName] || colors.textPrimary : colors.textPrimary;

          return (
            <View key={i} style={{ alignItems: 'center', marginHorizontal: 1 }}>
              {showRuby && <Text style={{ fontSize: 11, color, lineHeight: 14 }}>{displaySyl}</Text>}
              <Text style={{ fontSize: 18, color: colors.textPrimary, lineHeight: 24 }}>{char}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
