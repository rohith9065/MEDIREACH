import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { MAP_HTML } from "./mapHtml";

interface MapViewProps {
  pickup?: { latitude: number; longitude: number } | null;
  selfPosition?: { latitude: number; longitude: number } | null;
}

export function MapView({ pickup, selfPosition }: MapViewProps) {
  const webviewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (pickup) {
      webviewRef.current?.injectJavaScript(`window.setPickup(${pickup.latitude}, ${pickup.longitude}); true;`);
    } else {
      webviewRef.current?.injectJavaScript(`window.setPickup(null, null); true;`);
    }
  }, [isReady, pickup]);

  useEffect(() => {
    if (!isReady || !selfPosition) return;
    webviewRef.current?.injectJavaScript(
      `window.setSelfPosition(${selfPosition.latitude}, ${selfPosition.longitude}); true;`,
    );
  }, [isReady, selfPosition]);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === "mapReady") {
        setIsReady(true);
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
