import { polygon as turfPolygon } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point as turfPoint } from "@turf/helpers";
import czechGeoJSON from "/data/czech_republic.json";

// Convert json of czech republic into a turf, which will calculate if a point is inside
// Its calculated only once here
export const czechBoundary = turfPolygon(czechGeoJSON.features[0].geometry.coordinates);

// Func to check if a click is outside of czech republic
export const isInsideCzechia = (lat, lng) => {
  const pt = turfPoint([lng, lat]);
  // Check if click is outside of czech republic
  return booleanPointInPolygon(pt, czechBoundary);
};
