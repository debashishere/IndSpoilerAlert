# Simulation Framework for Bids, Donations, and Recycling

To support secondary case-study workflows (Competitive Bidding, Alternative Disposal, and Distressed Analytics) without introducing excessive operational complexity (e.g., configuring RabbitMQ, scheduling Redis-backed workers, or implementing real-world logistics/carrier integrations), we decided to implement a lightweight simulation framework directly inside the Node.js Express application. 

Simulated bids will be generated asynchronously using standard in-memory timer queues and stored directly in MongoDB, while logistics events for donations and recycling will be logged to static transaction timelines. This allows validation of the end-to-end user experience and reporting logic while maintaining a lightweight, zero-dependency local architecture.
