import React, { useEffect } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { useUiStore } from '../stores/uiStore';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeMode = useUiStore((state) => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeMode]);

  return (
    <ConfigProvider
      theme={{
        algorithm: themeMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#4f46e5', // Indigo-600
          borderRadius: 8,
          fontFamily: 'Inter, system-ui, sans-serif',
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};
