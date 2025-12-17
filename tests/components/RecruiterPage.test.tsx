import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecruiterQueryPage from '@/app/recruiter_query_page/page';

// Mock Next.js Link
jest.mock('next/link', () => {
    return ({ children }: { children: React.ReactNode }) => {
        return <a>{children}</a>;
    };
});

global.fetch = jest.fn();

describe('RecruiterQueryPage', () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
    });

    it('renders the chat interface', () => {
        render(<RecruiterQueryPage />);
        expect(screen.getByText('Recruiter Console')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Try: "backend engineer/i)).toBeInTheDocument();
    });

    it('displays initial greeting', async () => {
        render(<RecruiterQueryPage />);
        // Initial message might be typed, so use findBy or partial match
        await waitFor(() => {
            expect(screen.getByText(/Describe the employee you’re looking for/i)).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('sends a message and displays response', async () => {
        render(<RecruiterQueryPage />);

        // Mock API response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({
                overall_summary: "Here are the best matches.",
                shortlist: [
                    {
                        candidate_id: "c1",
                        name: "Alice Smith",
                        role: "Frontend Dev",
                        confidence: 0.95,
                        match_summary: "Great fit",
                        email: "alice@example.com",
                        recommended_action: "Interview"
                    }
                ]
            }))
        });

        const input = screen.getByPlaceholderText(/Try: "backend engineer/i);
        const sendButton = screen.getByRole('button', { name: /Send/i }); // Button has arrow or text

        fireEvent.change(input, { target: { value: 'Frontend Developer' } });
        fireEvent.click(sendButton);

        // Check if user message appears
        expect(screen.getByText('Frontend Developer')).toBeInTheDocument();

        // Check if "Thinking..." or loader appears (optional, implementation detail)

        // Check if response appears
        await waitFor(() => {
            expect(screen.getByText('Shortlist candidates')).toBeInTheDocument();
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });
    });
});
