export const DEFAULT_COUNTER_MESSAGE =
  '<p>Dear <span data-token="buyer_name">{{buyer_name}}</span>,</p>' +
  '<p>We propose a counter-offer for <span data-token="product_name">{{product_name}}</span> at <span data-token="counter_price">{{counter_price}}</span> for <span data-token="counter_quantity">{{counter_quantity}}</span> cases (original offer: <span data-token="original_price">{{original_price}}</span>).</p>' +
  '<p><a href="{{accept_counter_link}}" class="btn-counter-accept" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 22px; border-radius: 8px; font-weight: 700; text-decoration: none; margin-right: 12px; font-size: 14px;">Accept Counter-Offer (<span data-token="counter_price">{{counter_price}}</span> • <span data-token="counter_quantity">{{counter_quantity}}</span>)</a>' +
  '<a href="{{renegotiate_link}}" class="btn-counter-renegotiate" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 22px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px;">Propose New Terms / Re-bid</a></p>';

export const DEFAULT_DECLINE_MESSAGE =
  '<p>Dear <span data-token="buyer_name">{{buyer_name}}</span>,</p>' +
  '<p>Thank you for your offer on <strong><span data-token="product_name">{{product_name}}</span></strong> (Lot #<span data-token="lot_number">{{lot_number}}</span>). After review, we are unable to accept your offer.</p>' +
  '<p><strong>Reason:</strong> <span data-token="decline_reason">{{decline_reason}}</span></p>' +
  '<p><strong>Notes:</strong> <span data-token="decline_rationale">{{decline_rationale}}</span></p>' +
  '<p>We invite you to explore other available inventory opportunities: <a href="{{catalog_link}}">Explore Available Surplus Inventory</a>.</p>';

export const DEFAULT_ACCEPTANCE_MESSAGE =
  '<p>Dear <span data-token="buyer_name">{{buyer_name}}</span>,</p>' +
  '<p>We are pleased to accept your offer for <span data-token="awarded_quantity">{{awarded_quantity}}</span> of <span data-token="product_name">{{product_name}}</span> (SKU: <span data-token="sku">{{sku}}</span>) at <span data-token="price_per_case">{{price_per_case}}</span>. Total settlement amount: <span data-token="total_amount">{{total_amount}}</span>.</p>' +
  '<p><strong>Pickup Location:</strong> <span data-token="pickup_location">{{pickup_location}}</span><br/><strong>Dock Operating Hours:</strong> <span data-token="pickup_hours">{{pickup_hours}}</span></p>' +
  '<p>Please review and execute the deal agreement: <a href="{{deal_document_link}}"><span data-token="deal_document_link">{{deal_document_link}}</span></a></p>' +
  '<p>Complete transaction payment: <a href="{{payment_link}}"><span data-token="payment_link">{{payment_link}}</span></a></p>';
