import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import * as api from './services/api';

// Mock API services
vi.mock('./services/api', () => ({
    fetchLogs: vi.fn(),
    fetchTimelineStats: vi.fn(),
    fetchSourceStats: vi.fn(),
}));

describe('App Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('isLoggedIn', 'true');
        
        api.fetchLogs.mockResolvedValue([]);
        api.fetchTimelineStats.mockResolvedValue([]);
        api.fetchSourceStats.mockResolvedValue([]);
    });

    it('renders the dashboard header', async () => {
        render(<App />);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/LOG COMMANDER/i);
        expect(screen.getByText(/SYSTEM ONLINE/i)).toBeInTheDocument();
    });

    it('renders search bar', async () => {
        render(<App />);
        expect(screen.getByPlaceholderText(/Filter by Tenant ID/i)).toBeInTheDocument();
    });

    it('fetches data on mount', async () => {
        render(<App />);
        await waitFor(() => {
            expect(api.fetchLogs).toHaveBeenCalled();
            expect(api.fetchTimelineStats).toHaveBeenCalled();
            expect(api.fetchSourceStats).toHaveBeenCalled();
        });
    });

    it('displays summary cards', async () => {
        render(<App />);
        expect(screen.getByText('Total Events')).toBeInTheDocument();
        expect(screen.getByText('Active Sources')).toBeInTheDocument();
        expect(screen.getByText('System Load')).toBeInTheDocument();
    });
});