// App navigation: auth flow when signed out, otherwise persona-aware bottom
// tabs (coach vs athlete). Secondary sections live in the hamburger menu, so
// the tab bar stays focused. Each tab hosts a stack so detail screens keep the
// tab bar visible.
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './LoginScreen';
import SignInScreen from './SignInScreen';
import RegisterScreen from './RegisterScreen';
import VerifyOtpScreen from './VerifyOtpScreen';
import CoachDashboardScreen from './CoachDashboardScreen';
import RosterScreen from './RosterScreen';
import AthleteProfileScreen from './AthleteProfileScreen';
import PerformanceScreen from './PerformanceScreen';
import AttendanceScreen from './AttendanceScreen';
import BatchesScreen from './BatchesScreen';
import TrainingPlanScreen from './TrainingPlanScreen';
import DiaryScreen from './DiaryScreen';
import ProfileScreen from './ProfileScreen';
import FeesScreen from './FeesScreen';
import InventoryScreen from './InventoryScreen';
import LinkRequestsScreen from './LinkRequestsScreen';
import CoursePlansScreen from './CoursePlansScreen';
import BatchDetailScreen from './BatchDetailScreen';
import EvaluationFormScreen from './EvaluationFormScreen';
import AssignSessionScreen from './AssignSessionScreen';
import MyEvaluationsScreen from './MyEvaluationsScreen';
import ConnectCoachScreen from './ConnectCoachScreen';
import MyFeesScreen from './MyFeesScreen';
import LogRecordScreen from './LogRecordScreen';
import ParentAccessScreen from './ParentAccessScreen';
import ProfileEditScreen from './ProfileEditScreen';
import DiaryEntryScreen from './DiaryEntryScreen';
import { useAuth } from '../../store/AuthContext';
import { theme } from '../../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const sOpts = { headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } };

// ------------------------------------------------------------- Coach stacks
// Screens reachable when a coach drills into an athlete.
function coachAthleteScreens() {
  return [
    <Stack.Screen key="ap" name="AthleteProfile" component={AthleteProfileScreen} />,
    <Stack.Screen key="pf" name="Performance" component={PerformanceScreen} />,
    <Stack.Screen key="di" name="Diary" component={DiaryScreen} />,
    <Stack.Screen key="pr" name="Profile" component={ProfileScreen} />,
    <Stack.Screen key="ev" name="Evaluations" component={MyEvaluationsScreen} />,
    <Stack.Screen key="ef" name="EvaluationForm" component={EvaluationFormScreen} />,
    <Stack.Screen key="as" name="AssignSession" component={AssignSessionScreen} />,
    <Stack.Screen key="lr" name="LogRecord" component={LogRecordScreen} />,
  ];
}

function CoachHomeStack() {
  return (
    <Stack.Navigator screenOptions={sOpts}>
      <Stack.Screen name="CoachDashboard" component={CoachDashboardScreen} />
      <Stack.Screen name="Batches" component={BatchesScreen} />
      <Stack.Screen name="BatchDetail" component={BatchDetailScreen} />
      <Stack.Screen name="Fees" component={FeesScreen} />
      <Stack.Screen name="Inventory" component={InventoryScreen} />
      <Stack.Screen name="LinkRequests" component={LinkRequestsScreen} />
      <Stack.Screen name="CoursePlans" component={CoursePlansScreen} />
      {coachAthleteScreens()}
    </Stack.Navigator>
  );
}
function CoachAthletesStack() {
  return (
    <Stack.Navigator screenOptions={sOpts}>
      <Stack.Screen name="Roster" component={RosterScreen} />
      {coachAthleteScreens()}
    </Stack.Navigator>
  );
}
function CoachAttendanceStack() {
  return (
    <Stack.Navigator screenOptions={sOpts}>
      <Stack.Screen name="AttendanceHome" component={AttendanceScreen} />
      {coachAthleteScreens()}
    </Stack.Navigator>
  );
}
function CoachTrainingStack() {
  return (
    <Stack.Navigator screenOptions={sOpts}>
      <Stack.Screen name="TrainingHome" component={TrainingPlanScreen} />
      <Stack.Screen name="Batches" component={BatchesScreen} />
      <Stack.Screen name="BatchDetail" component={BatchDetailScreen} />
    </Stack.Navigator>
  );
}

