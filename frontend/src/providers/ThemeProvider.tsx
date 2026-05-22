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
          colorPrimary: '#6366f1',
          colorBgContainer: isDark ? '#292929' : '#ffffff',
          colorBgElevated: isDark ? '#333333' : '#ffffff',
          colorBgLayout: isDark ? '#1e1e1e' : '#fdfaf0',
          colorBorder: isDark ? '#3f3f46' : '#e5e0d3',
          colorBorderSecondary: isDark ? '#333333' : '#f5f0e1',
          colorText: isDark ? '#e2e8f0' : '#334155',
          colorTextSecondary: isDark ? '#94a3b8' : '#64748b',
          colorTextTertiary: isDark ? '#64748b' : '#94a3b8',
          borderRadius: 12,
          borderRadiusLG: 16,
          borderRadiusSM: 8,
          borderRadiusXS: 6,
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: 16,
          fontSizeLG: 18,
          fontSizeSM: 14,
          lineHeight: 1.6,
          boxShadow: '0 4px 24px -4px rgba(0, 0, 0, 0.08)',
          boxShadowSecondary: '0 8px 32px -8px rgba(0, 0, 0, 0.12)',
        },
        components: {
          Button: {
            controlHeight: 42,
            controlHeightSM: 34,
            controlHeightLG: 48,
            borderRadius: 12,
            borderRadiusSM: 8,
            borderRadiusLG: 14,
            fontWeight: 600,
            paddingInline: 20,
            fontSize: 15,
          },
          Input: {
            controlHeight: 42,
            controlHeightSM: 34,
            controlHeightLG: 48,
            borderRadius: 12,
            borderRadiusSM: 8,
            borderRadiusLG: 14,
            fontSize: 16,
            paddingInline: 14,
            colorBgContainer: isDark ? '#292929' : '#ffffff',
          },
          Select: {
            controlHeight: 42,
            controlHeightSM: 34,
            controlHeightLG: 48,
            borderRadius: 12,
            borderRadiusSM: 8,
            borderRadiusLG: 14,
            fontSize: 16,
            colorBgContainer: isDark ? '#292929' : '#ffffff',
          },
          Card: {
            borderRadiusLG: 16,
            paddingLG: 24,
            colorBgContainer: isDark ? '#292929' : '#ffffff',
            boxShadowTertiary: isDark
              ? '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.2)'
              : '0 4px 16px -4px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.02)',
          },
          Table: {
            borderRadius: 14,
            fontSize: 15,
            headerBg: isDark ? '#333333' : '#f8fafc',
            headerColor: isDark ? '#e2e8f0' : '#475569',
            headerSortActiveBg: isDark ? '#3f3f46' : '#f1f5f9',
            colorBgContainer: isDark ? '#292929' : '#ffffff',
            rowHoverBg: isDark ? '#333333' : '#f8fafc',
          },
          Modal: {
            borderRadiusLG: 20,
            headerBg: 'transparent',
            contentBg: isDark ? '#292929' : '#ffffff',
            titleFontSize: 18,
            paddingLG: 28,
          },
          Tabs: {
            titleFontSize: 15,
            fontWeightStrong: 600,
            horizontalItemGutter: 28,
            itemSelectedColor: '#6366f1',
            inkBarColor: '#6366f1',
          },
          Form: {
            labelFontSize: 14,
            verticalLabelPadding: '0 0 6px',
          },
          DatePicker: {
            controlHeight: 42,
            borderRadius: 12,
            fontSize: 15,
            colorBgContainer: isDark ? '#292929' : '#ffffff',
          },
          Divider: {
            colorSplit: isDark ? '#3f3f46' : '#e5e0d3',
          },
          List: {
            colorBgContainer: 'transparent',
          },
          Menu: {
            fontSize: 15,
            itemHeight: 44,
            itemMarginInline: 8,
            itemBorderRadius: 10,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};
