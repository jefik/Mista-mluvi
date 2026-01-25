import { useState } from "react";

export function useWindowSize() {
  const [windowSize] = useState({
    // TODO: changing sizes in real time
    // Detect if its under 625 for mobile and 1225 for bigger devices
    isMobile: window.innerWidth < 625,
    isTablet: window.innerWidth >= 625 && window.innerWidth < 1225,
  });

  return windowSize;
}
