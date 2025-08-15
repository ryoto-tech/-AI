import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import ChatScreen from './screens/ChatScreen';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" />
      <ChatScreen />
    </SafeAreaView>
  );
}
