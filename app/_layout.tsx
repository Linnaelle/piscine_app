import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../constants/theme';
import { isAuthenticated } from '../storage/auth';

export default function RootLayout() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const auth = await isAuthenticated();
    setIsAuth(auth);
  };

  if (isAuth === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack 
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuth ? (
        <Stack.Screen name="index" />
      ) : (
        <Stack.Screen name="(tabs)" />
      )}
    </Stack>
  );
}