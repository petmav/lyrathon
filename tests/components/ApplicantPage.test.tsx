import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ApplicantFormPage from '@/app/applicant/page';
import { apiCall } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('next/link', () => {
    return ({ children }: { children: React.ReactNode }) => {
        return <a>{children}</a>;
    };
});

// Mock API Call
jest.mock('@/lib/utils', () => ({
    apiCall: jest.fn(),
}));

// Mock Fetch for document uploads
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
    })
) as jest.Mock;

describe('ApplicantFormPage', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        (apiCall as jest.Mock).mockResolvedValue({
            data: {
                name: 'John Doe',
                email: 'john@example.com',
                skills_text: 'React, TypeScript',
            },
        });

        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(() => 'mock-candidate-id'),
                setItem: jest.fn(),
                removeItem: jest.fn(),
                clear: jest.fn(),
            },
            writable: true,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders the dashboard view by default', async () => {
        render(<ApplicantFormPage />);

        expect(screen.getByText(/Your Profile/i)).toBeInTheDocument();
        expect(screen.getByText(/Ready to be seen/i)).toBeInTheDocument();
        expect(screen.getByText(/Skills & Awards/i)).toBeInTheDocument();
    });

    it('slides to editor panel when Edit is clicked', async () => {
        render(<ApplicantFormPage />);

        // Initial state: Dashboard visible (logic checked by existence of Edit button)
        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]); // Click first edit button (Core Profile)

        // Check if editor title appears
        await waitFor(() => {
            expect(screen.getByText('Edit Core Profile')).toBeInTheDocument();
        });

        // Check if Back button is present
        expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument();
    });

    it('populates form with fetched data', async () => {
        render(<ApplicantFormPage />);

        // Open Core Profile editor
        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
            expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
            expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
        });
    });

    it('calls API when Save Changes is clicked', async () => {
        render(<ApplicantFormPage />);

        // Open editor
        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);

        // Change name
        const nameInput = await screen.findByDisplayValue('John Doe');
        fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

        // Save
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(apiCall).toHaveBeenCalledWith('/api/candidates/register', 'POST', expect.objectContaining({
                name: 'Jane Doe'
            }));
        });
    });
});
