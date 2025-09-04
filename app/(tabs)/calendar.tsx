import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { colors } from '../../constants/theme';
import { getEntriesByDate, getMarkedDates } from '../../storage/journal';
import { JournalEntry } from '../../types/journal';

export default function CalendarScreen() {
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selected, setSelected] = useState<string | undefined>();
  const [items, setItems] = useState<JournalEntry[]>([]);

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

  const renderPhotoItem = ({ item, index }: { item: JournalEntry; index: number }) => (
    <TouchableOpacity 
      style={[
        styles.gridItem,
        { marginLeft: index % 2 === 0 ? 0 : 8 }
      ]}
      onPress={() => {
        console.log('Photo pressed:', item.id);
      }}
    >
      <Image 
        source={{ uri: item.uri }} 
        style={styles.photoImage}
        resizeMode="cover"
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
    <View style={styles.container}>
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
            Photos du {new Date(selected).toLocaleDateString('fr-FR', {
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

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.photosList}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selected 
                ? "Aucune photo pour cette date"
                : "Sélectionnez une date avec des points bleus 🔵"
              }
            </Text>
          </View>
        }
        renderItem={renderPhotoItem}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.bg,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  calendar: {
    borderRadius: 12,
    margin: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  selectedDateContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDateText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  photoCount: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  photosList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
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
});