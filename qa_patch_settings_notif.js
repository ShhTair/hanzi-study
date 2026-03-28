const fs = require('fs');
let file = fs.readFileSync('app/settings.tsx', 'utf8');

if (!file.includes('Daily reminder')) {
  file = file.replace(
    "import { Colors } from '../src/constants/colors';",
    "import { Colors } from '../src/constants/colors';\nimport { requestNotificationPermission, scheduleDailyReminder } from '../src/notifications';\nimport * as Notifications from 'expo-notifications';"
  );
  
  file = file.replace(
    "const [animationSpeed, setAnimationSpeed] = useState('normal');",
    "const [animationSpeed, setAnimationSpeed] = useState('normal');\n  const [notificationsEnabled, setNotificationsEnabled] = useState(false);\n  const [notificationHour, setNotificationHour] = useState(9);"
  );
  
  file = file.replace(
    "if (anim) setAnimationSpeed(anim);",
    "if (anim) setAnimationSpeed(anim);\n\n      const notifs = await AsyncStorage.getItem('@hanzi_notifications_enabled');\n      if (notifs) setNotificationsEnabled(notifs === 'true');\n\n      const nHour = await AsyncStorage.getItem('@hanzi_notification_hour');\n      if (nHour) setNotificationHour(parseInt(nHour, 10));"
  );
  
  const toggleFn = `
  const handleToggleNotifications = async (val: boolean) => {
    setNotificationsEnabled(val);
    await AsyncStorage.setItem('@hanzi_notifications_enabled', String(val));
    if (val) {
      const granted = await requestNotificationPermission();
      if (granted) scheduleDailyReminder(notificationHour);
      else {
        setNotificationsEnabled(false);
        await AsyncStorage.setItem('@hanzi_notifications_enabled', 'false');
      }
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const handleChangeNotificationHour = async (hour: number) => {
    setNotificationHour(hour);
    await AsyncStorage.setItem('@hanzi_notification_hour', String(hour));
    if (notificationsEnabled) {
      scheduleDailyReminder(hour);
    }
  };
  `;
  
  file = file.replace("const updateSetting = async", toggleFn + "\n  const updateSetting = async");
  
  const notifSection = `
      <SectionHeader title="DAILY REMINDER" />
      <View style={styles.card}>
        <ToggleRow 
          label="Daily study reminder" 
          value={notificationsEnabled} 
          onValueChange={handleToggleNotifications}
          borderBottom
        />
        <PickerRow
          label="Reminder time"
          value={\`\${notificationHour > 12 ? notificationHour - 12 : notificationHour}:00 \${notificationHour >= 12 ? 'PM' : 'AM'}\`}
          onPress={() => showPicker('Reminder time', Array.from({length: 17}, (_, i) => i + 6).map(v => ({label:\`\${v > 12 ? v - 12 : v}:00 \${v >= 12 ? 'PM' : 'AM'}\`, value:v})), handleChangeNotificationHour)}
        />
      </View>

      <SectionHeader title="DATA" />`;
      
  file = file.replace('<SectionHeader title="DATA" />', notifSection);
}

fs.writeFileSync('app/settings.tsx', file);
