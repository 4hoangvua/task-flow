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

  const isDark = themeMode === 'dark';

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: isDark ? '#818cf8' : '#4f46e5',
          colorBgContainer: isDark ? '#18181b' : '#ffffff',
          colorBgElevated: isDark ? '#27272a' : '#ffffff',
          colorBgLayout: isDark ? '#09090b' : '#f8fafc',
          colorBorder: isDark ? '#27272a' : '#e2e8f0',
          colorBorderSecondary: isDark ? '#1f1f23' : '#f1f5f9',
          colorText: isDark ? '#fafafa' : '#0f172a',
          colorTextSecondary: isDark ? '#a1a1aa' : '#475569',
          colorTextTertiary: isDark ? '#71717a' : '#64748b',
          borderRadius: 8,
          borderRadiusLG: 12,
          borderRadiusSM: 6,
          borderRadiusXS: 4,
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: 16,
          fontSizeLG: 18,
          fontSizeSM: 14,
          lineHeight: 1.6,
          boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.5)' : '0 4px 12px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
          boxShadowSecondary: isDark ? '0 8px 24px rgba(0, 0, 0, 0.6)' : '0 12px 24px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
        },
        components: {
          Button: {
            controlHeight: 42,
            controlHeightSM: 34,
            controlHeightLG: 48,
            borderRadius: 6,
            borderRadiusSM: 4,
            borderRadiusLG: 8,
            fontWeight: 600,
            paddingInline: 20,
            fontSize: 15,
          },
          Input: {
            controlHeight: 42,
            controlHeightSM: 34,
            controlHeightLG: 48,
            borderRadius: 6,
            borderRadiusSM: 4,
            borderRadiusLG: 8,
            fontSize: 16,
            paddingInline: 14,
            colorBgContainer: isDark ? '#18181b' : '#ffffff',
          },
          Select: {
            controlHeight: 42,
            controlHeightSM: 34,
            controlHeightLG: 48,
            borderRadius: 6,
            borderRadiusSM: 4,
            borderRadiusLG: 8,
            fontSize: 16,
            colorBgContainer: isDark ? '#18181b' : '#ffffff',
          },
          Card: {
            borderRadiusLG: 8,
            paddingLG: 24,
            colorBgContainer: isDark ? '#18181b' : '#ffffff',
            boxShadowTertiary: isDark
              ? '0 4px 12px rgba(0, 0, 0, 0.5)'
              : '0 4px 12px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
          },
          Table: {
            borderRadius: 8,
            fontSize: 15,
            headerBg: isDark ? '#27272a' : '#f8fafc',
            headerColor: isDark ? '#fafafa' : '#475569',
            headerSortActiveBg: isDark ? '#27272a' : '#f1f5f9',
            colorBgContainer: isDark ? '#18181b' : '#ffffff',
            rowHoverBg: isDark ? '#27272a' : '#f8fafc',
          },
          Modal: {
            borderRadiusLG: 12,
            headerBg: 'transparent',
            contentBg: isDark ? '#27272a' : '#ffffff',
            titleFontSize: 18,
            paddingLG: 28,
          },
          Tabs: {
            titleFontSize: 15,
            fontWeightStrong: 600,
            horizontalItemGutter: 28,
            itemSelectedColor: isDark ? '#818cf8' : '#4f46e5',
            inkBarColor: isDark ? '#818cf8' : '#4f46e5',
          },
          Form: {
            labelFontSize: 14,
            verticalLabelPadding: '0 0 6px',
          },
          DatePicker: {
            controlHeight: 42,
            borderRadius: 6,
            fontSize: 15,
            colorBgContainer: isDark ? '#18181b' : '#ffffff',
          },
          Divider: {
            colorSplit: isDark ? '#27272a' : '#e2e8f0',
          },
          List: {
            colorBgContainer: 'transparent',
          },
          Menu: {
            fontSize: 15,
            itemHeight: 44,
            itemMarginInline: 8,
            itemBorderRadius: 6,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};
