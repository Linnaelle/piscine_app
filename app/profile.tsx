import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { colors } from '../constants/theme';
import { getEntries } from '../storage/journal';

const USER_KEY = 'TRAVEL_JOURNAL_USER_V1';

type UserData = {
  name: string;
  bio: string;
};

type Stats = {
  total: number;
  days: number;
  locations: number;
  firstPhoto?: Date;
  lastPhoto?: Date;
};

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [stats, setStats] = useState<Stats>({ total: 0, days: 0, locations: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadUserData(), loadStats()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      if (userData) {
        const parsed: UserData = JSON.parse(userData);
        setName(parsed.name || '');
        setBio(parsed.bio || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadStats = async () => {
    try {
      const entries = await getEntries();
      const uniqueDays = new Set(entries.map(entry => entry.dateKey));
      const uniqueLocations = new Set(
        entries.map(entry => `${entry.latitude.toFixed(3)},${entry.longitude.toFixed(3)}`)
      );
      
      const timestamps = entries.map(entry => entry.timestamp).sort((a, b) => a - b);
      const firstPhoto = timestamps.length > 0 ? new Date(timestamps[0]) : undefined;
      const lastPhoto = timestamps.length > 0 ? new Date(timestamps[timestamps.length - 1]) : undefined;

      setStats({
        total: entries.length,
        days: uniqueDays.size,
        locations: uniqueLocations.size,
        firstPhoto,
        lastPhoto,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({ total: 0, days: 0, locations: 0 });
    }
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre nom');
      return;
    }

    setIsSaving(true);
    try {
      const userData: UserData = { name: name.trim(), bio: bio.trim() };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      Alert.alert('Succès', 'Profil enregistré avec succès');
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer le profil');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Mon Profil</Text>
      
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nom *</Text>
          <TextInput
            placeholder="Votre nom"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            style={styles.input}
            maxLength={50}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            placeholder="Parlez-nous de vous..."
            placeholderTextColor={colors.muted}
            value={bio}
            onChangeText={setBio}
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={200}
          />
          <Text style={styles.characterCount}>
            {bio.length}/200 caractères
          </Text>
        </View>
        
        <TouchableOpacity 
          onPress={save} 
          style={[
            styles.saveButton, 
            (!name.trim() || isSaving) && styles.saveButtonDisabled
          ]}
          disabled={!name.trim() || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.bg} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Statistiques de voyage</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Photos totales</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.days}</Text>
            <Text style={styles.statLabel}>Jours photographiés</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.locations}</Text>
            <Text style={styles.statLabel}>Lieux visités</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {stats.total > 0 ? (stats.total / Math.max(stats.days, 1)).toFixed(1) : '0'}
            </Text>
            <Text style={styles.statLabel}>Photos/jour</Text>
          </View>
        </View>

        {stats.firstPhoto && (
          <View style={styles.dateInfoContainer}>
            <View style={styles.dateInfo}>
              <Text style={styles.dateInfoLabel}>Première photo :</Text>
              <Text style={styles.dateInfoValue}>{formatDate(stats.firstPhoto)}</Text>
            </View>
            
            {stats.lastPhoto && stats.firstPhoto.getTime() !== stats.lastPhoto.getTime() && (
              <View style={styles.dateInfo}>
                <Text style={styles.dateInfoLabel}>Dernière photo :</Text>
                <Text style={styles.dateInfoValue}>{formatDate(stats.lastPhoto)}</Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.bg 
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text,
    marginTop: 16,
    fontSize: 16,
  },
  title: { 
    color: colors.text, 
    fontSize: 28, 
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  form: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 52,
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.muted,
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: colors.card,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statsTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.bg,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  statNumber: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  dateInfoContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.muted + '40',
    paddingTop: 16,
  },
  dateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateInfoLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  dateInfoValue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});