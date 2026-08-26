import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/admin/Login';
import Register from './pages/admin/Register';
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import BrowseEvents from './pages/buyer/BrowseEvents';
import EventDetails from './pages/buyer/EventDetails';
import MyTickets from './pages/buyer/MyTickets';
import AdminDashboard from './pages/admin/AdminDashboard';
import PlatformManagement from './pages/admin/PlatformManagement';
import HashChain from './pages/admin/HashChain';

export default function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/settings" element={<PlatformManagement />} />
      <Route path="/admin/chain" element={<HashChain />} />

      {/* Organizer Routes */}
      <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
      <Route path="/organizer/create-event" element={<CreateEvent />} />

      {/* Buyer Routes */}
      <Route path="/buyer/events" element={<BrowseEvents />} />
      <Route path="/buyer/events/:id" element={<EventDetails />} />
      <Route path="/buyer/tickets" element={<MyTickets />} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}
