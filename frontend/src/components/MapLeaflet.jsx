import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { usePins, useCreatePin } from "../hooks/usePins";
import { MapContainer, TileLayer, useMapEvents, useMap } from "react-leaflet";
import { Marker, Popup, Rectangle } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

function MapyLogo() {
  const map = useMap();

  // Only add the control if it hasn't been added yet
  if (!map.hasLogoControl) {
    const LogoControl = L.Control.extend({
      options: { position: "bottomleft" },
      onAdd: function () {
        const container = L.DomUtil.create("div");
        const link = L.DomUtil.create("a", "", container);
        link.setAttribute("href", "https://www.mapy.cz");
        link.setAttribute("target", "_blank");
        link.innerHTML = '<img src="https://api.mapy.com/img/api/logo.svg" width="100px" />';
        L.DomEvent.disableClickPropagation(link);
        return container;
      },
    });

    new LogoControl().addTo(map);
    map.hasLogoControl = true; // mark that logo was added
  }

  return null;
}

export default function MapLeaflet() {
  // Icons
  const createCustomIcon = (mainColor, innerColor) => {
    return L.divIcon({
      className: "custom-pin",
      iconAnchor: [16, 32],
      // popupAnchor [x, y]: 0 is centered horizontally,
      // -32 moves the popup tip to the very top of the pin.
      popupAnchor: [0, -32],
      iconSize: [32, 32],
      html: `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 2px rgba(0,0,0,0.3));">
        <path d="M12 21.325C12 21.325 19 14.561 19 9C19 5.13401 15.866 2 12 2C8.13401 2 5 5.13401 5 9C5 14.561 12 21.325 12 21.325Z" fill="${mainColor}"/>
        <circle cx="12" cy="9" r="3.5" fill="${innerColor}"/>
      </svg>
    `,
    });
  };

  // Ikona pro uložené piny (Faded Copper s krémovým středem)
  const savedPin = createCustomIcon("#b08968", "#ede0d4");

  // Ikona pro náhled/rozepsaný pin (Tan s tmavším středem, aby se odlišil)
  const previewPin = createCustomIcon("#7f5539", "#ede0d4");

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

  let isOverlay = true;

  function MapClickHandler({ onClick }) {
    const map = useMap();

    const [draftPin, setDraftPin] = useState(null);
    const [showError, setShowError] = useState(false);

    useMapEvents({
      click(e) {
        if (isOverlay == false) isOverlay = true;
        else isOverlay = false;

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
        isOverlay = true;
      }
    };
    window.addEventListener("keydown", handleEsc);

    return draftPin === null || isOverlay ? null : (
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
          <Popup closeButton={false} autoClose={false} closeOnClick={false} className="custom-form">
            <div style={{ width: "300px" }} onClick={(e) => e.stopPropagation()}>
              <div className="card shadow-lg">
                <div className="card-header d-flex justify-content-between align-items-center">
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
                      className="btn btn-sm btn-secondary"
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
        <Rectangle
          bounds={[
            [45.0, 5.0],
            [55.0, 25.0],
          ]}
          pathOptions={{
            fillColor: "black",
            fillOpacity: 0.45,
            stroke: false,
          }}
          eventHandlers={{
            click: (e) => {
              e.originalEvent.stopPropagation();
              setDraftPin(null);
            },
          }}
        />
      </>
    );
  }

  return (
    <MapContainer
      center={[49.8, 15.5]}
      zoom={8}
      minZoom={8}
      maxZoom={22}
      maxBounds={[
        [48.55, 12.09],
        [51.06, 18.87],
      ]}
      className="dark-theme"
    >
      <TileLayer
        url={`https://api.mapy.com/v1/maptiles/basic/256/{z}/{x}/{y}?apikey=${import.meta.env.VITE_MAP_API_KEY}`}
        attribution='<a href="https://api.mapy.com/copyright" target="_blank">&copy; Seznam.cz</a>'
      />
      <MapyLogo />
      <MapClickHandler />
      <MarkerClusterGroup showCoverageOnHover={false}>
        {pins.map((pin) => (
          <Marker key={pin.id} position={[pin.latitude, pin.longitude]} icon={savedPin}>
            <Popup closeButton={false} autoClose={false} closeOnClick={false}>
              <div className="pin-message">
                <p>{pin.message}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
