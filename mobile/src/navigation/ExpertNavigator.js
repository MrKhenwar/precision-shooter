import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ExpertDashboard from '../screens/personas/expert/ExpertDashboard';
import ExpertDirectoryScreen from '../screens/personas/expert/ExpertDirectoryScreen';
import { theme } from '../theme';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: theme.colors.surface },
  headerTintColor: theme.colors.text,
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: theme.colors.bg },
};

export default function ExpertNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Dashboard" component={ExpertDashboard} options={{ headerShown: false }} />
      <Stack.Screen name="Directory" component={ExpertDirectoryScreen} options={{ title: 'Expert Directory' }} />
    </Stack.Navigator>
  );
}
