import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AthleteDashboard from '../screens/personas/athlete/AthleteDashboard';
import ProfileScreen from '../screens/personas/athlete/ProfileScreen';
import ConnectCoachScreen from '../screens/personas/athlete/ConnectCoachScreen';
import AttendanceScreen from '../screens/personas/athlete/AttendanceScreen';
import ShootingRecordScreen from '../screens/personas/athlete/ShootingRecordScreen';
import DiaryScreen from '../screens/personas/athlete/DiaryScreen';
import MyEvaluationsScreen from '../screens/personas/athlete/MyEvaluationsScreen';
import TrainingScreen from '../screens/personas/athlete/TrainingScreen';
import MyFeesScreen from '../screens/personas/athlete/MyFeesScreen';
import PlanScreen from '../screens/personas/athlete/PlanScreen';
import ParentAccessScreen from '../screens/personas/athlete/ParentAccessScreen';
import { theme } from '../theme';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: theme.colors.surface },
  headerTintColor: theme.colors.text,
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: theme.colors.bg },
};

export default function AthleteNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Dashboard" component={AthleteDashboard} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <Stack.Screen name="ConnectCoach" component={ConnectCoachScreen} options={{ title: 'Connect a Coach' }} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} options={{ title: 'Attendance' }} />
      <Stack.Screen name="ShootingRecord" component={ShootingRecordScreen} options={{ title: 'Shooting Record' }} />
      <Stack.Screen name="Diary" component={DiaryScreen} options={{ title: 'Daily Diary' }} />
      <Stack.Screen name="MyEvaluations" component={MyEvaluationsScreen} options={{ title: 'My Evaluations' }} />
      <Stack.Screen name="Training" component={TrainingScreen} options={{ title: 'My Training' }} />
      <Stack.Screen name="MyFees" component={MyFeesScreen} options={{ title: 'My Fees' }} />
      <Stack.Screen name="Plan" component={PlanScreen} options={{ title: 'My Plan' }} />
      <Stack.Screen name="ParentAccess" component={ParentAccessScreen} options={{ title: 'Parent Access' }} />
    </Stack.Navigator>
  );
}
