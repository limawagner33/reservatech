import React from 'react';
import { Stack } from 'expo-router';
import { RecursosProvider } from '../../src/context/RecursosContext';

export default function Layout() {
  return (
    <RecursosProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </RecursosProvider>
  );
}