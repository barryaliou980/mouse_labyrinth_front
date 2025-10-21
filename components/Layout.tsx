'use client';

import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50" style={{ color: '#111827' }}>
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
