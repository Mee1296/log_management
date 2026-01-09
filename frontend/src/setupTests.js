import '@testing-library/jest-dom';

// ResizeObserver mock for Recharts
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};
