import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { colors } from '../constants/theme';
import { getEntriesByDate, getMarkedDates } from '../storage/journal';
import { JournalEntry } from '../types/journal';

const { width, height } = Dimensions.get('window');

export default function CalendarScreen() {
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selected, setSelected] = useState<string | undefined>();
  const [items, setItems] = useState<JournalEntry[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<JournalEntry | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadMarkedDates();
    }, [])
  );

  const loadMarkedDates = async () => {
    try {
      const dates = await getMarkedDates();
      setMarkedDates(dates);
    } catch (error) {
      console.error('Error loading marked dates:', error);
    }
  };

  useEffect(() => {
    const loadEntriesForDate = async () => {
      if (selected) {
        try {
          const entries = await getEntriesByDate(selected);
          setItems(entries);
        } catch (error) {
          console.error('Error loading entries for date:', error);
          setItems([]);
        }
      } else {
        setItems([]);
      }
    };
    
    loadEntriesForDate();
  }, [selected]);

  const calendarMarked = useMemo(
    () => ({
      ...markedDates,
      ...(selected
        ? { 
            [selected]: { 
              selected: true, 
              marked: !!markedDates[selected]?.marked,
              selectedColor: colors.primary,
              selectedTextColor: colors.bg
            } 
          }
        : {}),
    }),
    [markedDates, selected]
  );

  const openPhotoModal = (entry: JournalEntry) => {
    setSelectedPhoto(entry);
    setModalVisible(true);
  };
  
  const closeModal = () => {
    setSelectedPhoto(null);
    setModalVisible(false);
  };

  const renderPhotoItem = ({ item, index }: { item: JournalEntry; index: number }) => (
    <TouchableOpacity 
      style={[
        styles.gridItem,
        { marginLeft: index % 2 === 0 ? 0 : 8 }
      ]}
      onPress={() => openPhotoModal(item)}
    >
      <Image 
        source={{ uri: item.uri }} 
        style={styles.photoImage}
      />
      <View style={styles.photoOverlay}>
        <Text style={styles.photoTime}>
          {new Date(item.timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View>
        <Text style={styles.title}>Calendrier</Text>
        
        <Calendar
          onDayPress={(day: any) => setSelected(day.dateString)}
          markedDates={calendarMarked}
          theme={{
            calendarBackground: colors.bg,
            dayTextColor: colors.text,
            monthTextColor: colors.text,
            todayTextColor: colors.primary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.bg,
            textSectionTitleColor: colors.muted,
            arrowColor: colors.primary,
            disabledArrowColor: colors.muted,
            dotColor: colors.primary,
            selectedDotColor: colors.bg,
            backgroundColor: colors.bg,
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600',
          }}
          style={styles.calendar}
        />

        {selected && (
            <View style={styles.selectedDateContainer}>
              <Text style={styles.selectedDateText}>
                {new Date(selected).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              <Text style={styles.photoCount}>
                {items.length} photo{items.length !== 1 ? 's' : ''}
              </Text>
            </View>
        )}

        <View style={styles.photosContainer}>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.photosList}
            numColumns={2}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {selected 
                    ? "Aucune photo pour cette date"
                    : "Sélectionnez une date pour voir les photos correspondantes"
                  }
                </Text>
              </View>
            }
            renderItem={renderPhotoItem}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        </View>
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.bg,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 50,
    paddingBottom: 10,
  },
  calendar: {
    borderRadius: 12,
    margin: 18,
    elevation: 5,
    shadowColor: '#FF2800'
  },
  selectedDateContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedDateText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoCount: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  gridItem: {
    flex: 0.5,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  photosContainer: {
    paddingBottom: 20,
  },
  photosList: {
    paddingHorizontal: 16,
  },
  photoImage: {
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
  photoTime: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
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
  photoDate: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
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