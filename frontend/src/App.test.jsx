import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from './services/api';

// Mock the API interactions
vi.mock('./services/api');

describe('App Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mock returns
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
        // Wait for loading to finish or check for button presence
        await waitFor(() => {
            expect(screen.getByText('Execute')).toBeInTheDocument();
        });
    });

    it('fetches data on mount', async () => {
        render(<App />);
        await waitFor(() => {
            expect(api.fetchLogs).toHaveBeenCalledTimes(1);
            expect(api.fetchTimelineStats).toHaveBeenCalledTimes(1);
            expect(api.fetchSourceStats).toHaveBeenCalledTimes(1);
        });
    });

    it('displays summary cards', async () => {
        render(<App />);
        expect(screen.getByText('Total Events')).toBeInTheDocument();
        expect(screen.getByText('Active Sources')).toBeInTheDocument();
        expect(screen.getByText('System Load')).toBeInTheDocument();
    });
});
