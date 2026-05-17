import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './features/auth/authSlice';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';

// Protected route: redirect to /login if not authenticated
const PrivateRoute = ({ children }) => {
  const { user, initialized } = useSelector(state => state.auth);
  if (!initialized) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

// Public route: redirect to / if already authenticated
const PublicRoute = ({ children }) => {
  const { user, initialized } = useSelector(state => state.auth);
  if (!initialized) return null;
  return !user ? children : <Navigate to="/" />;
};

export default function App() {
  const dispatch = useDispatch();

  // On app load, check if user is already logged in (has valid cookie)
  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      </Routes>
    </BrowserRouter>
  );
}