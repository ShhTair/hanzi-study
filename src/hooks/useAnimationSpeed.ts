import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SPEED_MULTIPLIERS = { slow: 0.5, normal: 1.0, fast: 2.5 };
export type SpeedType = 'slow' | 'normal' | 'fast';

export function useAnimationSpeed() {
  const [speed, setSpeedState] = useState<SpeedType>('normal');

  useEffect(() => {
    AsyncStorage.getItem('@hanzi_animation_speed').then(v => {
      if (v === 'slow' || v === 'normal' || v === 'fast') setSpeedState(v);
    });
  }, []);

  const multiplier = SPEED_MULTIPLIERS[speed];
  return { speed, multiplier };
}
