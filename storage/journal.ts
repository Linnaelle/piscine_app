import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalEntry } from '../types/journal';
import { getAuthenticatedUser } from './auth';

const BASE_KEY = 'TRAVEL_JOURNAL_ENTRIES_V2';

const getUserEntriesKey = async (): Promise<string> => {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('Utilisateur non authentifié');
  }
  return `${BASE_KEY}_${user.id}`;
};

export async function getEntries(): Promise<JournalEntry[]> {
  try {
    const key = await getUserEntriesKey();
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as JournalEntry[]) : [];
  } catch (error) {
    console.error('Error getting entries:', error);
    return [];
  }
}

export async function addEntry(entry: JournalEntry): Promise<void> {
  try {
    const key = await getUserEntriesKey();
    const all = await getEntries();
    all.unshift(entry);
    await AsyncStorage.setItem(key, JSON.stringify(all));
  } catch (error) {
    console.error('Error adding entry:', error);
    throw error;
  }
}

export async function getEntriesByDate(dateKey: string): Promise<JournalEntry[]> {
  try {
    const all = await getEntries();
    return all.filter(e => e.dateKey === dateKey);
  } catch (error) {
    console.error('Error getting entries by date:', error);
    return [];
  }
}

export async function getMarkedDates(): Promise<Record<string, { marked: boolean; dots?: any }>> {
  try {
    const all = await getEntries();
    const marks: Record<string, { marked: boolean }> = {};
    all.forEach(e => (marks[e.dateKey] = { marked: true }));
    return marks;
  } catch (error) {
    console.error('Error getting marked dates:', error);
    return {};
  }
}