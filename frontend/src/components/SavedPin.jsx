import { useState } from "react";
import { Marker, Popup } from "react-leaflet";
import { savedPin } from "../utils/mapIcons";
import { formatCzechDate } from "../utils/DateUtils";
import { useUpdateLike } from "../hooks/usePins";

// TODO: Real time timer for the 30sec
// Func to handle individual pin interactions and local state for likes
const LikeButton = ({ pin }) => {
  // Initialize the mutation hook for updating likes
  const updateLikeMutation = useUpdateLike();

  // Func to check in localstoarge if user already liked this pin
  const getInitialLikedState = () => {
    const likedPins = JSON.parse(localStorage.getItem("liked_pins") || "[]");
    return likedPins.includes(pin.id);
  };

  // States just for UI (before server responds)
  const [localLikes, setLocalLikes] = useState(pin.likes_count || 0);
  const [isLiked, setIsLiked] = useState(getInitialLikedState());

  const handleClick = (e) => {
    e.stopPropagation();

    const newLikedState = !isLiked;

    // Update the UI immediately to see like + and -
    setIsLiked(newLikedState);
    setLocalLikes((prev) => (newLikedState ? prev + 1 : prev - 1));

    // Mutation
    updateLikeMutation.mutate(
      { pinId: pin.id, increment: newLikedState },
      {
        onSuccess: () => {
          // Save to localstorage after server confirms success
          const likedPins = JSON.parse(localStorage.getItem("liked_pins") || "[]");
          const newLikedPins = newLikedState ? [...likedPins, pin.id] : likedPins.filter((id) => id !== pin.id);

          localStorage.setItem("liked_pins", JSON.stringify(newLikedPins));
        },
        onError: (error) => {
          // Rollback - if there is server call fail, revert the UI to the original
          setIsLiked(!newLikedState);
          setLocalLikes((prev) => (newLikedState ? prev - 1 : prev + 1));
          alert("Chyba: " + error.message);
        },
      },
    );
  };

  return (
    <button onClick={handleClick} className={`like-button ${isLiked ? "active" : ""}`}>
      <svg
        width="18"
        height="18"
        fill={isLiked ? "#7f5539" : "none"}
        stroke={isLiked ? "#7f5539" : "currentColor"}
        strokeWidth="1"
        viewBox="0 0 15 15"
      >
        <path
          d="M13.91,6.75c-1.17,2.25-4.3,5.31-6.07,6.94c-0.1903,0.1718-0.4797,0.1718-0.67,0C5.39,12.06,2.26,9,1.09,6.75&#xA;&#x9;C-1.48,1.8,5-1.5,7.5,3.45C10-1.5,16.48,1.8,13.91,6.75z"
        />
      </svg>
      <span className="like-counter">{localLikes}</span>
    </button>
  );
};

// Main component - func to render marker with popup for a specific pin
export const SavedPin = ({ pin }) => {
  return (
    <Marker
      position={[pin.latitude, pin.longitude]}
      icon={savedPin}
      eventHandlers={{
        popupopen: (e) => {
          e.target._map.setMaxBounds([
            [45.0, 5.0],
            [55.0, 25.0],
          ]);
          e.popup.getElement()?.classList.add("custom-message");
        },
        popupclose: (e) => {
          e.target._map.setMaxBounds([
            [48.55, 12.09],
            [51.06, 18.87],
          ]);
        },
      }}
    >
      <Popup closeButton={false} autoClose={false} closeOnClick={false} autoPanPadding={[50, 50]}>
        <div className="pin-message">
          <p>{pin.message}</p>
        </div>
        <div className="pin-footer">
          <p className="pin-date">Zanecháno dne: {formatCzechDate(pin.created_at)}</p>
          <div className="pin-actions">
            <LikeButton pin={pin} />
          </div>
        </div>
      </Popup>
    </Marker>
  );
};
