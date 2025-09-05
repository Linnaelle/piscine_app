import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserEntry } from '../types/user';

const AUTH_KEY = 'TRAVEL_JOURNAL_AUTH_V1';

/**
 * Check if a user is authenticated.
 * @returns True if a user is authenticated, false otherwise.
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const user = await AsyncStorage.getItem(AUTH_KEY);
    return !!user;
  } catch {
    return false;
  }
};

/**
 * Set the authenticated user.
 * @param user The user to set as authenticated, or null to log out.
 */
export const setAuthenticatedUser = async (user: UserEntry | null): Promise<void> => {
  try {
    if (user) {
      const authData = {
        id: user.id,
        username: user.username
      };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    } else {
      await AsyncStorage.removeItem(AUTH_KEY);
    }
  } catch (error) {
    console.error('Error setting auth user:', error);
    throw error;
  }
};

/**
 * Get the currently authenticated user.
 * @returns The currently authenticated user or null if no user is authenticated.
 */
export const getAuthenticatedUser = async (): Promise<UserEntry | null> => {
  try {
    const data = await AsyncStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
};