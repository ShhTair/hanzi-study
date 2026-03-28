import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyReminder(hour = 9, minute = 0) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '汉字学习 · Hanzi Study',
      body: 'Your characters are waiting! 加油！',
      sound: true,
    },
    trigger: { 
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour, 
      minute 
    },
  });
}

export async function scheduleStreakWarning() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Streak at risk!',
      body: "You haven't studied today. Don't break your streak!",
    },
    trigger: { 
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20, 
      minute: 0 
    },
  });
}
