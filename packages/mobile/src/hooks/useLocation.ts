/**
 * Location + Camera hooks for the mobile report flow.
 * Wraps Expo Location and Image Picker with clean async interfaces.
 */

import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

export interface Coords {
  lng: number;
  lat: number;
}

/** Request foreground location permission and get the current position. */
export function useLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(async (): Promise<Coords | null> => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Please enable in Settings.');
        setLoading(false);
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const result = {
        lng: pos.coords.longitude,
        lat: pos.coords.latitude,
      };
      setCoords(result);
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
      setLoading(false);
      return null;
    }
  }, []);

  return { coords, loading, error, getLocation };
}

/** Camera hook — launches the camera and returns a base64 image. */
export function useCamera() {
  const [photo, setPhoto] = useState<string | null>(null); // base64 or URI
  const [loading, setLoading] = useState(false);

  const takePhoto = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].base64 || result.assets[0].uri);
      }
    } catch {
      // Camera error — silently fail
    }
    setLoading(false);
  }, []);

  const clearPhoto = useCallback(() => setPhoto(null), []);

  return { photo, loading, takePhoto, clearPhoto };
}
