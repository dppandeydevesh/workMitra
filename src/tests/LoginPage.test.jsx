import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from '../components/LoginPage';
import { ToastProvider } from '../components/Toast';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

describe('LoginPage', () => {
  it('renders the login form by default', () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <LoginPage />
        </ToastProvider>
      </BrowserRouter>
    );
    
    // Using i18n keys as text
    expect(screen.getByText('login.choosePathDesc')).toBeTruthy();
  });
});
