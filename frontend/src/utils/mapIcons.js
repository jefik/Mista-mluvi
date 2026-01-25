import L from "leaflet";

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
export const savedPin = createCustomIcon("#b08968", "#ede0d4");
// Icon for draft pins (colors from scss)
export const previewPin = createCustomIcon("#7f5539", "#ede0d4");
