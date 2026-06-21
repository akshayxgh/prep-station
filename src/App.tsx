import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Exam from "./pages/Exam";
import Review from "./pages/Review";
import Results from "./pages/Results";
import Dashboard from "./pages/Dashboard";
import AttemptDetail from "./pages/AttemptDetail";
import AttemptHistory from "./pages/AttemptHistory";
import Training from "./pages/Training"; // 1. Import the new page

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/exam" element={<Exam />} />
        <Route path="/review" element={<Review />} />
        <Route path="/results" element={<Results />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/attempt-detail" element={<AttemptDetail />} />
        <Route path="/attempt-history" element={<AttemptHistory />} />
        <Route path="/training" element={<Training />} /> {/* 2. Add the route */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;