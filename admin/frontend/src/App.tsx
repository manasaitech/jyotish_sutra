import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, auth } from './auth';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { fetchAdminApi } from './api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();

          // Verify admin rights by hitting the backend test route
          await fetchAdminApi('/overview', idToken);

          setToken(idToken);
          setUser(currentUser);
          setIsAdmin(true);
        } catch (err: any) {
          console.error('Auth verify failed:', err);
          setIsAdmin(false);
          setUser(null);
          setToken('');
        }
      } else {
        setUser(null);
        setToken('');
        setIsAdmin(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-sandalwood-bg flex items-center justify-center flex-col gap-4 font-sans">
        <div className="w-10 h-10 border-4 border-kesari-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-on-surface-variant tracking-wider uppercase font-semibold">Synchronizing Portal...</p>
      </div>
    );
  }

  // Non-authenticated users see the Login page
  if (!user || isAdmin === false) {
    return (
      <>
        {isAdmin === false && (
          <div className="bg-red-600 text-white text-xs py-3 px-4 text-center font-semibold tracking-wide shadow-md relative z-50">
            Access denied. You do not have the 'admin' permission role.
          </div>
        )}
        <LoginPage />
      </>
    );
  }

  // Authenticated admin users see the layout + requested panel section
  return (
    <AdminLayout
      user={user}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
    >
      <DashboardPage
        user={user}
        token={token}
        activeSection={activeSection}
      />
    </AdminLayout>
  );
}
