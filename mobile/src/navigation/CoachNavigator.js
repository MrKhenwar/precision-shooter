import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CoachDashboard from '../screens/personas/coach/CoachDashboard';
import LinkRequestsScreen from '../screens/personas/coach/LinkRequestsScreen';
import RosterScreen from '../screens/personas/coach/RosterScreen';
import AthleteDetailScreen from '../screens/personas/coach/AthleteDetailScreen';
import BatchesScreen from '../screens/personas/coach/BatchesScreen';
import BatchDetailScreen from '../screens/personas/coach/BatchDetailScreen';
import AthletePerformanceScreen from '../screens/personas/coach/AthletePerformanceScreen';
import EvaluationFormScreen from '../screens/personas/coach/EvaluationFormScreen';
import CoursePlansScreen from '../screens/personas/coach/CoursePlansScreen';
import FeesScreen from '../screens/personas/coach/FeesScreen';
import InventoryScreen from '../screens/personas/coach/InventoryScreen';
import AssignSessionScreen from '../screens/personas/coach/AssignSessionScreen';
import { theme } from '../theme';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: theme.colors.surface },
  headerTintColor: theme.colors.text,
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: theme.colors.bg },
};

export default function CoachNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Dashboard" component={CoachDashboard} options={{ headerShown: false }} />
      <Stack.Screen name="LinkRequests" component={LinkRequestsScreen} options={{ title: 'Link Requests' }} />
      <Stack.Screen name="Roster" component={RosterScreen} options={{ title: 'Athlete Roster' }} />
      <Stack.Screen name="AthleteDetail" component={AthleteDetailScreen} options={{ title: 'Athlete' }} />
      <Stack.Screen name="Batches" component={BatchesScreen} options={{ title: 'Batches' }} />
      <Stack.Screen name="BatchDetail" component={BatchDetailScreen} options={{ title: 'Batch' }} />
      <Stack.Screen name="AthletePerformance" component={AthletePerformanceScreen} options={{ title: 'Performance' }} />
      <Stack.Screen name="EvaluationForm" component={EvaluationFormScreen} options={{ title: 'New Evaluation' }} />
      <Stack.Screen name="CoursePlans" component={CoursePlansScreen} options={{ title: 'Course Plans' }} />
      <Stack.Screen name="Fees" component={FeesScreen} options={{ title: 'Fees' }} />
      <Stack.Screen name="Inventory" component={InventoryScreen} options={{ title: 'Inventory' }} />
      <Stack.Screen name="AssignSession" component={AssignSessionScreen} options={{ title: 'Assign Training' }} />
    </Stack.Navigator>
  );
}
