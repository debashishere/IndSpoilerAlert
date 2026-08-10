import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TipTapTemplateEditor } from '../components/TipTapTemplateEditor';

describe('Body Section Editor Typing & Raw HTML Code Mode', () => {
  const defaultProps = {
    supplierId: 'supplier-123'
  };

  it('renders visual editor contentEditable element without crashing', () => {
    render(<TipTapTemplateEditor {...defaultProps} />);
    const editable = screen.getByTestId('tiptap-editable-content');
    expect(editable).toBeInTheDocument();
    expect(editable.getAttribute('contenteditable')).toBe('true');
  });

  it('allows switching to Raw HTML Code Editor mode and editing raw bodyHtml in textarea', () => {
    render(<TipTapTemplateEditor {...defaultProps} />);

    const codeToggle = screen.getByTestId('toggle-code-editor');
    fireEvent.click(codeToggle);

    const textarea = screen.getByTestId('raw-html-editor-textarea') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: '<h2>Custom Typed HTML Body</h2>' } });
    expect(textarea.value).toBe('<h2>Custom Typed HTML Body</h2>');

    const visualToggle = screen.getByTestId('toggle-visual-editor');
    fireEvent.click(visualToggle);

    const editable = screen.getByTestId('tiptap-editable-content');
    expect(editable.innerHTML).toContain('Custom Typed HTML Body');
  });
});
