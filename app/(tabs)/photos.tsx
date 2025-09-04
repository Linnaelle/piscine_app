import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../constants/theme';
import { getEntries } from '../storage/journal';
import { JournalEntry } from '../types/journal';

const { width, height } = Dimensions.get('window');

export default function PhotosScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<JournalEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadEntries();
    }, [])
  );

  const loadEntries = async () => {
    const allEntries = await getEntries();
    setEntries(allEntries);
  };

  const uniqueDates = useMemo(() => {
    const dates = [...new Set(entries.map(entry => entry.dateKey))].sort().reverse();
    return dates;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (dateFilter === 'all') return entries;
    return entries.filter(entry => entry.dateKey === dateFilter);
  }, [entries, dateFilter]);

  const openPhotoModal = (entry: JournalEntry) => {
    setSelectedPhoto(entry);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPhoto(null);
  };

  const formatDate = (dateKey: string) => {
    return new Date(dateKey).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderPhotoItem = ({ item }: { item: JournalEntry }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => openPhotoModal(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.photoThumbnail} />
      <View style={styles.photoOverlay}>
        <Text style={styles.photoDate}>
          {new Date(item.timestamp).toLocaleDateString('fr-FR', {day: '2-digit',month: '2-digit',})}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Photos ({filteredEntries.length})</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <MaterialIcons name="filter-list" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filtrer par date:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={dateFilter}
              onValueChange={(itemValue) => setDateFilter(itemValue)}
              style={styles.picker}
              dropdownIconColor={colors.primary}
            >
              <Picker.Item label="Toutes les dates" value="all" color={colors.text} />
              {uniqueDates.map(date => (
                <Picker.Item
                  key={date}
                  label={formatDate(date)}
                  value={date}
                  color={colors.text}
                />
              ))}
            </Picker>
          </View>
        </View>
      )}

      <FlatList
        data={filteredEntries}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.photoList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="photo-library" size={64} color={colors.muted} />
            <Text style={styles.emptyText}>Aucune photo</Text>
            <Text style={styles.emptySubtext}>
              Commencez à capturer vos voyages !
            </Text>
          </View>
        }
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <MaterialIcons name="close" size={30} color={colors.text} />
            </TouchableOpacity>
            
            {selectedPhoto && (
              <>
                <Image source={{ uri: selectedPhoto.uri }} style={styles.modalImage} />
                <View style={styles.photoInfo}>
                  <Text style={styles.modalDate}>
                    {new Date(selectedPhoto.timestamp).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.modalLocation}>
                    📍 {selectedPhoto.latitude.toFixed(4)}, {selectedPhoto.longitude.toFixed(4)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
  },
  filterButton: {
    padding: 8,
  },
  filterContainer: {
    backgroundColor: colors.card,
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  filterLabel: {
    color: colors.text,
    fontSize: 16,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: colors.bg,
    borderRadius: 8,
  },
  picker: {
    color: colors.text,
  },
  photoList: {
    padding: 8,
  },
  photoItem: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  photoDate: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: colors.card,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: colors.bg,
    borderRadius: 20,
    padding: 5,
  },
  modalImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginTop: 20,
  },
  photoInfo: {
    marginTop: 15,
    alignItems: 'center',
  },
  modalDate: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalLocation: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
});