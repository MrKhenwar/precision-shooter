import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ParentDashboard from '../screens/personas/parent/ParentDashboard';
import ChildDetailScreen from '../screens/personas/parent/ChildDetailScreen';
import { theme } from '../theme';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: theme.colors.surface },
  headerTintColor: theme.colors.text,
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: theme.colors.bg },
};

export default function ParentNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Dashboard" component={ParentDashboard} options={{ headerShown: false }} />
      <Stack.Screen name="ChildDetail" component={ChildDetailScreen} options={{ title: 'Child' }} />
    </Stack.Navigator>
  );
}
