import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { BG, CARD, CARD2, BORDER, TEXT, TEXT_DIM, ACCENT } from '../../src/constants/colors';

type HskStat = {
  level: number;
  reviewed: number;
  total: number;
};

type CustomSet = {
  id: string;
  name: string;
  count: number;
};

export default function ListsScreen() {
  const router = useRouter();
  const [hskStats, setHskStats] = useState<HskStat[]>([]);
  const [customSets, setCustomSets] = useState<CustomSet[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSetName, setNewSetName] = useState('');

  const hskLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  useEffect(() => {
    loadStats();
    loadCustomSets();
  }, []);

  const loadStats = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('hanzi.db');
      
      const stats: HskStat[] = [];
      for (let i = 1; i <= 9; i++) {
        const totalRes = await db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM hsk WHERE level = ?', [i]
        );
        const reviewedRes = await db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(DISTINCT h.word) as count FROM hsk h JOIN user_progress p ON h.word = p.word_id WHERE h.level = ?', [i]
        );
        
        stats.push({
          level: i,
          total: totalRes?.count || 0,
          reviewed: reviewedRes?.count || 0,
        });
      }
      setHskStats(stats);
    } catch (e) {
      console.error(e);
      setHskStats(hskLevels.map(lvl => ({ level: lvl, total: lvl * 300, reviewed: 0 })));
    }
  };

  const loadCustomSets = async () => {
    try {
      const setsStr = await AsyncStorage.getItem('custom_sets');
      if (setsStr) {
        setCustomSets(JSON.parse(setsStr));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createSet = async () => {
    if (!newSetName.trim()) return;
    try {
      const newSet: CustomSet = { id: Date.now().toString(), name: newSetName.trim(), count: 0 };
      const updated = [...customSets, newSet];
      await AsyncStorage.setItem('custom_sets', JSON.stringify(updated));
      setCustomSets(updated);
      setNewSetName('');
      setModalVisible(false);
    } catch (e) {
      console.error(e);
    }
  };

  const renderHskItem = (item: HskStat) => {
    return (
      <TouchableOpacity key={item.level} style={styles.listItem} onPress={() => router.push(`/lists/${item.level}` as any)}>
        <View style={styles.listTextContainer}>
          <Text style={styles.listTitle}>HSK {item.level}</Text>
          <Text style={styles.listSubtitle}>{item.total} characters</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: item.total ? `${Math.min(100, (item.reviewed / item.total) * 100)}%` : '0%' }]} />
          </View>
          <Text style={styles.progressText}>{item.reviewed}/{item.total}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={TEXT_DIM} />
      </TouchableOpacity>
    );
  };

  const renderSetItem = (item: CustomSet) => (
    <View key={item.id}>
      <View style={styles.separator} />
      <TouchableOpacity style={styles.listItem}>
        <View style={styles.listTextContainer}>
          <Text style={styles.listTitle}>{item.name}</Text>
          <Text style={styles.listSubtitle}>{item.count} characters</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={TEXT_DIM} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>HSK Level Browser</Text>
          <View style={styles.card}>
            {hskStats.map(stat => renderHskItem(stat))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Custom Sets</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
              <Ionicons name="add-circle-outline" size={24} color={ACCENT} />
              <Text style={styles.createBtnText}>Create New Set</Text>
            </TouchableOpacity>
            
            {customSets.map(set => renderSetItem(set))}
          </View>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Custom Set</Text>
            <TextInput
              style={styles.input}
              placeholder="Set Name"
              placeholderTextColor={TEXT_DIM}
              value={newSetName}
              onChangeText={setNewSetName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnTextDim}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={createSet}>
                <Text style={styles.modalBtnTextAccent}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 16 },
  section: { marginBottom: 24 },
  sectionHeader: { color: TEXT_DIM, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },
  card: { backgroundColor: CARD, borderRadius: 12, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  listTextContainer: { flex: 1 },
  listTitle: { color: TEXT, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  listSubtitle: { color: TEXT_DIM, fontSize: 14 },
  progressContainer: { width: 80, alignItems: 'flex-end', marginRight: 16 },
  progressBarBg: { width: '100%', height: 6, backgroundColor: CARD2, borderRadius: 3, marginBottom: 4 },
  progressBarFill: { height: 6, backgroundColor: ACCENT, borderRadius: 3 },
  progressText: { color: TEXT_DIM, fontSize: 12 },
  separator: { height: 1, backgroundColor: BORDER },
  createBtn: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  createBtnText: { color: ACCENT, fontSize: 16, fontWeight: 'bold', marginLeft: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: CARD, width: '85%', padding: 24, borderRadius: 12 },
  modalTitle: { color: TEXT, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: CARD2, color: TEXT, padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 24, borderWidth: 1, borderColor: BORDER },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  modalBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  modalBtnTextDim: { color: TEXT_DIM, fontSize: 16, fontWeight: '600' },
  modalBtnTextAccent: { color: ACCENT, fontSize: 16, fontWeight: '600' },
});
