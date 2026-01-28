const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

export const fetchPins = async () => {
  const response = await fetch(API_URL, {
    headers: { "x-api-key": API_KEY },
  });

  if (!response.ok) {
    throw new Error("Chyba při načítání pinů");
  }

  return response.json();
};

export const createPin = async ({ latitude, longitude, message }) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ latitude, longitude, message }),
  });

  if (!response.ok) {
    throw new Error("Chyba při ukládání pinu");
  }

  return response.json();
};

export const updatePinLike = async ({ pinId, increment }) => {
  const response = await fetch(`${API_URL}/${pinId}/like`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ increment }),
  });

  if (!response.ok) {
    // Get error message from the catch
    const errorData = await response.json().catch(() => ({}));

    // If there is no error message use this one
    const message = errorData.error || "Chyba při aktualizaci lajku";

    throw new Error(message);
  }

  return response.json();
};
