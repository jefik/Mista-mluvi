import { useMap } from "react-leaflet";
import L from "leaflet";

export default function MapyLogo() {
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
