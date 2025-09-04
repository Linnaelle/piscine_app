import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import { Dimensions, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../constants/theme';
import { getEntries } from '../storage/journal';
import { JournalEntry } from '../types/journal';

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

  const leafletHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
        <style>
          #map { position:absolute; top:0; bottom:0; right:0; left:0; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <script>
          var map = L.map('map').setView([48.8566, 2.3522], 5);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          const entries = ${JSON.stringify(entries)};
          var markers = [];

          entries.forEach(entry => {
            if (entry.latitude && entry.longitude) {
              var marker = L.marker([entry.latitude, entry.longitude]).addTo(map);
              markers.push([entry.latitude, entry.longitude]);
              marker.on('click', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify(entry));
              });
            }
          });

          if (markers.length > 0) {
            var bounds = L.latLngBounds(markers);
            map.fitBounds(bounds, { padding: [50, 50] }); // marge pour respirer
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={(event) => {
          try {
            const entry: JournalEntry = JSON.parse(event.nativeEvent.data);
            openPhotoModal(entry);
          } catch (e) {
            console.error("Erreur WebView:", e);
          }
        }}
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
  container: { flex: 1 },
  map: { flex: 1 },
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
});
