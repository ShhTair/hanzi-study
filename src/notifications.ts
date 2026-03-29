import * as Notifications from 'expo-notifications';

export async function requestNotificationPermission() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function scheduleDailyReminder(hour: number) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to study!',
      body: 'Keep up your daily Hanzi habit.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0
    },
  });
}

export async function checkDailyGoal(reviewedCount: number, target: number) {
  const today = new Date().toISOString().split('T')[0];
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  
  const notified = await AsyncStorage.getItem('@hanzi_goal_notified_' + today);
  if (reviewedCount >= target && !notified) {
    await AsyncStorage.setItem('@hanzi_goal_notified_' + today, 'true');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Daily goal reached!',
        body: `You studied ${reviewedCount} characters today. Great job! 加油！`,
      },
      trigger: null,
    });
  }
}
