import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { AdminLayout } from './pages/admin/layout/AdminLayout';
import AdminHome from './pages/admin/AdminHome';
import MoodAnalytics from './pages/admin/MoodAnalytics';
import RiskMonitoring from './pages/admin/RiskMonitoring';
import StudentOverview from './pages/admin/StudentOverview';
import ManageUsers from './pages/admin/ManageUsers';

// Placeholder components for routes not yet implemented
import { Chat } from './pages/Chat';
import { Wellness } from './pages/Wellness';
import { Profile } from './pages/Profile';
import { Groups } from './pages/Groups';
import { Booking } from './pages/Booking';
import { Journal } from './pages/Journal';
import { ResourceLibrary } from './pages/ResourceLibrary';
import { Emergency } from './pages/Emergency';
import { Affirmations } from './pages/Affirmations';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router basename="/mindguard">
          <div className="app-container">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <Layout>
                    <Chat />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/wellness" element={
                <ProtectedRoute>
                  <Layout>
                    <Wellness />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/groups" element={
                <ProtectedRoute>
                  <Layout>
                    <Groups />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/journal" element={
                <ProtectedRoute>
                  <Layout>
                    <Journal />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/booking" element={
                <ProtectedRoute>
                  <Layout>
                    <Booking />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/resources" element={
                <ProtectedRoute>
                  <Layout>
                    <ResourceLibrary />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/emergency" element={
                <ProtectedRoute>
                  <Layout>
                    <Emergency />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/affirmations" element={
                <ProtectedRoute>
                  <Layout>
                    <Affirmations />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminHome />} />
                <Route path="mood-analytics" element={<MoodAnalytics />} />
                <Route path="risk-monitoring" element={<RiskMonitoring />} />
                <Route path="student-overview" element={<StudentOverview />} />
                <Route path="manage-users" element={<ManageUsers />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
