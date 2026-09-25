# 04: Ingestion Sidecar — Python OCR Service Container & OpenCV/Tesseract Verification (UI-05)

**What to build:** Verify and containerize the Python OCR sidecar service (`sidecar/main.py`) equipped with OpenCV and Tesseract OCR dependencies to handle document parsing reliably in staging.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Verify container build for `sidecar/main.py` including OpenCV and Tesseract runtime libraries.
- [x] Ensure `SIDE_CAR_URL` service endpoint configuration is correctly wired in backend/frontend environments.
- [x] Verify OCR document parsing fallback operates as expected when processing incoming invoice and spec documents.
