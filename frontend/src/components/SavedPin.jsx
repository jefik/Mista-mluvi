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
        viewBox="0 0 24 24"
        fill={isLiked ? "#7f5539" : "none"}
        stroke={isLiked ? "#7f5539" : "currentColor"}
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
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
