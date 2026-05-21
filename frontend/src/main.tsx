import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { SocketProvider } from './providers/SocketProvider';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <ThemeProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </ThemeProvider>
      </QueryProvider>
    </BrowserRouter>
  </StrictMode>
);
