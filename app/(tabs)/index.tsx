import { colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { addEntry } from '../storage/journal';
import { JournalEntry } from '../types/journal';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Permission de localisation requise pour enregistrer la position des photos');
    }
  };

  const getCurrentPosition = async (): Promise<{ latitude: number; longitude: number }> => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.log('Geolocation error:', error);
      return { latitude: 44.2023, longitude: 1.1237 };
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      
      if (!photo?.uri) {
        throw new Error('Aucune photo capturée');
      }

      const position = await getCurrentPosition();
      
      const now = new Date();
      const entry: JournalEntry = {
        id: Date.now().toString(),
        uri: photo.uri,
        latitude: position.latitude,
        longitude: position.longitude,
        timestamp: now.getTime(),
        dateKey: now.toISOString().split('T')[0],
      };

      await addEntry(entry);
      Alert.alert('Succès', 'Photo sauvegardée avec succès');
      
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Permission de caméra requise</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.text}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing={facing}
        ref={cameraRef}
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <Text style={styles.title}>Capture ton voyage</Text>
          </View>
          
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.captureBtn, isCapturing && styles.capturingBtn]}
              onPress={takePicture}
              disabled={isCapturing}
            >
              <MaterialIcons 
                name="camera" 
                size={40} 
                color={isCapturing ? colors.muted : colors.text} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: colors.text,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  bottomBar: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.text,
  },
  capturingBtn: {
    backgroundColor: colors.muted,
    borderColor: colors.muted,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.bg,
  },
});
