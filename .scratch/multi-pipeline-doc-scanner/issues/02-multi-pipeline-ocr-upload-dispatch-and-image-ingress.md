# 02: Multi-Pipeline OCR Upload Dispatch and Image Ingress

**What to build:** Operators can drag-and-drop or browse PDF manifests, JPG photo invoices, and PNG packing slips up to 50MB into the scanner dropzone. Triggering "Run AI Extraction" routes the file to the pipeline-specific backend thunk (`uploadInventoryThunk`, `uploadSalesThunk`, or `uploadBuyerThunk`) based on the active destination target, while the backend upload filter accepts image mimetypes alongside PDFs.

**Blocked by:** 01: Multi-Pipeline Ingress Target Selection and Telemetry

**Status:** completed

- [x] Dropzone accepts `.pdf`, `.png`, `.jpg`, and `.jpeg` files and displays selected file name, size, and targeted destination label.
- [x] Backend multer file filter allows image mimetypes (`image/*`, `.png`, `.jpg`, `.jpeg`) without 400 rejection.
- [x] Clicking "Run AI Extraction" invokes `uploadInventoryThunk` when Inventory is selected, `uploadSalesThunk` when Sales is selected, and `uploadBuyerThunk` when Buyers is selected.
- [x] Shows extraction loading spinner and handles OCR errors with clear inline alert banners.
- [x] Unit tests verify dispatch to the appropriate pipeline upload service depending on active target.
