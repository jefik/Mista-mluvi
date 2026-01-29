import { useMap } from "react-leaflet";

export function RandomPinFly({ pins, markerRefs, isFlying, setIsFlying }) {
  const map = useMap();
  // Func to turn off interactions on the map
  const toggleMapInteractions = (enable) => {
    const action = enable ? "enable" : "disable";
    map.dragging[action]();
    map.touchZoom[action]();
    map.doubleClickZoom[action]();
    map.scrollWheelZoom[action]();
    map.boxZoom[action]();
    map.keyboard[action]();
  };

  const handleRandomClick = (e) => {
    if (pins.length === 0 || isFlying) return;

    // Turn off all interactions on the map when flying
    toggleMapInteractions(false);
    setIsFlying(true);

    map.stop();

    // Close popup of the random pin
    for (let id in markerRefs.current) {
      markerRefs.current[id]?.closePopup();
    }

    const randomPin = pins[Math.floor(Math.random() * pins.length)];
    const markerInstance = markerRefs.current[randomPin.id];

    // Zoom out on the map
    map.flyTo(map.getCenter(), 8, {
      animate: true,
      duration: 1.5,
    });

    // Zoom in on the map exactly at the found pin
    map.flyTo([randomPin.latitude, randomPin.longitude], 15.5, {
      animate: true,
      duration: 2.5,
      easeLinearity: 0.2,
    });

    // Flight animation finishes
    map.once("moveend", () => {
      // Open popup of the found pin
      if (markerInstance) {
        markerInstance.openPopup();
      }

      const handleEsc = (event) => {
        if (event.key === "Escape") {
          markerInstance.closePopup();
          // Remove event listener after use
          window.removeEventListener("keydown", handleEsc);
        }
      };

      // Start listening for the esc key
      window.addEventListener("keydown", handleEsc);

      // Clean up if user closes the popup differently
      markerInstance.once("popupclose", () => {
        window.removeEventListener("keydown", handleEsc);
      });
      // When pin is found enable all interactions
      toggleMapInteractions(true);
      setIsFlying(false);
    });
  };

  return (
    <div className="random-fly-container">
      <button onClick={handleRandomClick} disabled={isFlying} className="btn-random-fly shadow-lg">
        {isFlying ? "Hledám..." : "Najít náhodný vzkaz"}
      </button>
    </div>
  );
}
