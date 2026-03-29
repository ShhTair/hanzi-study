import { Colors } from '../../src/constants/colors';

import { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { Dimensions } from 'react-native';

import Step1 from './step1-welcome';
import Step2 from './step2-level';
import Step3 from './step3-intro';
import Step4 from './step4-sequence';
import Step5 from './step5-theme';
import Step6 from './step6-howto';
import Step7 from './step7-done';
import { startRainAnimation, RainOverlay } from './rainOverlay';

const TOTAL_STEPS = 7;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

function BottomBar({ step, total, onSkip, onNext, onDone, onRestore }: any) {
  const isLast = step === total - 1;
  const isFirst = step === 0;

  return (
    <View style={styles.bottomBar}>
      <TouchableOpacity onPress={isFirst ? onRestore : onSkip} style={styles.btnSide}>
        {!isLast && (
          <Text style={styles.btnText}>{isFirst ? 'RESTORE' : 'SKIP'}</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.dotsContainer}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.dot, i === step ? styles.dotActive : styles.dotInactive]} />
        ))}
      </View>
      
      {isLast ? (
        <TouchableOpacity onPress={onDone} style={[styles.btnSide, styles.btnRight]}>
          <Text style={styles.btnText}>DONE</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onNext} style={[styles.btnSide, styles.btnRight]}>
          <Text style={styles.btnArrow}>›</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function OnboardingShell() {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState('novice');
  const [sequence, setSequence] = useState('hsk');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isRaining, setIsRaining] = useState(false);
  
  const translateX = useSharedValue(0);

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@hanzi_onboarding_complete', 'true');
      await AsyncStorage.setItem('@hanzi_user_level', level);
      await AsyncStorage.setItem('@hanzi_sequence', sequence);
      await AsyncStorage.setItem('@hanzi_theme', theme);
      setIsRaining(true);
    } catch (e) {
      console.warn(e);
    } finally {
      setTimeout(() => {
        router.replace('/(tabs)' as any);
      }, 1500);
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      translateX.value = SCREEN_WIDTH;
      setStep(s => s + 1);
      translateX.value = withTiming(0, { duration: 280, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    } else {
      finishOnboarding();
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip setup?',
      'You can change these settings later in the app settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: finishOnboarding }
      ]
    );
  };

  const handleRestore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (!result.canceled) {
        finishOnboarding();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    flex: 1,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Animated.View style={animStyle}>
          {step === 0 && <Step1 />}
          {step === 1 && <Step2 level={level} setLevel={setLevel} />}
          {step === 2 && <Step3 />}
          {step === 3 && <Step4 sequence={sequence} setSequence={setSequence} />}
          {step === 4 && <Step5 theme={theme} setTheme={setTheme} />}
          {step === 5 && <Step6 />}
          {step === 6 && <Step7 />}
        </Animated.View>
        {isRaining && <RainOverlay />}
        <BottomBar 
          step={step} 
          total={TOTAL_STEPS} 
          onSkip={handleSkip} 
          onNext={handleNext} 
          onDone={finishOnboarding} 
          onRestore={handleRestore} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bottomBar: {
    height: 64,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  btnSide: {
    minWidth: 70,
    justifyContent: 'center',
  },
  btnRight: {
    alignItems: 'flex-end',
  },
  btnText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  btnArrow: {
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 34,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: Colors.textPrimary,
    borderWidth: 0,
  },
  dotInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.textDisabled,
  },
});
