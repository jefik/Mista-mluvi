import { useRef, useState, useMemo } from "react";
import { usePins, useCreatePin } from "../hooks/usePins";
import { MapContainer, TileLayer, useMapEvents, useMap } from "react-leaflet";
import { Marker, Popup, Rectangle } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet/dist/leaflet.css";

// Components imports
import { WorldOverlay } from "./WorldOverlay";
import { MapyLogo } from "./MapyLogo";
import { WelcomeOverlay } from "./WelcomeOverlay";
import { SavedPin } from "./SavedPin";
import { DraftPinForm } from "./DraftPinForm";
// Utils imports
import { isInsideCzechia } from "../utils/GeoUtils";

// Hooks imports
import { useMapControls } from "../hooks/useMapControls";
import { useWindowSize } from "../hooks/useWindowSize";

export default function MapLeaflet() {
  // Database requests
  const { data: pins = [] } = usePins();
  const createPinMutation = useCreatePin();

  // Detect if its under 625 for mobile and 1225 for bigger devices
  const { isMobile, isTablet } = useWindowSize();
  // Adjust values of map zooms for responsivity
  const MAP_SETTINGS = {
    initialZoom: isMobile ? 6 : isTablet ? 7 : 8,
    minZoom: isMobile ? 6 : isTablet ? 7 : 8,
    clusterRadius: isMobile ? 60 : 80,
  };

  // Func to only re-render pins when new pin is added
  const renderedPins = useMemo(() => {
    return pins.map((pin) => <SavedPin key={pin.id} pin={pin} />);
  }, [pins]);

  // --- Map click ---
  // Func to handle every interaction on the map
  function MapClickHandler() {
    // --- Map ---
    // For map
    const map = useMap();
    const [draftPin, setDraftPin] = useState(null);
    const setMapLock = useMapControls(map);

    // --- Lock map ---
    // Func to unlock and lock dragging on map, if map havent been zoomed
    const updateDragging = () => {
      const zoom = map.getZoom();
      if (zoom <= MAP_SETTINGS.minZoom) {
        map.dragging.disable();
      } else if (!draftPin) {
        map.dragging.enable();
      }
    };
    // Check instantly if map wasnt zoomed on load
    updateDragging();

    useMapEvents({
      zoomend: () => {
        updateDragging();
      },
      // Create new draft pin on map click
      click(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Check if click is outside of czech republic
        if (!isInsideCzechia(lat, lng)) {
          return;
        }

        // Lock the map when pin is beeing made
        setMapLock(true);

        setDraftPin({ lat, lng, message: "", created_at: new Date().toISOString() });
      },

      // Escape handler to cancel pin creation
      keydown(e) {
        if (e.originalEvent.key === "Escape") {
          setDraftPin(null);
          setMapLock(false);
          updateDragging();
          map.closePopup();
        }
      },
    });

    // Dont render anything if pin is not beeing made
    if (!draftPin) return null;

    return (
      <>
        <DraftPinForm
          draftPin={draftPin}
          setDraftPin={setDraftPin}
          setMapLock={setMapLock}
          createPinMutation={createPinMutation}
        />

        <Rectangle
          bounds={[
            [-90, -180],
            [90, 180],
          ]}
          pathOptions={{
            fillColor: "black",
            fillOpacity: 0.45,
            stroke: false,
          }}
          eventHandlers={{
            click: (e) => {
              // Prevent creating a new pin under the overlay
              L.DomEvent.stopPropagation(e);
              setDraftPin(null);
              setMapLock(false);
            },
          }}
        />
      </>
    );
  }

  return (
    <>
      <WelcomeOverlay />
      <MapContainer
        center={[49.8, 15.5]}
        zoom={MAP_SETTINGS.initialZoom}
        minZoom={MAP_SETTINGS.minZoom}
        maxZoom={18}
        zoomSnap={0.5} // Enable 0.5 values
        maxBounds={[
          [48.55, 12.09],
          [51.06, 18.87],
        ]}
        className="dark-theme"
        maxBoundsViscosity={1}
        renderer={L.svg({ padding: 3 })} // Rendering more outside then loaded map
      >
        <WorldOverlay />

        <TileLayer
          url={`https://api.mapy.com/v1/maptiles/basic/256/{z}/{x}/{y}?apikey=${import.meta.env.VITE_MAP_API_KEY}`}
          attribution='<a href="https://api.mapy.com/copyright" target="_blank">&copy; Seznam.cz</a>'
        />
        <MapyLogo />
        <MapClickHandler />

        <MarkerClusterGroup showCoverageOnHover={false} maxClusterRadius={MAP_SETTINGS.clusterRadius}>
          {renderedPins}
        </MarkerClusterGroup>
      </MapContainer>
    </>
  );
}
