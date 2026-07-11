import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RefNavigator from './src/screens/ref/RefNavigator';
import { AuthProvider } from './src/store/AuthContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RefNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
