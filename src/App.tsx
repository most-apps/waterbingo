import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import CallerPage from "./pages/CallerPage";
import CardsPage from "./pages/CardsPage";

export default function App() {
  return (
    // BASE_URL ends in "/", which would stop "/waterbingo" (no slash) from matching.
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
      <Routes>
        <Route path="/" element={<CallerPage />} />
        <Route path="/cards" element={<CardsPage />} />
        {/* Old route from the first version of the app. */}
        <Route path="/print" element={<Navigate to="/cards" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
