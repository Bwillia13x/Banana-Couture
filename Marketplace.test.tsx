import type React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Marketplace } from './components/Marketplace';
import { Product } from './types';

const baseProduct: Product = {
  id: 'p1',
  name: 'Test Jacket',
  description: 'A test description',
  price: 450,
  imageUrl: 'https://example.com/image.jpg',
  materials: [],
  creator: 'Tester',
  likes: 12,
};

const renderMarketplace = (overrideProps: Partial<React.ComponentProps<typeof Marketplace>> = {}) => {
  const props: React.ComponentProps<typeof Marketplace> = {
    products: [baseProduct],
    onShowToast: vi.fn(),
    onRemix: vi.fn(),
    likedProducts: new Set<string>(),
    onToggleLike: vi.fn(),
    onPurchase: vi.fn(),
    ownedItemIds: [],
    ...overrideProps,
  };

  return render(<Marketplace {...props} />);
};

describe('Marketplace', () => {
  it('renders products and toggles like state', () => {
    const onToggleLike = vi.fn();
    renderMarketplace({ onToggleLike });

    fireEvent.click(screen.getByLabelText(/like/i));

    expect(onToggleLike).toHaveBeenCalledWith(baseProduct.id);
  });

  it('shows empty state when search has no matches', () => {
    renderMarketplace();

    fireEvent.change(screen.getByPlaceholderText(/search materials/i), {
      target: { value: 'nope' },
    });

    expect(screen.getByText(/no designs found/i)).toBeInTheDocument();
  });
});
