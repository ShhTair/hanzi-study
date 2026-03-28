import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDrawer } from '../context/DrawerContext';
import { Colors } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.75, 320);

export function SideDrawer() {
  const { isDrawerOpen, closeDrawer } = useDrawer();
  const router = useRouter();
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDrawerOpen) {
      Animated.parallel([
        Animated.timing(drawerAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0.5,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(drawerAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDrawerOpen]);

  const handleNavigate = (path: string) => {
    closeDrawer();
    // Use a small delay so drawer closes before navigation
    setTimeout(() => {
      router.push(path as any);
    }, 250);
  };

  if (!isDrawerOpen && drawerAnim.valueOf() === -DRAWER_WIDTH) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isDrawerOpen ? 'auto' : 'none'}>
      <TouchableWithoutFeedback onPress={closeDrawer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
        <ScrollView style={styles.scrollContent}>
          <View style={styles.headerArea}>
            <View style={styles.starsRow}>
              <View style={styles.starItem}>
                <MaterialIcons name="star" size={18} color={Colors.warning} />
                <Text style={styles.starValue}>0</Text>
              </View>
              <View style={styles.starItem}>
                <MaterialIcons name="star" size={18} color={Colors.warning} />
                <MaterialIcons name="star" size={18} color={Colors.warning} />
                <Text style={styles.starValue}>0</Text>
              </View>
              <View style={styles.starItem}>
                <MaterialIcons name="star" size={18} color={Colors.starRed} />
                <MaterialIcons name="star" size={18} color={Colors.starRed} />
                <MaterialIcons name="star" size={18} color={Colors.starRed} />
                <Text style={styles.starValue}>0</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Total time ............... </Text>
              <Text style={styles.statsValue}>45s</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Days studied ............. </Text>
              <Text style={styles.statsValue}>1</Text>
            </View>
          </View>

          <View style={styles.navGroup}>
            <NavItem icon="search" color="#6B6B6B" label="Search" onPress={() => handleNavigate('/(tabs)/search')} />
            <NavItem icon="favorite" color="#C2607A" label="Favorites" onPress={() => handleNavigate('/favorites')} />
            <NavItem icon="format-list-numbered" color="#A08060" label="Rankings" onPress={() => handleNavigate('/rankings')} locked />
          </View>

          <View style={styles.divider} />

          <View style={styles.navGroup}>
            <NavItem textIcon="ā" color={Colors.primary} label="Pinyin Guide" onPress={() => handleNavigate('/pinyin-guide')} />
            <NavItem textIcon="部" color="#7C3AED" label="Radicals" onPress={() => handleNavigate('/radicals')} />
            <NavItem icon="format-list-bulleted" color="#A08060" label="Custom Sets" onPress={() => handleNavigate('/custom-sets')} locked />
          </View>

          <View style={styles.divider} />

          <View style={styles.navGroup}>
            <NavItem textIcon="1" color={Colors.hsk1} label="HSK 1" badge="500 chars" onPress={() => handleNavigate('/lists/1')} />
            <NavItem textIcon="2" color={Colors.hsk2} label="HSK 2" locked onPress={() => handleNavigate('/lists/2')} />
            <NavItem textIcon="3" color={Colors.hsk3} label="HSK 3" locked onPress={() => handleNavigate('/lists/3')} />
            <NavItem textIcon="4" color={Colors.hsk4} label="HSK 4" locked onPress={() => handleNavigate('/lists/4')} />
            <NavItem textIcon="5" color={Colors.hsk5} label="HSK 5" locked onPress={() => handleNavigate('/lists/5')} />
            <NavItem textIcon="6" color={Colors.hsk6} label="HSK 6" locked onPress={() => handleNavigate('/lists/6')} />
            <NavItem textIcon="7" color={Colors.hsk79} label="HSK 7-9" badge="Other" locked onPress={() => handleNavigate('/lists/7')} />
          </View>

          <View style={styles.divider} />

          <View style={styles.navGroup}>
            <NavItem icon="apps" color="#404040" label="Sequence" onPress={() => handleNavigate('/sequence-picker')} />
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function NavItem({ icon, textIcon, color, label, badge, locked, onPress }: any) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconBubble, { backgroundColor: color }]}>
        {icon ? (
          <MaterialIcons name={icon} size={22} color="#FFFFFF" />
        ) : (
          <Text style={styles.textIcon}>{textIcon}</Text>
        )}
      </View>
      <Text style={styles.navLabel}>{label}</Text>
      {badge && <Text style={styles.navBadge}>{badge}</Text>}
      {locked && <MaterialIcons name="lock" size={18} color={Colors.textDisabled} style={styles.lockedIcon} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary,
  },
  drawer: {
    ...StyleSheet.absoluteFillObject,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.background,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  scrollContent: {
    flex: 1,
  },
  headerArea: {
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  starItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  starValue: {
    fontSize: 18,
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statsLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: 'monospace', // ensures dot alignment
  },
  statsValue: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  navGroup: {
    paddingVertical: 8,
  },
  navItem: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  navLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 14,
    flex: 1,
  },
  navBadge: {
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 8,
  },
  lockedIcon: {
    marginLeft: 8,
  },
  spacer: {
    height: 40,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
});
