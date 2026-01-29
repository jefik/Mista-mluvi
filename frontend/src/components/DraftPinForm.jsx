import { useRef, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import { previewPin } from "../utils/mapIcons";
import { getValidationError } from "../utils/PinValidation";
import { useAntiSpamTimer } from "../hooks/useAntiSpamTimer";

export function DraftPinForm({ draftPin, setDraftPin, setMapLock, createPinMutation }) {
  // Pins message
  const textareaRef = useRef(null);
  // --- Anti spam ---
  // For anti spam
  const botCatchRef = useRef(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Prevent spam, checks if the user is in a set coldown 10s
  const { isWaiting, remaining } = useAntiSpamTimer("last_pin_timestamp", 30000);

  // --- Save button ---
  // Func for handling save button
  const handleSave = () => {
    setInputMessage("");
    // Anti bot spam
    if (botCatchRef.current?.value) {
      setDraftPin(null);
      setMapLock(false);
      return;
    }

    // --- Inputs validations ---
    // Message from pin
    const message = textareaRef.current?.value.trim();
    // Get validation error string
    const error = getValidationError(message);
    if (error) {
      setInputMessage(error);
      return;
    }

    setIsSubmitting(true);
    createPinMutation.mutate(
      {
        latitude: draftPin.lat,
        longitude: draftPin.lng,
        message: message,
        created_at: draftPin.created_at,
      },
      {
        onSuccess: () => {
          localStorage.setItem("last_pin_timestamp", Date.now().toString());
          setDraftPin(null);
          setMapLock(false);
          setIsSubmitting(false);
        },
        onError: (error) => {
          setIsSubmitting(false);
          console.error("Chyba při ukládání:", error);
          alert("Něco se nepovedlo. Zkuste to za chvíli.");
        },
      },
    );
  };

  return (
    <Marker
      key={`${draftPin.lat}-${draftPin.lng}`}
      position={[draftPin.lat, draftPin.lng]}
      icon={previewPin}
      eventHandlers={{
        add: (e) => {
          e.target.openPopup();
        },
      }}
    >
      <Popup
        closeButton={false}
        autoClose={false}
        closeOnClick={false}
        autoPanPadding={[50, 50]}
        className="custom-form"
      >
        <div className="card-layout" onClick={(e) => e.stopPropagation()}>
          <div className="card shadow-lg">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="">Zanechte vzkaz</h6>

              <button
                className="btn-custom-close"
                onClick={() => {
                  setDraftPin(null);
                  setMapLock(false);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                </svg>
              </button>
            </div>

            <div className="card-body pt-0">
              <p className="seconds-warning">
                {inputMessage ? inputMessage : isWaiting ? `Další vzkaz můžete uložit za ${remaining}s` : ""}
              </p>

              <div className="card-input-nt">
                <input ref={botCatchRef} type="text" id="name" name="name" tabIndex="-1" autoComplete="off" />
              </div>
              <textarea
                className={`form-control ${inputMessage ? "is-invalid" : ""}`}
                rows={3}
                autoFocus
                ref={textareaRef}
                placeholder="Co se vám honí hlavou..."
                id="pin-message"
                name="message"
              />
              <div className="d-flex justify-content-end gap-2 mt-2">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setDraftPin(null);
                    setMapLock(false);
                  }}
                >
                  Zrušit
                </button>

                <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={isWaiting || isSubmitting}>
                  Uložit
                </button>
              </div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
