import { StyleSheet, View, Text } from 'react-native';

export default function ListsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Lists Tab</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#888888',
    fontSize: 18,
  },
});
