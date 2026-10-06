import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import * as driverService from "../services/driver";

const MIN_INTERVAL_MS = 5000;
const MIN_DISTANCE_METERS = 25;

export interface LatLng {
  latitude: number;
  longitude: number;
}

// Watches/broadcasts position whenever `active` is true — called with `isAvailable` from
// HomeScreen (keeps ambulances.latitude/longitude fresh while on-shift so nearest-available
// dispatch is accurate) and unconditionally from ActiveTripScreen while a trip is in progress.
// The server only writes trip *history* (ambulance_locations) when there's an active request
// for this ambulance — this hook doesn't need to know which case it's in. Also returns the
// last known position so callers can render it (e.g. the trip screen's own-position marker)
// without a second GPS subscription.
export function useLocationBroadcast(active: boolean): LatLng | null {
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const [position, setPosition] = useState<LatLng | null>(null);

  useEffect(() => {
    if (!active) {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      return;
    }

    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || cancelled) return;

      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: MIN_INTERVAL_MS, distanceInterval: MIN_DISTANCE_METERS },
        (loc) => {
          const next = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setPosition(next);
          driverService.updateLocation(next.latitude, next.longitude).catch(() => {});
        },
      );
      if (cancelled) {
        sub.remove();
        return;
      }
      subscriptionRef.current = sub;
    })();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [active]);

  return position;
}
