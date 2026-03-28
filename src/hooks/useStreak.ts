import AsyncStorage from '@react-native-async-storage/async-storage';

export async function updateStreak(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = await AsyncStorage.getItem('@hanzi_streak_last_date');
  const currentStreak = parseInt(await AsyncStorage.getItem('@hanzi_streak') || '0');
  if (lastDate === today) {
    return currentStreak;
  }
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const newStreak = lastDate === yesterday ? currentStreak + 1 : 1;
  await AsyncStorage.setItem('@hanzi_streak', String(newStreak));
  await AsyncStorage.setItem('@hanzi_streak_last_date', today);
  return newStreak;
}
