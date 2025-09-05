import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { getAuthenticatedUser } from './auth';

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  bio: string;
  createdAt: number;
  lastLoginAt: number;
};

const USERS_INDEX_KEY = 'TRAVEL_JOURNAL_USERS_INDEX_V3';
const USER_KEY_PREFIX = 'TRAVEL_JOURNAL_USER_V3';

/**
 * Hash a password using SHA256.
 * @param password The password to hash.
 * @returns The hashed password.
 */
const hashPassword = async (password: string): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
};

const getUsersIndex = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(USERS_INDEX_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting users index:', error);
    return [];
  }
};

const saveUsersIndex = async (usernames: string[]): Promise<void> => {
  await AsyncStorage.setItem(USERS_INDEX_KEY, JSON.stringify(usernames));
};

const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const data = await AsyncStorage.getItem(`${USER_KEY_PREFIX}_${username.toLowerCase()}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
};

const saveUser = async (user: User): Promise<void> => {
  await AsyncStorage.setItem(`${USER_KEY_PREFIX}_${user.username}`, JSON.stringify(user));
};

/**
 * Create a new user.
 * @param username The username of the new user.
 * @param password The password of the new user.
 * @param name The name of the new user.
 * @param bio The bio of the new user.
 * @returns The created user object.
 */
export const createUser = async (
  username: string,
  password: string,
  name: string,
  bio: string = ''
): Promise<User> => {
  const normalizedUsername = username.trim().toLowerCase();
  
  const existingUser = await getUserByUsername(normalizedUsername);
  if (existingUser) {
    throw new Error('Un utilisateur avec ce nom existe déjà');
  }

  const passwordHash = await hashPassword(password);
  
  const user: User = {
    id: Math.random().toString(36).substr(2, 9),
    username: normalizedUsername,
    passwordHash: passwordHash,
    name: name.trim(),
    bio: bio.trim(),
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  await saveUser(user);
  
  const usersIndex = await getUsersIndex();
  if (!usersIndex.includes(normalizedUsername)) {
    usersIndex.push(normalizedUsername);
    await saveUsersIndex(usersIndex);
  }

  return user;
};

/**
 * Get the currently authenticated user.
 * @returns The currently authenticated user or null if no user is authenticated.
 */
export const getUser = async (): Promise<User | null> => {
  try {
    const authenticatedUser = await getAuthenticatedUser();
    if (!authenticatedUser) {
      return null;
    }
    
    const userData = await getUserByUsername(authenticatedUser.username);
    return userData;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Update a user.
 * @param updates The updates to apply to the user.
 * @returns The updated user object.
 */
export const updateUser = async (updates: Partial<Omit<User, 'passwordHash'>>): Promise<User> => {
  const currentUser = await getUser();
  if (!currentUser) throw new Error('Aucun utilisateur connecté');

  const updatedUser = {
    ...currentUser,
    ...updates,
    lastLoginAt: Date.now(),
  };

  await saveUser(updatedUser);
  return updatedUser;
};

/**
 * Delete a user by their username.
 * @param username The username of the user to delete.
 */
export const deleteUser = async (username: string): Promise<void> => {
  const normalizedUsername = username.toLowerCase();
  
  await AsyncStorage.removeItem(`${USER_KEY_PREFIX}_${normalizedUsername}`);
  
  const usersIndex = await getUsersIndex();
  const newIndex = usersIndex.filter(u => u !== normalizedUsername);
  await saveUsersIndex(newIndex);
};

/**
 * Log in a user.
 * @param username The username of the user.
 * @param password The password of the user.
 * @returns The logged-in user object.
 */
export const loginUser = async (username: string, password: string): Promise<User> => {
  const normalizedUsername = username.trim().toLowerCase();
  const user = await getUserByUsername(normalizedUsername);
  
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  const passwordHash = await hashPassword(password);
  
  if (user.passwordHash !== passwordHash) {
    throw new Error('Mot de passe incorrect');
  }

  user.lastLoginAt = Date.now();
  await saveUser(user);
  
  return user;
};

/**
 * Get all users.
 * @returns All users sorted by last login date (most recent first).
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersIndex = await getUsersIndex();
    const users: User[] = [];
    
    for (const username of usersIndex) {
      const user = await getUserByUsername(username);
      if (user) {
        users.push(user);
      }
    }
    
    return users.sort((a, b) => b.lastLoginAt - a.lastLoginAt);
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};