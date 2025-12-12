
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

// Mock the Gemini service to avoid API calls during tests
vi.mock('./services/geminiService', () => ({
  openApiKeySelection: vi.fn(),
  ensurePaidApiKey: vi.fn().mockResolvedValue(true),
}));

// Mock the API Key service to avoid environment variable errors
vi.mock('./services/apiKey', () => ({
  hasGeminiApiKey: vi.fn().mockReturnValue(true),
  getGeminiApiKey: vi.fn().mockReturnValue('mock-key'),
  promptForApiKeySelection: vi.fn(),
}));

// Mock scrollIntoView since jsdom doesn't implement it
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('App', () => {
  it('renders the application', () => {
    render(<App />);
    // Check for a key element on the landing page or initial state
    // Based on App.tsx, it starts at AppView.HOME which renders LandingPage
    // Looking for "NanoFashion" text which is in the header
    // The text is split into two spans: "Banana" and "Couture"
    const bananaTexts = screen.getAllByText((content, element) => {
        return element?.tagName.toLowerCase() === 'span' && content.includes('Banana');
    });
    expect(bananaTexts.length).toBeGreaterThan(0);
  });
});
