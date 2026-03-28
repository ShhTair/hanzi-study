import * as React from 'react';
import { View, Text, StyleSheet, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Colors, TONE_COLORS } from '../constants/colors';
import { convertPinyin, getTone } from '../utils/pinyin';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PinyinTextProps {
  pinyin: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  showToneColors?: boolean;
}

export const PinyinText: React.FC<PinyinTextProps> = ({ pinyin, size = 16, style, textStyle, showToneColors }) => {
  const syllables = (pinyin || '').split(/\s+/).filter(Boolean);
  const [useColors, setUseColors] = React.useState(showToneColors ?? true);

  React.useEffect(() => {
    if (showToneColors !== undefined) {
      setUseColors(showToneColors);
    } else {
      AsyncStorage.getItem('@hanzi_show_tone_colors').then(val => {
        if (val === 'false') setUseColors(false);
      });
    }
  }, [showToneColors]);

  return (
    <View style={[styles.container, style]}>
      {syllables.map((syl, index) => {
        const tone = getTone(syl) as keyof typeof TONE_COLORS;
        const coloredSyl = convertPinyin(syl);
        const color = useColors ? (TONE_COLORS[tone] || TONE_COLORS[5]) : Colors.textPrimary;

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
