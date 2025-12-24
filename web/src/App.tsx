import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import MyTickets from './pages/MyTickets';
import StaffDashboard from './pages/StaffDashboard';
import Admin from './pages/Admin'; // <--- IMPORT

function App() {
  return (
    <Router>
      <div className="bg-gray-900 min-h-screen text-white font-sans">
        <Toaster 
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }} 
        />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/my-tickets" element={<MyTickets />} />
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/admin" element={<Admin />} /> {/* <--- ADD ROUTE */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
