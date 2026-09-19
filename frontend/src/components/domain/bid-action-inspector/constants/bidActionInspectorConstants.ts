export const NEGOTIATION_TOKENS = [
  'buyer_name',
  'product_name',
  'counter_price',
  'counter_quantity',
  'original_price',
  'accept_counter_link',
  'renegotiate_link'
];

export const SETTLEMENT_TOKENS = [
  'buyer_name',
  'product_name',
  'sku',
  'awarded_quantity',
  'price_per_case',
  'total_amount',
  'pickup_location',
  'pickup_hours',
  'payment_link',
  'deal_document_link'
];

export const DECLINE_TOKENS = [
  'buyer_name',
  'product_name',
  'lot_number',
  'decline_reason',
  'decline_rationale',
  'catalog_link'
];

export const DECLINE_REASONS = [
  'Price below minimum recovery floor',
  'Inventory committed elsewhere',
  'Logistics/pickup constraint',
  'Custom rationale'
];
