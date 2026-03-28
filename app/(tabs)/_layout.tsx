import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: true, 
        tabBarStyle: { backgroundColor: Colors.background, borderTopColor: Colors.card }, 
        headerStyle: { backgroundColor: Colors.background }, 
        headerTintColor: Colors.textPrimary, 
        tabBarActiveTintColor: Colors.primary, 
        tabBarInactiveTintColor: Colors.textMuted 
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          tabBarLabel: 'Study',
          tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          tabBarLabel: 'Lists',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
