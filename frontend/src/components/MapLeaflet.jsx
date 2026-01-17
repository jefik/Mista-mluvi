import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function MapLeaflet() {
  // Ref for the map instance
  const mapRef = useRef(null);
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
  const [pins, setPins] = useState([]);
  const [draftPin, setDraftPin] = useState(null);

  // Pins
  const [showForm, setShowForm] = useState(false);
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 });
  const [showError, setShowError] = useState(false);
  const draftMarkerRef = useRef(null);

  // Ref for the form DOM element
  const formRef = useRef(null);

  // Intearaction turn off on pin form (modal)
  useEffect(() => {
    if (showForm && formRef.current) {
      L.DomEvent.disableClickPropagation(formRef.current);
      L.DomEvent.disableScrollPropagation(formRef.current);
    }
  }, [showForm]);

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

    // Add click event to create new draft pin
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;

      // New empty draft pin
      setDraftPin({ lat, lng, message: "" });
      setShowError(false);

      // Calculate screen position for the pin form (modal)
      const point = mapRef.current.latLngToContainerPoint([lat, lng]);
      setFormPosition({ x: point.x, y: point.y });

      // Show the pin form
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

  // Render all saved pins on the map
  useEffect(() => {
    // Only initialize map if not already initialized
    if (!mapRef.current) return;

    pins.forEach((pin) => {
      L.marker([pin.lat, pin.lng], { icon: savedPin }).addTo(mapRef.current);
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
    const marker = L.marker([draftPin.lat, draftPin.lng], {
      icon: previewPin,
    }).addTo(mapRef.current);
    draftMarkerRef.current = marker;
  }, [draftPin]);

  // Render transparent overlay when pin form (modal) is shown
  useEffect(() => {
    // Only initialize map if not already initialized
    if (!mapRef.current) return;

    // Get map
    const map = mapRef.current;

    if (showForm) {
      // Create new pane for the overlay
      if (!map.getPane("overlayPaneCustom")) {
        map.createPane("overlayPaneCustom");
        const pane = map.getPane("overlayPaneCustom");
        pane.style.zIndex = 500; // Index soo overlay is above tiles but below pins
        pane.style.pointerEvents = "none"; // Allow clicks on markers
      }

      // Render overlay rectangle
      const bounds = map.getBounds();
      const overlayRect = L.rectangle(bounds, {
        pane: "overlayPaneCustom",
        interactive: true,
        color: "rgba(0, 0, 0, 0.72)",
        weight: 0,
        fillOpacity: 0.4,
      }).addTo(map);

      // Remove overlay when form is closed
      return () => {
        map.removeLayer(overlayRect);
      };
    }
  }, [showForm]);

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

  // Click outside leave
  useEffect(() => {
    if (!showForm || !formRef.current) return;

    const handleClickOutside = (e) => {
      // If Click is not inside form
      if (!formRef.current.contains(e.target)) {
        setDraftPin(null);
        setShowForm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showForm]);

  return (
    <div id="map" style={{ height: "100vh", position: "relative" }}>
      {showForm && draftPin && (
        <div
          ref={formRef}
          className="position-absolute bg-white p-3 border rounded"
          style={{
            top: formPosition.y,
            left: formPosition.x,
            zIndex: 1000,
            minWidth: "200px",
          }}
        >
          <h6>Přidat zprávu</h6>
          <textarea
            className="form-control mb-2"
            rows={3}
            value={draftPin.message}
            onChange={(e) => {
              setDraftPin({ ...draftPin, message: e.target.value });
              if (e.target.value.trim()) setShowError(false);
            }}
          ></textarea>
          {showError && (
            <div className="text-danger small mb-2">
              Musíte vyplnit zprávu pro uložení pinu.
            </div>
          )}
          <button
            className="btn btn-primary btn-sm me-2"
            onClick={() => {
              if (!draftPin.message.trim()) {
                setShowError(true);
                return;
              }
              setPins([...pins, draftPin]);
              setDraftPin(null);
              setShowForm(false);
              setShowError(false);
            }}
          >
            Uložit
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setDraftPin(null);
              setShowForm(false);
              setShowError(false);
            }}
          >
            Zrušit
          </button>
        </div>
      )}
    </div>
  );
}
