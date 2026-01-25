import { useState, useEffect } from "react";

export function useAntiSpamTimer(waitTime = 10000) {
  const [now, setNow] = useState(Date.now());

  // Rerender every second to update remaining time
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Get the time of the last saved pin from localstorage
  const lastPinTime = parseInt(localStorage.getItem("last_pin_timestamp") || 0);

  // Calculate the difference between now and release time
  const remaining = Math.ceil((lastPinTime + waitTime - now) / 1000);
  const isWaiting = remaining > 0;

  return { isWaiting, remaining };
}
