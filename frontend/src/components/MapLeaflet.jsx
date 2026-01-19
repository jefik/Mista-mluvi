import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { usePins, useCreatePin } from "../hooks/usePins";
import { MapContainer, TileLayer, useMapEvents, useMap } from "react-leaflet";
import { Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export default function MapLeaflet() {
  // Icons
  const savedPin = L.icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  const previewPin = L.icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  // Pins
  const textareaRef = useRef(null); // message formu pro přidanfi pinu
  const [showForm, setShowForm] = useState(false);

  // Hover modal
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [hoverPin, setHoverPin] = useState(null);

  // Ref for the map instance
  const mapRef = useRef(null);

  // Database requests
  const { data: pins = [] } = usePins();
  const createPinMutation = useCreatePin();

  function MapClickHandler({ onClick }) {
    const map = useMap();

    const [draftPin, setDraftPin] = useState(null);
    const [showError, setShowError] = useState(false);
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        const point = map.latLngToContainerPoint([lat, lng]);
        const targetPoint = L.point(point.x, point.y - 150);
        const targetLatLng = map.containerPointToLatLng(targetPoint);

        map.panTo(targetLatLng, { animate: true, duration: 0.5 });

        setDraftPin({ lat, lng, message: "" });
        setShowError(false);
      },
    });

    // Quit pin form by Esc key
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setDraftPin(null);
      }
    };
    window.addEventListener("keydown", handleEsc);

    return draftPin === null ? null : (
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
          className="custom-popup"
        >
          <div style={{ width: "300px" }} onClick={(e) => e.stopPropagation()}>
            <div className="card shadow-lg border-0">
              <div className="card-header bg-white border-0 py-2 d-flex justify-content-between align-items-center">
                <strong className="small">Nová zpráva</strong>
                <button
                  className="btn-close"
                  onClick={() => {
                    setDraftPin(null);
                  }}
                />
              </div>

              <div className="card-body pt-0">
                <textarea
                  className={`form-control ${showError ? "is-invalid" : ""}`}
                  rows={3}
                  autoFocus
                  ref={textareaRef}
                />

                <div className="d-flex justify-content-end gap-2 mt-2">
                  <button
                    className="btn btn-sm btn-light"
                    onClick={() => {
                      setDraftPin(null);
                    }}
                  >
                    Zrušit
                  </button>

                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      draftPin.message = textareaRef.current.value;
                      if (!draftPin.message.trim()) {
                        setShowError(true);
                        return;
                      }
                      createPinMutation.mutate({
                        latitude: draftPin.lat,
                        longitude: draftPin.lng,
                        message: draftPin.message,
                      });
                      setDraftPin(null);
                    }}
                  >
                    Uložit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Popup>
      </Marker>
    );
  }

  // Lock map interaction when form is shown
  useEffect(() => {
    // Only initialize map if not already initialized
    if (!mapRef.current) return;

    // Get map
    const map = mapRef.current;

    if (showForm) {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      /* if (map.tap) map.tap.disable(); */
    } else {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      /* if (map.tap) map.tap.enable(); */
    }
  }, [showForm]);

  return (
    <MapContainer
      center={[49.8, 15.5]}
      zoom={7}
      minZoom={8}
      maxZoom={22}
      maxBounds={[
        [48.55, 12.09],
        [51.06, 18.87],
      ]}
      style={{ height: "100vh", position: "relative" }}
    >
      <TileLayer
        url={`https://api.mapy.com/v1/maptiles/basic/256/{z}/{x}/{y}?apikey=${import.meta.env.VITE_MAP_API_KEY}`}
        attribution='<a href="https://api.mapy.com/copyright" target="_blank">&copy; Seznam.cz</a>'
      />
      <MapClickHandler />
      <MarkerClusterGroup>
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            icon={savedPin}
            eventHandlers={{
              mouseover: (e) => {
                e.target.openPopup();
              },
              mouseout: (e) => {
                e.target.closePopup();
              },
            }}
          >
            <Popup
              closeButton={false}
              autoClose={false}
              closeOnClick={false}
              offset={[0, -20]}
            >
              <div style={{ width: "200px", pointerEvents: "none" }}>
                {pin.message}
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
      {/* 
      {draftPin && (
        <div
          className="position-absolute w-100 h-100"
          style={{
            zIndex: 999, // vyšší než mapa, ale nižší než popup (popup má defaultně 1000+)
            backgroundColor: "rgba(0,0,0,0.3)",
            top: 0,
            left: 0,
          }}
          onClick={() => {
            setDraftPin(null); // odstraní draft pin
            setShowForm(false); // zavře popup
          }}
        />
      )} */}

      {/* {hoverPin && (
        <div
          className="position-absolute bg-white p-3 border rounded shadow-sm"
          style={{
            top: hoverPosition.y,
            left: hoverPosition.x,
            zIndex: 1050,
            maxWidth: "250px",
            pointerEvents: "none",
            transform: "translate(-50%, -102%) translateY(55px)",
          }}
        >
          <div className="small">{hoverPin.message}</div>
        </div>
      )} */}
    </MapContainer>
  );
}
