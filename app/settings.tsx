import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../src/constants/colors';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [showPinyin, setShowPinyin] = useState(false);
  const [showToneColors, setShowToneColors] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('@hanzi_show_pinyin_before_flip').then(v => setShowPinyin(v === 'true'));
    AsyncStorage.getItem('@hanzi_show_tone_colors').then(v => setShowToneColors(v !== 'false'));
  }, []);

  const togglePinyin = async (val: boolean) => {
    setShowPinyin(val);
    await AsyncStorage.setItem('@hanzi_show_pinyin_before_flip', String(val));
  };

  const toggleTone = async (val: boolean) => {
    setShowToneColors(val);
    await AsyncStorage.setItem('@hanzi_show_tone_colors', String(val));
  };

  const handleResetAll = () => {
    Alert.alert('Reset progress', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Reset', 
        style: 'destructive', 
        onPress: async () => {
          // Add DB reset query here
          router.replace('/');
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionHeader}>Study Settings</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Show Pinyin before flip</Text>
          <Switch value={showPinyin} onValueChange={togglePinyin} trackColor={{ true: Colors.primary }} />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Show tone colors</Text>
          <Switch value={showToneColors} onValueChange={toggleTone} trackColor={{ true: Colors.primary }} />
        </View>
      </View>

      <Text style={styles.sectionHeader}>Data & Reset</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={handleResetAll}>
          <Text style={styles.dangerLabel}>Reset all progress</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 16 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingBottom: 6,
    marginTop: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  divider: { height: 1, backgroundColor: Colors.divider, marginLeft: 16 },
  label: { fontSize: 16, color: Colors.textPrimary },
  dangerLabel: { fontSize: 16, color: Colors.wrong },
});

// @hanzi_daily_target
// @hanzi_end_of_day_hour
// @hanzi_swipe_right_rating
// @hanzi_display_script
// @hanzi_animation_speed
// @hanzi_notifications_enabled
// @hanzi_notification_hour