import { useRef, useState, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { usePins, useCreatePin } from "../hooks/usePins";
import { MapContainer, TileLayer, useMapEvents, useMap, GeoJSON } from "react-leaflet";
import { Marker, Popup, Rectangle } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import czechGeoJSON from "/data/czech_republic.json";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point as turfPoint, polygon as turfPolygon } from "@turf/helpers";

function MapyLogo() {
  const map = useMap();

  // Add mapy.cz logo only if its not there
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

    // Logo added
    new LogoControl().addTo(map);
    map.hasLogoControl = true;
  }

  return null;
}

export default function MapLeaflet() {
  // Custom icons
  const createCustomIcon = (mainColor, innerColor) => {
    return L.divIcon({
      className: "custom-pin",
      iconAnchor: [16, 32],
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

  // Icon for saved pins (colors from scss)
  const savedPin = createCustomIcon("#b08968", "#ede0d4");
  // Icon for draft pins (colors from scss)
  const previewPin = createCustomIcon("#7f5539", "#ede0d4");

  // Pins message
  const textareaRef = useRef(null);

  // Database requests
  const { data: pins = [] } = usePins();
  const createPinMutation = useCreatePin();

  // Func to create black overlay with hole in shape of czech republic
  const worldOverlay = useMemo(() => {
    // Outer boundary (world boundary)
    const worldCoords = [
      [
        [-180, 90], // North west
        [-180, -90], // South west
        [180, -90], // South east
        [180, 90], // North east
        [-180, 90], // Close
      ],
    ];

    // Extract coordinates of czech republic
    const rawCzechCoords = czechGeoJSON.features[0].geometry.coordinates;

    // Reverse czech republic coordinates to create hole
    const czechHoles = [rawCzechCoords[0].toReversed()];

    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        // First coords are outer, second coords are inside (the hole - czech republic)
        coordinates: [...worldCoords, ...czechHoles],
      },
    };
  }, []);

  // Detect if its under 625 for mobile and 1225 for bigger devices
  const isMobile = window.innerWidth < 625;
  const isTablet = window.innerWidth >= 625 && window.innerWidth < 1225;

  // Adjust values of map zooms for responsivity
  const MAP_SETTINGS = {
    initialZoom: isMobile ? 6.5 : isTablet ? 7 : 8,
    minZoom: isMobile ? 6.5 : isTablet ? 7 : 8,
  };

  function MapClickHandler() {
    const map = useMap();
    const [draftPin, setDraftPin] = useState(null);
    const [showError, setShowError] = useState(false);

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

    // Locking unlocking map
    const setMapLock = (isLocked) => {
      const action = isLocked ? "disable" : "enable";
      map.dragging[action]();
      map.touchZoom[action]();
      map.doubleClickZoom[action]();
      map.scrollWheelZoom[action]();
      map.boxZoom[action]();
      map.keyboard[action]();

      // + and - icons of map styling
      const mapContainer = map.getContainer();
      if (isLocked) {
        mapContainer.classList.add("map-locked");
      } else {
        mapContainer.classList.remove("map-locked");
      }
    };

    // Func to prevent clicking outside of czech republic
    const czechBoundary = useMemo(() => {
      const feature = czechGeoJSON.features[0].geometry.coordinates;
      return turfPolygon(feature);
    }, []);

    useMapEvents({
      zoomend: () => {
        updateDragging();
      },
      // Create new draft pin on map click
      click(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        const pt = turfPoint([lng, lat]);
        // Check if click is outside of czech republic
        if (!booleanPointInPolygon(pt, czechBoundary)) {
          return;
        }

        // Lock the map when pin is beeing made
        setMapLock(true);

        setDraftPin({ lat, lng, message: "" });
        setShowError(false);
      },

      // Escape handler to cancel pin creation
      keydown(e) {
        if (e.originalEvent.key === "Escape") {
          setDraftPin(null);
          setMapLock(false);
          updateDragging();
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
          <Popup closeButton={false} autoClose={false} closeOnClick={false} className="custom-form">
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
                  <textarea
                    className={`form-control ${showError ? "is-invalid" : ""}`}
                    rows={3}
                    autoFocus
                    ref={textareaRef}
                    placeholder="Co se vám honí hlavou..."
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
                        setMapLock(false);
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
    <MapContainer
      center={[49.8, 15.5]}
      zoom={MAP_SETTINGS.initialZoom}
      minZoom={MAP_SETTINGS.minZoom}
      maxZoom={22}
      zoomSnap={0.5} // Enable 0.5 values
      maxBounds={[
        [48.55, 12.09],
        [51.06, 18.87],
      ]}
      className="dark-theme"
      maxBoundsViscosity={1}
      renderer={L.svg({ padding: 3 })} // Rendering more outside then loaded map
    >
      <GeoJSON
        data={worldOverlay}
        style={{
          weight: 2,
          color: "#7f5539",
          fillColor: "#0000009c",
          interactive: true,
          className: "geojson-nocursor",
        }}
        eventHandlers={{
          click: (e) => {
            L.DomEvent.stopPropagation(e); // Prevent creating new pin under the overlay
          },
        }}
      />
      <TileLayer
        url={`https://api.mapy.com/v1/maptiles/basic/256/{z}/{x}/{y}?apikey=${import.meta.env.VITE_MAP_API_KEY}`}
        attribution='<a href="https://api.mapy.com/copyright" target="_blank">&copy; Seznam.cz</a>'
      />
      <MapyLogo />
      <MapClickHandler />
      <MarkerClusterGroup showCoverageOnHover={false}>
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            icon={savedPin}
            eventHandlers={{
              popupopen: (e) => {
                const popup = e.popup.getElement();
                if (popup) {
                  popup.classList.add("custom-message");
                }
              },
            }}
          >
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
