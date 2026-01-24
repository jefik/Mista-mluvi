import MapLeaflet from "./components/MapLeaflet.jsx";

function App() {
  return (
    <div className="app-container">
      <div className="welcome-message">
        <h2>Místa mluví</h2>
        <p>Mapa vzpomínek - Kliknutím na mapu zanecháte vzkaz</p>
      </div>
      <MapLeaflet />
    </div>
  );
}

export default App;
