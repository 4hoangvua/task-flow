import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MarkdownRenderer } from './MarkdownRenderer';
import React from 'react';

describe('MarkdownRenderer Component', () => {
  it('should render placeholder when content is empty', () => {
    render(<MarkdownRenderer content="" />);
    expect(screen.getByText(/Không có mô tả chi tiết/i)).toBeInTheDocument();
  });

  it('should render headings correctly', () => {
    render(<MarkdownRenderer content={"# Heading 1\n## Heading 2"} />);
    expect(screen.getByText(/Heading 1/)).toBeInTheDocument();
    expect(screen.getByText(/Heading 2/)).toBeInTheDocument();
  });

  it('should render inline styles like bold and italic', () => {
    const { container } = render(<MarkdownRenderer content="This is **bold** and *italic* text." />);
    expect(container.querySelector('strong')).toHaveTextContent('bold');
    expect(container.querySelector('em')).toHaveTextContent('italic');
  });

  it('should group list items in a single ul container', () => {
    const { container } = render(<MarkdownRenderer content={"- Item 1\n- Item 2"} />);
    const ul = container.querySelector('ul');
    expect(ul).toBeInTheDocument();
    expect(ul?.className).toContain('space-y-1');
    const lis = ul?.querySelectorAll('li');
    expect(lis).toHaveLength(2);
  });

  it('should render checklist and call onCheckboxChange when clicked', () => {
    const handleCheckboxChange = vi.fn();
    render(<MarkdownRenderer content={"- [ ] Task 1\n- [x] Task 2"} onCheckboxChange={handleCheckboxChange} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).toBeChecked();

    // Click checkbox
    fireEvent.click(checkboxes[0]);
    expect(handleCheckboxChange).toHaveBeenCalledWith(0, true);
  });
});
