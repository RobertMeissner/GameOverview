import { render, screen } from '@testing-library/react';
import App from './App';

test('renders authentication UI', () => {
  render(<App />);
  // Look for the sign in button specifically
  const signInButton = screen.getByRole('button', { name: /sign in/i });
  expect(signInButton).toBeInTheDocument();
});
