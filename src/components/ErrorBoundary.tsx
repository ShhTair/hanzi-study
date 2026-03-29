import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 48, marginBottom: 16 }}>🐼</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Something went wrong</Text>
          <Text style={{ color: '#888888', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false })}
            style={{ backgroundColor: '#0D9488', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
