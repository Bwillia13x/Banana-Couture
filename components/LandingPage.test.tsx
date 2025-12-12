import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LandingPage } from './LandingPage';
import { AppView } from '../types';

describe('LandingPage', () => {
  it('navigates to Studio when Start Designing is clicked', () => {
    const onNavigate = vi.fn();
    render(<LandingPage onNavigate={onNavigate} onStartTour={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /start designing/i }));

    expect(onNavigate).toHaveBeenCalledWith(AppView.STUDIO);
  });

  it('invokes demo action when Watch Demo is clicked', () => {
    const onStartTour = vi.fn();
    render(<LandingPage onNavigate={vi.fn()} onStartTour={onStartTour} />);

    fireEvent.click(screen.getByRole('button', { name: /watch demo/i }));

    expect(onStartTour).toHaveBeenCalled();
  });
});
