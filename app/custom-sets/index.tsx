import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert , KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { getCustomSets, deleteCustomSet, createCustomSet, CustomSet } from '../../src/db/database';
import { StudyTypePicker } from '../../src/components/StudyTypePicker';

export default function CustomSetsScreen() {
  const router = useRouter();
  const [sets, setSets] = useState<(CustomSet & { count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);

  const loadSets = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('hanzi.db');
      const customSets = await getCustomSets(db);
      
      const setsWithCount = await Promise.all(
        customSets.map(async (s) => {
          const row = await db.getFirstAsync<{c: number}>('SELECT COUNT(*) as c FROM custom_set_chars WHERE set_id = ?', [s.id]);
          return { ...s, count: row ? row.c : 0 };
        })
      );
      
      setSets(setsWithCount);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSets();
  }, []);

  const handleCreate = () => {
    Alert.prompt(
      'New Custom Set',
      'Enter a name for your set',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create', 
          onPress: async (name?: string) => {
            if (name && name.trim()) {
              const db = await SQLite.openDatabaseAsync('hanzi.db');
              const id = await createCustomSet(db, name.trim());
              router.push({ pathname: '/custom-sets/[id]', params: { id: id.toString() } } as any);
            }
          }
        }
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Set', 'Are you sure you want to delete this custom set? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const db = await SQLite.openDatabaseAsync('hanzi.db');
        await deleteCustomSet(db, id);
        loadSets();
      }}
    ]);
  };

  const handleStudy = (id: number) => {
    setSelectedSetId(id);
    setPickerVisible(true);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Custom Sets',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.textPrimary,
          headerRight: () => (
            <TouchableOpacity onPress={handleCreate} style={{ padding: 8 }}>
              <Ionicons name="add" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          )
        }} 
      />

      {sets.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 60, marginBottom: 16 }}>🐼</Text>
          <Text style={styles.emptyText}>No custom sets yet.</Text>
          <Text style={styles.emptySubtext}>Create one to organize your study.</Text>
        </View>
      ) : (
        <FlatList
          data={sets}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <TouchableOpacity 
                style={styles.rowLeft}
                onPress={() => router.push({ pathname: '/custom-sets/[id]', params: { id: item.id.toString() } } as any)}
                onLongPress={() => handleDelete(item.id)}
              >
                <Text style={styles.setName}>{item.name}</Text>
                <Text style={styles.setCount}>{item.count} characters</Text>
              </TouchableOpacity>
              
              <View style={styles.rowRight}>
                <TouchableOpacity style={styles.studyBtn} onPress={() => handleStudy(item.id)}>
                  <Text style={styles.studyBtnText}>STUDY</Text>
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} style={{ marginLeft: 8 }} />
              </View>
            </View>
          )}
        />
      )}

      {selectedSetId !== null && (
        <StudyTypePicker 
          visible={pickerVisible} 
          onClose={() => setPickerVisible(false)} 
          level="custom" 
          setIndex={selectedSetId || 0} 
          
          setName={sets.find(s => s.id === selectedSetId)?.name || 'Custom Set'}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  row: { 
    flexDirection: 'row', 
    backgroundColor: Colors.card, 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  rowLeft: { flex: 1 },
  setName: { fontSize: 17, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  setCount: { fontSize: 13, color: Colors.textMuted },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  studyBtn: { 
    borderWidth: 1, 
    borderColor: Colors.primary, 
    borderRadius: 6, 
    paddingHorizontal: 12, 
    paddingVertical: 6 
  },
  studyBtnText: { fontSize: 12, fontWeight: 'bold', color: Colors.primary }
});
