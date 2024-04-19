import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WaterBingo from "./WaterBingo";
import PrintableSheets from "./PrintableSheets";
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<WaterBingo />} />
          <Route path="/print" element={<PrintableSheets />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
