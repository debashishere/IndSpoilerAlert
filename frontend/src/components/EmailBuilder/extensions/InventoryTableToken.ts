// frontend/src/components/EmailBuilder/extensions/InventoryTableToken.ts
import { Node, mergeAttributes } from '@tiptap/core';

/**
 * InventoryTableToken
 * ───────────────────
 * Custom Tiptap Node extension representing the {{inventory_table}} placeholder.
 *
 * Properties:
 *   - atom: true -> prevents cursor injection inside the chip element
 *   - inline: true -> can sit alongside text
 *   - serializes to data-inventory-table-token for server-side / export transformation
 */
export const InventoryTableToken = Node.create({
  name: 'inventoryTableToken',

  group: 'inline',

  inline: true,

  atom: true,

  addAttributes() {
    return {
      token: {
        default: '{{inventory_table}}',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-inventory-table-token]',
      },
      {
        tag: 'div[data-token="inventory_table"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-inventory-table-token': 'true',
        'data-token': 'inventory_table',
        class: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 select-none cursor-default my-1',
        style: 'display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background-color: #f0fdf4; color: #15803d; border: 1.5px dashed #86efac; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; margin: 0 2px;',
      }),
      '📊 Dynamic Inventory Table {{inventory_table}}',
    ];
  },
});
