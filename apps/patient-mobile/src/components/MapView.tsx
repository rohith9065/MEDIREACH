import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { MAP_HTML } from "./mapHtml";

export interface MapMarkerHospital {
  id: string;
  latitude: number;
  longitude: number;
}

interface MapViewProps {
  hospitals: MapMarkerHospital[];
  userLocation?: { latitude: number; longitude: number };
  ambulanceLocation?: { latitude: number; longitude: number } | null;
  onMarkerPress: (hospitalId: string) => void;
}

export function MapView({ hospitals, userLocation, ambulanceLocation, onMarkerPress }: MapViewProps) {
  const webviewRef = useRef<WebView>(null);
  const hasCenteredRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isReady) return;

    const payload = {
      hospitals: hospitals.map((h) => ({ id: h.id, latitude: h.latitude, longitude: h.longitude })),
      user: userLocation ?? null,
      recenter: !hasCenteredRef.current,
    };
    hasCenteredRef.current = true;

    webviewRef.current?.injectJavaScript(`window.setMapData(${JSON.stringify(payload)}); true;`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, hospitals, userLocation]);

  // Separate effect — an ambulance's position updates far more often than the hospital/user
  // markers, and should just glide the one marker rather than re-running the full diff above.
  useEffect(() => {
    if (!isReady) return;
    if (ambulanceLocation) {
      webviewRef.current?.injectJavaScript(
        `window.updateAmbulancePosition(${ambulanceLocation.latitude}, ${ambulanceLocation.longitude}); true;`,
      );
    } else {
      webviewRef.current?.injectJavaScript(`window.clearAmbulancePosition(); true;`);
    }
  }, [isReady, ambulanceLocation]);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === "mapReady") {
        setIsReady(true);
      } else if (message.type === "markerTap" && message.hospitalId) {
        onMarkerPress(message.hospitalId);
      }
    } catch {
      // ignore malformed messages from the page
    }
  }

  return (
    <WebView
      ref={webviewRef}
      originWhitelist={["*"]}
      source={{ html: MAP_HTML }}
      onMessage={handleMessage}
      style={styles.webview}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});
