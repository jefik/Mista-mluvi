import { useCallback } from "react";

export function useMapControls(map) {
  // Func for locking/unlocking map
  // We use useCallback so this function doesn't change on every render
  const setMapLock = useCallback(
    (isLocked) => {
      if (!map) return;

      const mapContainer = map.getContainer();

      // If map is locked stop all actions on map
      const action = isLocked ? "disable" : "enable";
      map.dragging[action]();
      map.touchZoom[action]();
      map.doubleClickZoom[action]();
      map.scrollWheelZoom[action]();
      map.boxZoom[action]();
      map.keyboard[action]();

      // If map is locked set bigger maxbounds and/remove class for +- buttons
      if (isLocked) {
        // Setting bigger maxbounds for popups ONLY
        map.setMaxBounds([
          [45.0, 5.0],
          [55.0, 25.0],
        ]);
        // + and - icons of map styling
        mapContainer.classList.add("map-locked");
      } else {
        // Default maxbounds for czech republic
        map.setMaxBounds([
          [48.55, 12.09],
          [51.06, 18.87],
        ]);
        // + and - icons of map styling
        mapContainer.classList.remove("map-locked");
      }
    },
    [map],
  );

  return setMapLock;
}
