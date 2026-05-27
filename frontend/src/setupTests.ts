import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock socket.io-client
vi.mock('socket.io-client', () => {
  const mSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  return {
    io: vi.fn(() => mSocket),
    default: vi.fn(() => mSocket),
  };
});

// Mock Recharts to avoid JSdom canvas rendering issues
vi.mock('recharts', async () => {
  return {
    ResponsiveContainer: ({ children }: any) => children,
    AreaChart: ({ children }: any) => children,
    Area: () => null,
    BarChart: ({ children }: any) => children,
    Bar: () => null,
    LineChart: ({ children }: any) => children,
    Line: () => null,
    PieChart: ({ children }: any) => children,
    Pie: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    Cell: () => null,
  };
});
