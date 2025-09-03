import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalEntry } from '../types/journal';

const KEY = 'TRAVEL_JOURNAL_ENTRIES_V1';

export async function getEntries(): Promise<JournalEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as JournalEntry[]) : [];
  } catch (error) {
    console.error('Error getting entries:', error);
    return [];
  }
}

export async function addEntry(entry: JournalEntry): Promise<void> {
  try {
    const all = await getEntries();
    all.unshift(entry); // plus récent en premier
    await AsyncStorage.setItem(KEY, JSON.stringify(all));
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