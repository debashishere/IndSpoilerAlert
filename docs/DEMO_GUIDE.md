# B2B Surplus Liquidation Platform - Feature Demonstration Guide

This guide provides a structured, step-by-step walkthrough to demonstrate how the **IndSpoiler Alert Inventory Platform** aligns with the real-world **IndSpoiler Alert iQ** enterprise platform features and its prominent industry case studies (*Danone, HelloFresh, Kraft Heinz, Conagra, and Hormel*).

---

## 1. Real-World Case Study Context

### 💡 Danone: Markdown Digitization
*   **Challenge**: Determining discount levels manually for soon-to-expire yogurts.
*   **IndSpoiler Alert Solution**: Analytical yield pricing engines that suggest markdown schedules based on remaining shelf-life, category elasticity, and volume.
*   **Our Platform Alignment**: The **Dynamic Yield Optimization Engine** uses SciPy solvers (L-BFGS-B method) to compute optimal discount recommendations.

### 💡 HelloFresh: Landfill Diversion
*   **Challenge**: Surplus food going to waste in distribution centers.
*   **IndSpoiler Alert Solution**: Automatic redirection to food bank networks and organic recycling facilities. HelloFresh achieved a **65% reduction in organic waste sent to landfills** and **nearly doubled charity donations (from 33% to 61%)**.
*   **Our Platform Alignment**: Integrated **Alternative Disposal Actions** (Donate and Recycle) on inventory lots, with automatically calculated environmental stats (waste diverted, CO2 prevented, and tax benefits).

### 💡 Conagra & Ferrara: Scale and Data-Driven Decisions
*   **Challenge**: Messy supplier spreadsheets and raw invoices (different layouts, abbreviated products) slow down closeout sales.
*   **IndSpoiler Alert Solution**: Standardized ingestion templates and AI normalization to clean names, combined with real-time analytics.
*   **Our Platform Alignment**: Self-serve **Column Mapping Wizard** and **Gemini AI normalizer** to parse raw files and map them to standard inventory slots.

---

## 2. Prerequisites & Setup

1.  Make sure Docker is running on your machine.
2.  Start the entire stack by running the launcher script in your terminal:
    ```bash
    ./start-services.sh
    ```
    This launches the MongoDB container, Redis container, LocalStack (S3/SQS), the FastAPI sidecar (`http://localhost:8000`), the Express backend (`http://localhost:5001`), and the Vite React frontend.
3.  Open the web interface in your browser:
    ```
    http://localhost:5173
    ```

---

## 3. Demonstration Storyline: "The Short-Dated Yogurt Liquidation Loop"

We will follow a single lot of short-dated Greek Yogurt from a messy spreadsheet import to final sales, donations, logistics, and sustainability tracking.

