import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function MapLeaflet() {
  // Strictmode off for leaflet
  const mapRef = useRef(null);

  useEffect(() => {
    // Only initialize map if not already initialized
    if (mapRef.current) return;

    const MAPY_API_KEY = import.meta.env.VITE_MAP_API_KEY;

    // Define the boundaries of the map
    const southWest = L.latLng(48.55, 12.09);
    const northEast = L.latLng(51.06, 18.87);
    const czBounds = L.latLngBounds(southWest, northEast);

    // Create the map and set its initial view and zoom level
    const map = L.map("map", {
      maxBounds: czBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 8,
      maxZoom: 22,
    }).setView([49.8, 15.5], 7);

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

    // finally we add our LogoControl to the map
    new LogoControl().addTo(map);

    // Strictmode off for leaflet
    // Set the map instance to the ref
    mapRef.current = map;
  }, []);

  return <div id="map" style={{ height: "100vh" }} />;
}
