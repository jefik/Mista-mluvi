import { useRef, useState } from "react";
import { usePins, useCreatePin } from "../hooks/usePins";
import { MapContainer, TileLayer, useMapEvents, useMap, GeoJSON } from "react-leaflet";
import { Marker, Popup, Rectangle } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet/dist/leaflet.css";

// Components imports
import { WorldOverlay } from "./WorldOverlay";
import { MapyLogo } from "./MapyLogo";
import { WelcomeOverlay } from "./WelcomeOverlay";
// Utils imports
import { isInsideCzechia } from "../utils/GeoUtils";
import { getValidationError } from "../utils/PinValidation";
import { savedPin, previewPin } from "../utils/mapIcons";
import { formatCzechDate } from "../utils/DateUtils";
// Hooks imports
import { useAntiSpamTimer } from "../hooks/useAntiSpamTimer";
import { useMapControls } from "../hooks/useMapControls";
import { useWindowSize } from "../hooks/useWindowSize";

export default function MapLeaflet() {
  // Pins message
  const textareaRef = useRef(null);

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

  // --- Map click ---
  // Func to handle every interaction on the map
  function MapClickHandler() {
    // --- Anti spam ---
    // For anti spam
    const [isSubmitting, setIsSubmitting] = useState(false);
    const botCatchRef = useRef(null);
    const [inputMessage, setInputMessage] = useState("");
    // Prevent spam, checks if the user is in a set coldown 10s
    const { isWaiting, remaining } = useAntiSpamTimer(30000); // using hook

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

    // --- Save button ---
    // Func for handling save button
    const handleSave = () => {
      setInputMessage("");
      // Anti bot spam
      if (botCatchRef.current?.value) {
        setDraftPin(null);
        setMapLock(false);
        return;
      }

      // --- Inputs validations ---
      // Message from pin
      const message = textareaRef.current?.value.trim();
      // Get validation error string
      const error = getValidationError(message);
      if (error) {
        setInputMessage(error);
        return;
      }

      setIsSubmitting(true);
      createPinMutation.mutate(
        {
          latitude: draftPin.lat,
          longitude: draftPin.lng,
          message: message,
          created_at: draftPin.created_at,
        },
        {
          onSuccess: () => {
            localStorage.setItem("last_pin_timestamp", Date.now().toString());
            setDraftPin(null);
            setMapLock(false);
            setIsSubmitting(false);
          },
          onError: (error) => {
            setIsSubmitting(false);
            console.error("Chyba při ukládání:", error);
            alert("Něco se nepovedlo. Zkuste to za chvíli.");
          },
        },
      );
    };

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

        // Reset error inputMessage when making new pin
        setInputMessage("");

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
        <Marker
          key={`${draftPin.lat}-${draftPin.lng}`}
          position={[draftPin.lat, draftPin.lng]}
          icon={previewPin}
          eventHandlers={{
            add: (e) => {
              e.target.openPopup();
            },
          }}
        >
          <Popup
            closeButton={false}
            autoClose={false}
            closeOnClick={false}
            autoPanPadding={[50, 50]}
            className="custom-form"
          >
            <div className="card-layout" onClick={(e) => e.stopPropagation()}>
              <div className="card shadow-lg">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h6 className="">Zanechte vzkaz</h6>

                  <button
                    className="btn-custom-close"
                    onClick={() => {
                      setDraftPin(null);
                      setMapLock(false);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                    </svg>
                  </button>
                </div>

                <div className="card-body pt-0">
                  <p className="seconds-warning">
                    {inputMessage ? inputMessage : isWaiting ? `Další vzkaz můžete uložit za ${remaining}s` : ""}
                  </p>

                  <div className="card-input-nt">
                    <input ref={botCatchRef} type="text" id="name" name="name" tabIndex="-1" autoComplete="off" />
                  </div>
                  <textarea
                    className={`form-control ${inputMessage ? "is-invalid" : ""}`}
                    rows={3}
                    autoFocus
                    ref={textareaRef}
                    placeholder="Co se vám honí hlavou..."
                    id="pin-message"
                    name="message"
                  />
                  <div className="d-flex justify-content-end gap-2 mt-2">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        setDraftPin(null);
                        setMapLock(false);
                      }}
                    >
                      Zrušit
                    </button>

                    <button
                      className="btn btn-sm btn-primary"
                      onClick={handleSave}
                      disabled={isWaiting || isSubmitting}
                    >
                      Uložit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>

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
          {pins.map((pin) => (
            <Marker
              key={pin.id}
              position={[pin.latitude, pin.longitude]}
              icon={savedPin}
              eventHandlers={{
                popupopen: (e) => {
                  const map = e.target._map;
                  map.setMaxBounds([
                    [45.0, 5.0],
                    [55.0, 25.0],
                  ]);
                  const popup = e.popup.getElement();
                  if (popup) {
                    popup.classList.add("custom-message");
                  }
                },
                popupclose: (e) => {
                  const map = e.target._map;
                  map.setMaxBounds([
                    [48.55, 12.09],
                    [51.06, 18.87],
                  ]);
                },
              }}
            >
              <Popup closeButton={false} autoClose={false} closeOnClick={false} autoPanPadding={[50, 50]}>
                <div className="pin-message">
                  <p>{pin.message}</p>
                  <p className="pin-date">Zanecháno dne: {formatCzechDate(pin.created_at)}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </>
  );
}
