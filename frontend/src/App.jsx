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
    const page = pages[`./Pages/${name}.jsx`];
    if (!page) {
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
    color: '#2563EB',
    showSpinner: true,
  },
});
