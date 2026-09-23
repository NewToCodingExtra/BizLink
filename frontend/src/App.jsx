import './css/app.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './Layouts/AppLayout';

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
    
    // Find the page regardless of case in the key
    const pageKey = Object.keys(pages).find(key => 
      key.toLowerCase() === `./pages/${name.toLowerCase()}.jsx` ||
      key.toLowerCase() === `./pages/${name.toLowerCase()}/index.jsx`
    );
    
    const page = pages[pageKey];
    if (!page) {
      console.error(`Available pages:`, Object.keys(pages));
      throw new Error(`Inertia page not found: ${name}`);
    }
    // Default shell: Navbar + Footer + flash toasts for every page.
    page.default.layout ??= (pageEl) => <AppLayout>{pageEl}</AppLayout>;
    return page;
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <ThemeProvider>
        <ToastProvider>
          <App {...props} />
        </ToastProvider>
      </ThemeProvider>
    );
  },
  title: (title) => (title ? `${title} · BizLink` : 'BizLink'),
  progress: {
    color: '#D4AF37',
    showSpinner: false,
  },
});

