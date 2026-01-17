import { useState } from "react";
import MapLeaflet from "./components/MapLeaflet.jsx";

function App() {
  return (
    <>
      <div className="container">
        <h1>Místa mluví</h1>
        <MapLeaflet />
      </div>
    </>
  );
}

export default App;
