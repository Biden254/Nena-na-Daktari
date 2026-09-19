/**
 * AppShell layout for Nena na Daktari.
 *
 * Wraps authenticated pages with sidebar navigation and content area.
 */

import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import authService from '../services/authService';
import { User } from '../types';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const profile = await authService.getProfile();
        setUser(profile);
      } catch {
        // Token expired or invalid — the API interceptor handles redirect
      }
    };
    loadUser();
  }, []);

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
};

export default AppShell;
