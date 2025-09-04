import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserEntry } from '../types/user';

const AUTH_KEY = 'TRAVEL_JOURNAL_AUTH_V1';

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const user = await AsyncStorage.getItem(AUTH_KEY);
    return !!user;
  } catch {
    return false;
  }
};

export const setAuthenticatedUser = async (user: UserEntry | null): Promise<void> => {
  try {
    if (user) {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(AUTH_KEY);
    }
  } catch (error) {
    console.error('Error setting auth user:', error);
    throw error;
  }
};

export const getAuthenticatedUser = async (): Promise<UserEntry | null> => {
  try {
    const data = await AsyncStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
};