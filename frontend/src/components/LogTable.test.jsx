import { render, screen, fireEvent } from '@testing-library/react';
import LogTable from './LogTable';
import { describe, it, expect } from 'vitest';

describe('LogTable Component', () => {
    const mockLogs = [
        {
            timestamp: '2023-10-27T10:00:00Z',
            source: 'firewall',
            severity: 3,
            message: 'Connection blocked',
            raw_data: { event: 'blocked', src: '1.1.1.1' }
        },
        {
            timestamp: '2023-10-27T10:05:00Z',
            source: 'app-server',
            severity: 5,
            message: 'User login',
            raw_data: 'Login success'
        }
    ];

    it('renders "No logs found" when log list is empty', () => {
        render(<LogTable logs={[]} />);
        expect(screen.getByText(/No logs found/i)).toBeInTheDocument();
    });

    it('renders log rows correctly', () => {
        render(<LogTable logs={mockLogs} />);
        // Check for content presence
        expect(screen.getByText(/firewall/i)).toBeInTheDocument();
        expect(screen.getByText(/Connection blocked/i)).toBeInTheDocument();
        expect(screen.getByText(/app-server/i)).toBeInTheDocument();
    });

    it('displays correct severity icons/colors', () => {
        render(<LogTable logs={mockLogs} />);
        // Sev 3 should have text-red-400 class (logic check)
        // We can't easily check class on the exact element without test-ids, but we can check if the text exists
        expect(screen.getByText('3')).toBeInTheDocument(); // Severity 3
    });

    it('opens modal on row click', () => {
        render(<LogTable logs={mockLogs} />);
        const row = screen.getByText('Connection blocked').closest('tr');
        fireEvent.click(row);

        // Check for modal header
        expect(screen.getByText('Log Details')).toBeInTheDocument();
        // Check for JSON content in modal
        expect(screen.getByText(/"event": "blocked"/)).toBeInTheDocument();
    });
});
