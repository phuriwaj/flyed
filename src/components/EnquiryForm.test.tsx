import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnquiryForm from './EnquiryForm';

describe('EnquiryForm validation', () => {
  it('renders step 1 first', () => {
    render(<EnquiryForm />);
    expect(screen.getByLabelText(/school/i)).toBeInTheDocument();
  });

  it('shows validation error on empty email', async () => {
    const user = userEvent.setup();
    render(<EnquiryForm />);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  it('rejects invalid email', async () => {
    const user = userEvent.setup();
    render(<EnquiryForm />);
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });

  it('requires group size between 4 and 60', async () => {
    const user = userEvent.setup();
    render(<EnquiryForm />);
    await user.type(screen.getByLabelText(/group size/i), '3');
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/between 4 and 60/i)).toBeInTheDocument();
  });
});
