# Issue #25: Dynamic Data Translator - Wizard Rules & Custom Supplier Templates

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Parent

- Issue #22

## What to build

Extend the `translatorService` and frontend column-mapping wizard. Support parsing case weights and packaging sizes. Enable users to define translation rules (like mapping custom headers to certifications) during upload, and save them within the `SupplierTemplate` for automated future ingestion.

## Acceptance criteria

- [ ] Dynamic Data Translator parses unit size, case weight, and custom headers.
- [ ] Ingestion wizard allows creating/confirming `SemanticRule`s for unmapped columns.
- [ ] Confirmed semantic rules save to the supplier's template document.
- [ ] Future file uploads apply these saved rules automatically.
- [ ] Tests verify that rules parse data types correctly (toBoolean, toNumber, celsiusToFahrenheit, toStringList).

## Blocked by

- Issue #23
