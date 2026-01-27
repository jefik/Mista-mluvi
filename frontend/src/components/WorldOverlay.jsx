import { useMemo } from "react";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";
import { czechBoundary } from "../utils/GeoUtils";

export const WorldOverlay = () => {
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
    const rawCzechCoords = czechBoundary.geometry.coordinates;

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

  return (
    <GeoJSON
      data={worldOverlay}
      style={{
        weight: 2,
        color: "#7f5539",
        fillColor: "black",
        interactive: true,
        className: "geojson-nocursor",
      }}
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e); // Prevent creating new pin under the overlay
        },
      }}
    />
  );
};
