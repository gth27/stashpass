import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.tsx';
import MyTickets from './pages/MyTickets.tsx';
import StaffDashboard from './pages/StaffDashboard.tsx';

function App() {
  return (
    <Router>
      <div className="bg-gray-900 min-h-screen text-white font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/my-tickets" element={<MyTickets />} />
          <Route path="/staff" element={<StaffDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