### Phase 1: Messy Ingestion & AI Normalization
*   **Goal**: Demonstrate how the platform handles messy, non-standard datasets without manual data entry.
*   **Steps**:
    1.  Navigate to the **Ingestion** tab.
    2.  Click **Choose File** and select [test_files/danone_messy_invoice.csv](file:///Users/debashisroy/Documents/IndSpoilerAlert/test_files/danone_messy_invoice.csv).
    3.  Select **Danone North America** as the supplier.
    4.  Click **Upload & Preview**.
    5.  Observe the **B2B Column Mapping Wizard**:.
        - The parser has detected column headers but needs mapping because they are non-standard.
        - Map the columns as follows:
            *   *SKU* $\rightarrow$ `Product_ID`
            *   *Description* $\rightarrow$ `Item_Name`
            *   *Quantity (Cases)* $\rightarrow$ `Stock`
            *   *Expiration Date* $\rightarrow$ `Best_Before`
            *   *Original Cost ($)* $\rightarrow$ `Cost`
        - Check the **Save as Supplier Template** checkbox and enter `Danone Standard Layout`.
    6.  Click **Process & Ingest**.
    7.  Once processing is complete, look at the parsed grid. Notice how the **AI Normalizer** has cleaned the messy SKU names:
        - `DAN Greek Ygt 4ct` has been normalized to **Danone Greek Yogurt 4-Pack** and classified under the **Dairy** category.
        - `ULVR Creamer 32oz` has been normalized to **Unilever Creamer 32oz**.

### Phase 2: Risk Assessment & Compliance
*   **Goal**: Transition products into active marketplace inventory.
*   **Steps**:
    1.  Go to the **Inventory** tab.
    2.  Locate the newly ingested lot: **Danone Greek Yogurt 4-Pack** (Lot Number will be generated).
    3.  Observe the visual **Remaining Shelf Life (RSL)** countdown timer (showing days remaining and percentage of shelf life remaining).
    4.  Click on the row or click **Manage** to open the [Lot Operations Hub](file:///Users/debashisroy/Documents/IndSpoilerAlert/frontend/src/components/LotOperationsHubView.tsx).
    5.  Go to the **Overview / Risk** sub-tab.
    6.  Click **Assess Risk**. The backend will assess inventory risk and output:
        - A **Risk Category** (e.g. *High* because yogurts expire soon).
        - **Predicted Waste** (e.g., predicted amount that will go to landfill if no action is taken).
    7.  Go to the **Compliance** sub-tab. FDA-regulated products require a compliance batch record before going live.
    8.  Click **Upload Compliance Certificate** and upload any dummy PDF/file. This transitions the lot's compliance status to **Verified**.

### Phase 3: Real-Time Dynamic Pricing Simulator
*   **Goal**: Optimize markdown levels to maximize cost recovery while ensuring sell-through.
*   **Steps**:
    1.  Still in the **Lot Operations Hub**, navigate to the **Pricing & Disposition** sub-tab.
    2.  Click **Calculate Recommended Price**.
    3.  The system uses the SciPy solver inside the FastAPI sidecar ([sidecar/main.py](file:///Users/debashisroy/Documents/IndSpoilerAlert/sidecar/main.py)) to simulate expected sell-through based on the category's elasticity (Dairy is high elasticity: `-1.8`).
    4.  Adjust the **Days to Expiration** and **Quantity** sliders:
        - Notice how reducing the days to expiration increases the recommended discount exponentially to ensure liquidation.
        - Observe the calculated **Expected Recovery Value** and **Sell-Through Probability**.
    5.  Once satisfied, select **Sell (Promote to Marketplace)** as the recommended action, and click **Promote to Marketplace**.

### Phase 4: Smart Buyer Matching & Bidding
*   **Goal**: Show how listings are matched to buyers and bid negotiations are simulated.
*   **Steps**:
    1.  Navigate to the **Marketplace** tab (representing the secondary buyer portal).
    2.  Locate the active listing for **Danone Greek Yogurt 4-Pack**.
    3.  Click **View Details** or open the **Smart Matches** drawer:
        - Under **Smart Matching**, see the ranked top 5 buyers scored by embedding similarity.
        - Look at the Match Explanations: e.g., **Grocery Outlet** scored high because they accept short-dated dairy and are within the distribution center's transport radius.
    4.  Under the listing, click **Simulate Bid** (or enter a custom quantity and price). This simulates an incoming buyer offer:
        - e.g., *Grocery Outlet* submits a bid for **300 cases** at **$2.50 per case** (original cost was $3.25).
    5.  Go to the **Bid Negotiation** tab:
        - Send a mock counter-message to the buyer (e.g. "We can accept $2.50 if you handle freight, otherwise we counter at $2.75").
        - See the mock chat history update in real-time.

### Phase 5: Partial Awarding & Donation Diversion
*   **Goal**: Award a portion of the inventory to close the sale, and redirect the rest to donation.
*   **Steps**:
    1.  Return to the **Lot Operations Hub** for the yogurt lot.
    2.  Go to the **Bids & Awarding** sub-tab.
    3.  Locate the bid from **Grocery Outlet** for 300 cases.
    4.  Click **Award Bid**:
        - Since the lot has 500 cases in total, this leaves 200 cases remaining.
        - The lot remains active in the marketplace with 200 cases available.
    5.  For the remaining 200 cases, let's divert them to charity to avoid landfill waste.
    6.  In the **Disposition** panel, select **Divert to Donation**.
    7.  Select **Feeding America Midwest** as the charity. Click **Confirm Donation**.
    8.  Notice the calculated tax benefit and tonnage of waste diverted from landfills.

### Phase 6: Cold Chain Logistics & Fulfillment
*   **Goal**: Walk through the fulfillment process, ensuring FSMA temperature compliance.
*   **Steps**:
    1.  Navigate to the **Logistics** tab.
    2.  Locate the shipment corresponding to the Grocery Outlet award.
    3.  Click **Manage Fulfillment**:
        - Assign a carrier (e.g. *Apex Logistics*).
        - Schedule a Dock door pickup window (this transitions the appointment status from `scheduled` to `confirmed`).
    4.  To ensure cold chain safety, log a temperature check:
        - Enter a temperature in Fahrenheit (e.g., `36.5°F`).
        - The system confirms this is within the safe range for Dairy (34–38°F).
    5.  Update status to **In Transit**, and finally to **Delivered**.

### Phase 7: Sustainability & Recovery Analytics
*   **Goal**: Measure the bottom-line financial and environmental impact.
*   **Steps**:
    1.  Navigate to the **Analytics** tab.
    2.  Observe the real-time aggregated metrics:
        - **COGS Recovery Rate**: Average % of inventory cost recovered.
        - **Waste Diverted (Tons)**: Weight of food redirected from landfills to charity.
        - **CO2 Emissions Prevented**: Computed offset based on avoided decomposition.
        - **Landfill Savings**: Reduced disposal tipping fees.

---

## 4. Key Under-the-Hood Code Locations

For developers interested in exploring how these features are wired, check these code entry points:

-   **Ingestion Wizard & AI parsing**:
    -   API Endpoints: [routes/api.ts](file:///Users/debashisroy/Documents/IndSpoilerAlert/backend/src/routes/api.ts#L57-L60)
    -   FastAPI Docling parsing: [sidecar/main.py](file:///Users/debashisroy/Documents/IndSpoilerAlert/sidecar/main.py#L93-L177)
-   **Dynamic Pricing Solver**:
    -   FastAPI SciPy optimize solver: [sidecar/main.py](file:///Users/debashisroy/Documents/IndSpoilerAlert/sidecar/main.py#L225-L277)
-   **Semantic Buyer Matching**:
    -   Distance & category recommendation: [sidecar/main.py](file:///Users/debashisroy/Documents/IndSpoilerAlert/sidecar/main.py#L279-L337)
-   **Bidding, Awards, and Logistics**:
    -   Express controllers: [controllers/inventoryController.ts](file:///Users/debashisroy/Documents/IndSpoilerAlert/backend/src/controllers/inventoryController.ts)
-   **Aesthetics & CSS**:
    -   Dark-mode styles and animations: [src/index.css](file:///Users/debashisroy/Documents/IndSpoilerAlert/frontend/src/index.css)
