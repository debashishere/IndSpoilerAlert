// components/EmailBuilder/extensions/Figure.ts
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React, { useState, useCallback } from 'react';

/**
 * Figure
 * ─────
 * Experimental generic figure extension.
 * Wraps an image with an editable caption.
 *
 * Schema: figure > img + figcaption
 *
 * Email compatibility note:
 *   <figure> and <figcaption> have poor support in Outlook.
 *   Use the emailHtmlTransformer to flatten these to <div> + <p>
 *   with inline styles at export time.
 */

export const Figure = Node.create({
  name: 'figure',

  group: 'block',

  content: 'image figcaption',

  draggable: true,

  isolating: true,

  addAttributes() {
    return {
      class: {
        default: 'email-figure',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ node, selected, editor }) => {
      const [caption, setCaption] = useState('');

      const updateCaption = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          const newCaption = e.target.value;
          setCaption(newCaption);
          // In a full implementation, you'd update the figcaption node content here
        },
        []
      );

      return (
        <NodeViewWrapper
          as="figure"
          className={`
            my-4 border rounded-lg overflow-hidden bg-white
            ${selected ? 'ring-2 ring-blue-400' : 'border-gray-200'}
          `}
          data-drag-handle
        >
          <NodeViewContent
            as="div"
            className="w-full"
          />
          <figcaption className="px-3 py-2 bg-gray-50 text-sm text-gray-600 border-t border-gray-200">
            <input
              type="text"
              value={caption}
              onChange={updateCaption}
              placeholder="Figure caption..."
              className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
              onMouseDown={(e) => e.stopPropagation()}
            />
          </figcaption>
        </NodeViewWrapper>
      );
    });
  },
});

/**
 * Figcaption
 * ─────────
 * The caption node inside a figure.
 */
export const Figcaption = Node.create({
  name: 'figcaption',

  group: 'block',

  content: 'inline*',

  parseHTML() {
    return [
      {
        tag: 'figcaption',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['figcaption', mergeAttributes(HTMLAttributes), 0];
  },
});