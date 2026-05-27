import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PriorityTag } from './PriorityTag';
import React from 'react';

describe('PriorityTag Component', () => {
  it('should render Low priority tag in Vietnamese', () => {
    render(<PriorityTag priority="LOW" />);
    expect(screen.getByText('Thấp')).toBeInTheDocument();
  });

  it('should render Medium priority tag in Vietnamese', () => {
    render(<PriorityTag priority="MEDIUM" />);
    expect(screen.getByText('Trung bình')).toBeInTheDocument();
  });

  it('should render High priority tag in Vietnamese', () => {
    render(<PriorityTag priority="HIGH" />);
    expect(screen.getByText('Cao')).toBeInTheDocument();
  });

  it('should render Urgent priority tag in Vietnamese', () => {
    render(<PriorityTag priority="URGENT" />);
    expect(screen.getByText('Khẩn cấp')).toBeInTheDocument();
  });
});
