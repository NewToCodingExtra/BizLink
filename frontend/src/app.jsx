import './css/app.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { ShareProvider } from './context/ShareContext';
import AppLayout from './Layouts/AppLayout';

router.on('invalid', (event) => {
  if (event.detail.response?.status === 419) {
    event.preventDefault();
    window.location.reload();
  }
});

createInertiaApp({
  resolve: (name) =>
    resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')).then((page) => {
      page.default.layout ??= (pageEl) => <AppLayout>{pageEl}</AppLayout>;
      return page;
    }),
  setup({ el, App, props }) {
    createRoot(el).render(
      <ThemeProvider>
        <ToastProvider>
          <ConfirmProvider>
            <ShareProvider>
              <App {...props} />
            </ShareProvider>
          </ConfirmProvider>
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

