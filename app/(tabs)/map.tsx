import { colors } from '@/constants/theme';
import { addEntry, getEntries } from '@/storage/journal';
import { JournalEntry } from '@/types/journal';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Dimensions, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<JournalEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadEntries();
    }, [])
  );

  const loadEntries = async () => {
    const allEntries = await getEntries();
    setEntries(allEntries);
  };

  const openPhotoModal = (entry: JournalEntry) => {
    setSelectedPhoto(entry);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPhoto(null);
  };

  // 📸 Prendre une photo + récupérer coordonnées GPS
  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      exif: true, // ⚡ important pour récupérer GPS
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const { uri, exif } = asset;

      const latitude = exif?.GPSLatitude;
      const longitude = exif?.GPSLongitude;

      if (latitude && longitude) {
        const timestamp = Date.now();
        const dateKey = new Date(timestamp).toISOString().split('T')[0]; // format AAAA-MM-JJ

        const newEntry: JournalEntry = {
          id: timestamp.toString(),
          uri,
          latitude,
          longitude,
          timestamp,
          dateKey,
        };

        await addEntry(newEntry);
        await loadEntries(); // recharge pour voir le marker
      } else {
        alert("La photo ne contient pas de coordonnées GPS !");
      }
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 48.8566,
          longitude: 2.3522,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* Couche MapTiler avec clé API */}
        <UrlTile
          urlTemplate="https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=Y18ZcM0cJEbWYunGe8jH"
          maximumZ={19}
          zIndex={-1}
        />

        {entries.map((entry) => (
          <Marker
            key={entry.id}
            coordinate={{
              latitude: entry.latitude,
              longitude: entry.longitude,
            }}
            onPress={() => openPhotoModal(entry)}
          >
            <View style={styles.markerContainer}>
              <MaterialIcons name="camera-alt" size={24} color={colors.primary} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Attribution légale */}
      <View style={styles.attribution}>
        <Text style={styles.attributionText}>
          © MapTiler © OpenStreetMap contributors
        </Text>
      </View>

      {/* Bouton flottant pour prendre une photo */}
      <TouchableOpacity style={styles.fab} onPress={pickImage}>
        <MaterialIcons name="add-a-photo" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal d’affichage photo */}
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
                <Text style={styles.photoDate}>
                  {new Date(selectedPhoto.timestamp).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
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
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: colors.bg,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
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
  photoDate: {
    color: colors.text,
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  attribution: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attributionText: {
    color: '#fff',
    fontSize: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 30,
    padding: 16,
    elevation: 5,
  },
});
