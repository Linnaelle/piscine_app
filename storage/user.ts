import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  bio: string;
  createdAt: number;
  lastLoginAt: number;
};

const USER_STORAGE_KEY = 'TRAVEL_JOURNAL_USER_V2';

const hashPassword = async (password: string): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
};

export const createUser = async (
  username: string,
  password: string,
  name: string,
  bio: string = ''
): Promise<User> => {
  const passwordHash = await hashPassword(password);

  const user: User = {
    id: Math.random().toString(36).substr(2, 9),
    username: username.trim().toLowerCase(),
    passwordHash: passwordHash,
    name: name.trim(),
    bio: bio.trim(),
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  return user;
};

export const getUser = async (): Promise<User | null> => {
  const data = await AsyncStorage.getItem(USER_STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const updateUser = async (updates: Partial<Omit<User, 'passwordHash'>>): Promise<User> => {
  const currentUser = await getUser();
  if (!currentUser) throw new Error('No user found');

  const updatedUser = {
    ...currentUser,
    ...updates,
    lastLoginAt: Date.now(),
  };

  await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
  return updatedUser;
};

export const deleteUser = async (): Promise<void> => {
  await AsyncStorage.removeItem(USER_STORAGE_KEY);
};



export const loginUser = async (username: string, password: string): Promise<User> => {
  const data = await AsyncStorage.getItem(USER_STORAGE_KEY);
  if (!data) throw new Error('Aucun utilisateur trouvé');

  const user: User = JSON.parse(data);
  const passwordHash = await hashPassword(password);

  if (user.username !== username.trim().toLowerCase() || user.passwordHash !== passwordHash) {
    throw new Error('Identifiants incorrects');
  }

  user.lastLoginAt = Date.now();
  await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  return user;
};