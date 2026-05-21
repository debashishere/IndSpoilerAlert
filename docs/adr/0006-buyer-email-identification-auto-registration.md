# Buyer Email Identification and Auto-Registration

In the early phase of the platform, there is no formal authentication or login system for retail buyers. However, placing a bid requires identifying which buyer is participating. Previously, the system relied on database-generated MongoDB `_id` values, which are difficult for users or external tools to specify without an active session.

We decided to use the **Buyer's Email Address** as the primary identifier for placing and managing bids. When placing a bid in the Marketplace, the buyer inputs their email. 

### Rationale

- **Authentication Bypass**: Allows buyers to place bids and track their communications without requiring a full login/session infrastructure, keeping the prototype lightweight yet functional.
- **Auto-Registration**: If a bid is submitted with an email address that does not exist in the database, the backend automatically registers a new `Buyer` document, deriving a company name from the email domain (e.g., `buyer@groceryoutlet.com` becomes *"Grocery Outlet"*). This prevents database reference errors and ensures continuous execution during ad-hoc manual testing.
- **Communication Trail**: Using emails aligns with the glossary's concept of a B2B communication chain, facilitating simulated email exchanges and negotiation logs.
