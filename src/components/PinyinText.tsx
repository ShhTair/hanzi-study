import * as React from 'react';
import { View, Text, StyleSheet, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { TONE_COLORS } from '../constants/colors';
import { convertPinyin, getTone } from '../utils/pinyin';

interface PinyinTextProps {
  pinyin: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const PinyinText: React.FC<PinyinTextProps> = ({ pinyin, size = 16, style, textStyle }) => {
  const syllables = pinyin.split(/\s+/).filter(Boolean);

  return (
    <View style={[styles.container, style]}>
      {syllables.map((syl, index) => {
        const tone = getTone(syl) as keyof typeof TONE_COLORS;
        const coloredSyl = convertPinyin(syl);
        const color = TONE_COLORS[tone] || TONE_COLORS[5];

        return (
          <Text key={index} style={[styles.text, { fontSize: size, color }, textStyle]}>
            {coloredSyl}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  text: {
    fontWeight: '500',
  },
});
export default PinyinText;
