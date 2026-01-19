import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { usePins, useCreatePin } from "../hooks/usePins";

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
  const [draftPin, setDraftPin] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 });
  const [showError, setShowError] = useState(false);
  const draftMarkerRef = useRef(null);

  // Hover modal
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [hoverPin, setHoverPin] = useState(null);

  // Ref for cluster
  const clusterRef = useRef(null);

  // Ref for the form DOM element
  const formRef = useRef(null);

  // Ref with all rendered markers
  const markersRef = useRef([]);

  // Ref for the map instance
  const mapRef = useRef(null);

  // Database requests
  const { data: pins = [] } = usePins();
  const createPinMutation = useCreatePin();

  // TODO: REMOVE ALL useEffects you can
  // MAP
  useEffect(() => {
    // Only initialize map if not already initialized
    if (mapRef.current) return;

    const MAPY_API_KEY = import.meta.env.VITE_MAP_API_KEY;

    // Define the boundaries of the Czech republic
    const southWest = L.latLng(48.55, 12.09);
    const northEast = L.latLng(51.06, 18.87);
    const czBounds = L.latLngBounds(southWest, northEast);

    // Create the map and set its initial view
    const map = L.map("map", {
      maxBounds: czBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 8,
      maxZoom: 22,
    }).setView([49.8, 15.5], 7);

    // Creater cluster group
    const cluster = L.markerClusterGroup();
    cluster.addTo(map);
    clusterRef.current = cluster;

    // Add click event to create new draft pin
    map.on("click", (e) => {
      // If the clicked target is not the map itself, exit the function
      if (e.originalEvent.target.id !== "map") return;
      const { lat, lng } = e.latlng;

      // Make room for the pin 150px above the click
      const containerPoint = map.latLngToContainerPoint(e.latlng);
      const targetPoint = L.point(containerPoint.x, containerPoint.y - 150);
      const targetLatLng = map.containerPointToLatLng(targetPoint);

      // Move tha map
      map.panTo(targetLatLng, { animate: true, duration: 0.5 });

      // Empty pin data
      setDraftPin({ lat, lng, message: "" });
      setShowError(false);

      // Initial position for the bubble
      setFormPosition({ x: containerPoint.x, y: containerPoint.y });
      setShowForm(true);
    });

    // Add the tile layer with Mapy.cz and the API key
    L.tileLayer(
      `https://api.mapy.com/v1/maptiles/basic/256/{z}/{x}/{y}?apikey=${MAPY_API_KEY}`,
      {
        attribution:
          '<a href="https://api.mapy.com/copyright" target="_blank">&copy; Seznam.cz a.s. a další</a>',
      },
    ).addTo(map);

    // Copyright: logo of mapy.cz
    const LogoControl = L.Control.extend({
      options: {
        position: "bottomleft",
      },

      onAdd: function (map) {
        const container = L.DomUtil.create("div");
        const link = L.DomUtil.create("a", "", container);

        link.setAttribute("href", "http://mapy.com/");
        link.setAttribute("target", "_blank");
        link.innerHTML =
          '<img src="https://api.mapy.com/img/api/logo.svg" width="100px" />';
        L.DomEvent.disableClickPropagation(link);

        return container;
      },
    });

    // Add our LogoControl to the map
    new LogoControl().addTo(map);

    // Strictmode off for leaflet
    // Save map instance in ref
    mapRef.current = map;
  }, []);

  // Update positions of open pin modals
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showForm || !draftPin) return;

    const updatePosition = () => {
      const point = map.latLngToContainerPoint([draftPin.lat, draftPin.lng]);
      setFormPosition({ x: point.x, y: point.y });
    };

    // Keep bubble anchored during any map movement
    map.on("move", updatePosition);
    map.on("zoom", updatePosition);

    // Recalculate once immediately
    updatePosition();

    return () => {
      map.off("move", updatePosition);
      map.off("zoom", updatePosition);
    };
  }, [showForm, draftPin]);

  // Render all saved pins on the map
  useEffect(() => {
    if (!mapRef.current || !clusterRef.current) return;

    // Get the current cluster group
    const cluster = clusterRef.current;

    // Remove all existing markers (pins) from the cluster
    cluster.clearLayers();
    markersRef.current = [];

    pins.forEach((pin) => {
      const marker = L.marker([pin.latitude, pin.longitude], {
        icon: savedPin,
      });

      // HOVER
      marker.on("mouseover", () => {
        setHoverPin(pin);
        // Calculate screen position for the hover pin message
        const point = mapRef.current.latLngToContainerPoint([
          pin.latitude,
          pin.longitude,
        ]);
        setHoverPosition({ x: point.x, y: point.y });
      });

      // Hide the message when not hovering
      marker.on("mouseout", () => {
        setHoverPin(null);
      });

      // Add marker to the cluster group
      cluster.addLayer(marker);
      // Save the marker instance
      markersRef.current.push(marker);
    });
  }, [pins]);

  // Render draft pin preview
  useEffect(() => {
    // Only initialize map if not already initialized
    if (!mapRef.current) return;

    // If there is draft pin then remove it
    if (draftMarkerRef.current) {
      mapRef.current.removeLayer(draftMarkerRef.current);
    }

    if (!draftPin) return;

    // Add new draft pin
    console.log("PÍŠU", draftPin);
    const marker = L.marker([draftPin.lat, draftPin.lng], {
      icon: previewPin,
    }).addTo(mapRef.current);
    draftMarkerRef.current = marker;
  }, [draftPin]);

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

  // Escape leave
  useEffect(() => {
    if (!showForm) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setDraftPin(null);
        setShowForm(false);
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [showForm]);

  return (
    <div
      id="map"
      style={{ height: "100vh", position: "relative", overflow: "hidden" }}
    >
      {showForm && draftPin && (
        <div
          className="position-absolute"
          style={{
            zIndex: 2000,
            top: formPosition.y,
            left: formPosition.x,
            transform: "translate(-50%, -102%) translateY(185px)",
            pointerEvents: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="card shadow-lg border-0" style={{ width: "300px" }}>
            <div className="card-header bg-white border-0 py-2 d-flex justify-content-between align-items-center">
              <strong className="small">Nová zpráva</strong>
              <button
                className="btn-close"
                onClick={() => {
                  setDraftPin(null);
                  setShowForm(false);
                }}
              ></button>
            </div>
            <div className="card-body pt-0">
              <textarea
                className={`form-control ${showError ? "is-invalid" : ""}`}
                rows={3}
                autoFocus
                value={draftPin.message}
                onChange={(e) =>
                  setDraftPin({ ...draftPin, message: e.target.value })
                }
              />
              <div className="d-flex justify-content-end gap-2 mt-2">
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => {
                    setDraftPin(null);
                    setShowForm(false);
                  }}
                >
                  Zrušit
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    if (!draftPin.message.trim()) {
                      setShowError(true);
                      return;
                    }
                    createPinMutation.mutate({
                      latitude: draftPin.lat,
                      longitude: draftPin.lng,
                      message: draftPin.message,
                    });
                    setShowForm(false);
                  }}
                >
                  Uložit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div
          className="position-absolute w-100 h-100"
          style={{
            zIndex: 1500,
            backgroundColor: "rgba(0,0,0,0.3)",
            top: 0,
            left: 0,
          }}
          onClick={() => {
            setDraftPin(null);
            setShowForm(false);
          }}
        />
      )}

      {hoverPin && (
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
      )}
    </div>
  );
}
