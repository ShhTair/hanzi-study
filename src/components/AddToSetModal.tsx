import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, FlatList } from 'react-native';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import * as SQLite from 'expo-sqlite';
import { getCustomSets, addCharToSet, CustomSet } from '../db/database';

interface Props {
  char: string;
  visible: boolean;
  onClose: () => void;
}

export function AddToSetModal({ char, visible, onClose }: Props) {
  const [sets, setSets] = useState<CustomSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadSets();
    }
  }, [visible]);

  const loadSets = async () => {
    setLoading(true);
    try {
      const db = await SQLite.openDatabaseAsync('hanzi.db');
      const cs = await getCustomSets(db);
      setSets(cs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

    const handleAdd = async (setId: number) => {
    try {
      const db = await SQLite.openDatabaseAsync('hanzi.db');
      const chars = char.split(',');
      for (const c of chars) {
        if (c.trim()) await addCharToSet(db, setId, c.trim());
      }
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.header}>
                <Text style={styles.title}>Add "{char}" to Set</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.divider} />
              
              {loading ? (
                <View style={{ padding: 20, alignItems: 'center' }}><Text style={{color: Colors.textMuted}}>Loading...</Text></View>
              ) : sets.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>Create a set first from the Custom Sets menu.</Text>
                </View>
              ) : (
                <FlatList
                  data={sets}
                  keyExtractor={s => s.id.toString()}
                  style={{ maxHeight: 300 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.row} onPress={() => handleAdd(item.id)}>
                      <Text style={styles.setName}>{item.name}</Text>
                      <Ionicons name="add-circle" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: Colors.card, borderRadius: 16, width: '85%', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.divider },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  setName: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, textAlign: 'center' }
});
