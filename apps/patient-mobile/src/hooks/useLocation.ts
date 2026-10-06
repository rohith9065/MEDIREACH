import { useEffect, useState } from "react";
import * as Location from "expo-location";

// Falls back to this when permission is denied or unavailable (common on a fresh emulator
// with no configured mock location) — same coordinates the seed data uses, so the demo still
// shows real nearby hospitals instead of an empty screen.
export const DEFAULT_LOCATION = { latitude: 12.9716, longitude: 77.5946 };

export interface UseLocationResult {
  latitude: number;
  longitude: number;
  isDefault: boolean;
  isLoading: boolean;
  permissionDenied: boolean;
}

export function useLocation(): UseLocationResult {
  const [state, setState] = useState<UseLocationResult>({
    ...DEFAULT_LOCATION,
    isDefault: true,
    isLoading: true,
    permissionDenied: false,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (!cancelled) {
            setState((prev) => ({ ...prev, isLoading: false, permissionDenied: true }));
          }
          return;
        }

        const position = await Location.getCurrentPositionAsync({});
        if (!cancelled) {
          setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            isDefault: false,
            isLoading: false,
            permissionDenied: false,
          });
        }
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