// ----------------------------------------------------------- Athlete stacks
function AthleteHomeStack() {
  return (
    <Stack.Navigator screenOptions={sOpts}>
      <Stack.Screen name="Overview" component={AthleteProfileScreen} />
      <Stack.Screen name="Performance" component={PerformanceScreen} />
      <Stack.Screen name="Diary" component={DiaryScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ConnectCoach" component={ConnectCoachScreen} />
      <Stack.Screen name="MyFees" component={MyFeesScreen} />
      <Stack.Screen name="Evaluations" component={MyEvaluationsScreen} />
      <Stack.Screen name="LogRecord" component={LogRecordScreen} />
      <Stack.Screen name="ParentAccess" component={ParentAccessScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name="DiaryEntry" component={DiaryEntryScreen} />
    </Stack.Navigator>
  );
}
function AthletePerformanceStack() {
  return (
    <Stack.Navigator screenOptions={sOpts}>
      <Stack.Screen name="PerformanceHome" component={PerformanceScreen} />
      <Stack.Screen name="LogRecord" component={LogRecordScreen} />
    </Stack.Navigator>
  );
}
function AthleteTrainingStack() {
  return (
    <Stack.Navigator screenOptions={sOpts}>
      <Stack.Screen name="TrainingHome" component={TrainingPlanScreen} />
    </Stack.Navigator>
  );
}
function AthleteDiaryStack() {
  return (
    <Stack.Navigator screenOptions={sOpts}>
      <Stack.Screen name="DiaryHome" component={DiaryScreen} />
      <Stack.Screen name="DiaryEntry" component={DiaryEntryScreen} />
    </Stack.Navigator>
  );
}

function tabBar(icons) {
  return ({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.textFaint,
    tabBarStyle: {
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      height: 84,
      paddingTop: 10,
      paddingBottom: 16,
    },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '700', marginTop: 2, letterSpacing: 0.2 },
    tabBarIconStyle: { marginTop: 2 },
    // Filled icon when active, outline when idle — quieter idle state.
    tabBarIcon: ({ color, focused }) => (
      <Ionicons name={focused ? icons[route.name] : `${icons[route.name]}-outline`} size={focused ? 28 : 25} color={color} />
    ),
  });
}

function CoachTabs() {
  return (
    <Tab.Navigator screenOptions={tabBar({ Dashboard: 'home', Athletes: 'people', Attendance: 'shield-checkmark', Training: 'clipboard' })}>
      <Tab.Screen name="Dashboard" component={CoachHomeStack} />
      <Tab.Screen name="Athletes" component={CoachAthletesStack} />
      <Tab.Screen name="Attendance" component={CoachAttendanceStack} />
      <Tab.Screen name="Training" component={CoachTrainingStack} />
    </Tab.Navigator>
  );
}

function AthleteTabs() {
  return (
    <Tab.Navigator screenOptions={tabBar({ Overview: 'home', Performance: 'stats-chart', Training: 'clipboard', Diary: 'book' })}>
      <Tab.Screen name="Overview" component={AthleteHomeStack} />
      <Tab.Screen name="Performance" component={AthletePerformanceStack} />
      <Tab.Screen name="Training" component={AthleteTrainingStack} />
      <Tab.Screen name="Diary" component={AthleteDiaryStack} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
    </Stack.Navigator>
  );
}

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.bg,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    notification: theme.colors.primary,
  },
};

export default function RefNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!user ? <AuthStack /> : user.persona === 'coach' ? <CoachTabs /> : <AthleteTabs />}
    </NavigationContainer>
  );
}
