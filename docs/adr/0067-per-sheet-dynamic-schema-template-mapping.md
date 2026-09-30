# 67. Per-Sheet Dynamic Schema Template Mapping

To accommodate varying column naming conventions across disparate facility spreadsheets (e.g., ERP batch exports vs. manual warehouse sheets), each dynamically discovered Google Sheet retains its own column mapping configuration. Inbound batches apply intelligent heuristic mapping upon first sync, while allowing users to inspect and adjust column alignments per sheet directly from the Connected Sheets Roster.
