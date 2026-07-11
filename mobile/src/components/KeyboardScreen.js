// Scrollable screen that lifts content above the on-screen keyboard.
// Use for any screen with text inputs so fields/buttons stay reachable.
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../theme';

export function KeyboardScreen({ children, contentStyle, edges = ['bottom'] }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={edges}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={[
            { padding: theme.spacing(2), paddingBottom: theme.spacing(6), flexGrow: 1 },
            contentStyle,
          ]}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
