# Plan: Extract Transaction Information From Invoice

## Context

Users currently create transactions manually by filling out every field. When they have an invoice or receipt (PDF or image), they must read it themselves and type in the details. This feature adds an "Upload Invoice" button to the transaction list that automatically extracts transaction data from the uploaded document, pre-fills the creation form, and attaches the file to the created transaction. All processing is fully local (no external APIs) for privacy.

## Processing Pipeline Architecture

The extraction uses a **three-stage pipeline** with clean interfaces between steps:

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  File Input  │────▶│  Text Extraction │────▶│  AI Structuring   │────▶│ Heuristic Parser │
│  (PDF/Image) │     │  (pdf-parse /    │     │  (transformers.js │     │  (regex fallback) │
│              │     │   tesseract.js)  │     │   local NER model)│     │                  │
└─────────────┘     └──────────────────┘     └───────────────────┘     └──────────────────┘
                            │                        │                         │
                            ▼                        ▼                         ▼
                        rawText               partial result            filled result
                                          (from NER entities)      (gaps filled by regex)
```

Each step implements a common `ExtractionStep` interface and receives/returns an `ExtractionContext`. Steps are fault-tolerant: if one fails, the next still runs on whatever data is available.

## Data Flow (End-to-End)

```
1. User clicks "Upload Invoice" in TransactionsList
2. File picker opens (accepts images + PDFs, camera on mobile)
3. Client POSTs file to POST /api/transactions/extract
4. Server:
   a. Generates tempFileId (UUID), saves file to data/temp/{tempFileId}/
   b. Runs extraction pipeline on file buffer
   c. Returns { tempFileId, fileName, extraction: ExtractionResult }
5. Client redirects to /transactions/new?tempFileId=xxx&name=...&amount=...&...
6. NewTransaction reads all search params, passes to TransactionForm
7. Form renders pre-filled, shows "Invoice attached" indicator
8. User reviews/edits, submits
9. createTransaction mutation:
   a. Creates transaction (existing logic)
   b. If tempFileId present: moves temp file → permanent attachment, creates Attachment record
10. Redirect to /transactions/{id} (attachment visible in detail view)
```

## New Files

### 1. Pipeline Types — `src/lib/model/transactions/services/extraction/types.ts`
```typescript
interface ExtractionResult {
  name: string | null
  amount: number | null
  type: TransactionType | null
  valueDate: Date | null
  description: string | null
  counterpartyName: string | null
  confidence: Record<string, number>
  rawText: string
}

interface ExtractionStep {
  name: string
  execute(context: ExtractionContext): Promise<ExtractionContext>
}

interface ExtractionContext {
  fileBuffer: Buffer
  fileName: string
  mimeType: string
  rawText: string
  result: ExtractionResult
}
```

### 2. Step 1: Text Extraction — `src/lib/model/transactions/services/extraction/steps/textExtractor.ts`
- PDF (`application/pdf`): Use `pdf-parse` to extract embedded text. If result is < 50 chars, treat as scanned PDF and fall through to OCR.
- Image (`image/*`): Use `tesseract.js` with English + German language packs. Configure cache at `data/tesseract/`.
- Sets `context.rawText`.

### 3. Step 2: AI Structuring — `src/lib/model/transactions/services/extraction/steps/aiStructurer.ts`
- Uses `@huggingface/transformers` with a token-classification (NER) model (e.g. `Xenova/bert-base-NER` or similar small model).
- Extracts entities: amounts (MONEY), dates, organization names (ORG → counterparty).
- Maps entities to `ExtractionResult` fields, sets confidence scores.
- If model not yet downloaded or fails to load, logs warning and passes through unchanged.

### 4. Step 3: Heuristic Parser — `src/lib/model/transactions/services/extraction/steps/heuristicParser.ts`
- Only fills fields that are still `null` after the AI step.
- Amount: regex for currency patterns (`€`, `$`, `Total:`, `Betrag:`, etc.), picks the largest match.
- Date: regex for common formats (DD.MM.YYYY, YYYY-MM-DD, DD/MM/YYYY, month names).
- Type: keyword detection — "invoice", "Rechnung", "payment due" → EXPENSE; "credit", "refund" → INCOME.
- Name/counterparty: first prominent text line or text near "From:", "Von:", company patterns.

### 5. Pipeline Orchestrator — `src/lib/model/transactions/services/extraction/invoiceExtractor.ts`
- Creates initial `ExtractionContext` from file buffer + metadata.
- Runs steps in sequence: textExtractor → aiStructurer → heuristicParser.
- Each step wrapped in try/catch — failure of one step does not abort the pipeline.
- Returns final `ExtractionResult`.

### 6. Extract API Route — `src/app/api/transactions/extract/route.ts`
- `POST` handler, accepts `multipart/form-data` with a `file` field.
- Validates file type (image/*, application/pdf) and size (max 10MB).
- Generates `tempFileId`, saves file via `saveTempFile()`.
- Cleans up expired temp files (>24h) opportunistically.
- Runs `invoiceExtractor` pipeline.
- Returns `{ tempFileId, fileName, extraction: ExtractionResult }`.

### 7. Upload Button Component — `src/app/(internal)/transactions/components/InvoiceUploadButton.tsx`
- Client component with a hidden `<input type="file" accept="image/*,application/pdf" capture="environment">`.
- Button with `variant="outline"` and `ScanLine` icon from Lucide.
- On file select: shows loading toast, POSTs to `/api/transactions/extract`.
- On success: builds URL search params from extraction result, calls `router.push(/transactions/new?...)`.
- On error: shows error toast.

## Modified Files

### 8. `src/lib/util/fileStorage.ts`
Add temp file utilities:
- `TEMP_DIR` constant: `data/temp`
- `saveTempFile(tempFileId, fileName, buffer, mimeType)` — saves file + `metadata.json` to `data/temp/{tempFileId}/`
- `readTempFile(tempFileId)` — returns `{ buffer, metadata: { originalName, mimeType, size, createdAt } }`
- `moveTempToAttachment(tempFileId, transactionId, attachmentId)` — moves file to permanent location, deletes temp dir, returns new path
- `cleanupExpiredTempFiles(maxAgeMs)` — scans `data/temp/`, removes directories older than threshold

### 9. `src/lib/components/common/data/table/DataTable.tsx`
Add optional `additionalActions?: React.ReactNode` prop to `DataTableProps`.
Render it next to the Create button in the existing `<div className="flex flex-row ml-auto items-center">` area.

### 10. `src/app/(internal)/transactions/components/TransactionsList.tsx`
- Import and render `InvoiceUploadButton` via `additionalActions` prop on `DataTable`.
- Only show if `canCreateTransaction` and `!hideFilters`.

### 11. `src/app/(internal)/transactions/components/NewTransaction.tsx`
Expand `prefillFromFilters` to read additional search params:
- `name`, `amount`, `type`, `valueDate`, `description`, `counterpartyName`, `tempFileId`, `tempFileName`

### 12. `src/app/(internal)/transactions/components/TransactionForm.tsx`
- Expand `PrefillFromFilters` interface with: `name?`, `amount?`, `type?`, `valueDate?`, `description?`, `counterpartyName?`, `tempFileId?`, `tempFileName?`.
- Wire new prefill values to initial field values (amount → AmountField, type → SelectFormField, etc.).
- `counterpartyName`: case-insensitive lookup against available counterparties to auto-select `counterpartyId`.
- When `tempFileId` is present, show an info bar/badge: "Invoice attached: {fileName}" with a `Paperclip` icon.
- Pass `tempFileId` through to the submit handler (add as hidden field in form values).

### 13. `src/lib/model/transactions/schemas.ts`
Add to `CreateTransactionSchema`:
```typescript
tempFileId: z.string().optional(),
tempFileName: z.string().optional(),
```

### 14. `src/lib/model/transactions/mutations/createTransaction.ts`
After transaction creation, add:
- If `tempFileId` is present in input:
  - Read temp file via `readTempFile(tempFileId)`
  - Create `Attachment` DB record (name, size, type, path="", transactionId)
  - Move file via `moveTempToAttachment()` → get final path
  - Update Attachment record with final path
- Strip `tempFileId`/`tempFileName` from `transactionData` before Prisma create (so Prisma doesn't reject unknown fields).

## New Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `pdf-parse` | Extract text from PDFs | ~50KB |
| `tesseract.js` | OCR for images | ~1MB (+ ~15MB language data on first run) |
| `@huggingface/transformers` | Local NER model | ~5MB (+ ~200-800MB model on first run) |

## Temp File Lifecycle

```
data/temp/{tempFileId}/
  ├── metadata.json    # { originalName, mimeType, size, createdAt }
  └── {originalName}   # the actual file

→ On transaction create: moved to data/transactions/{txnId}/attachments/{attachId}/{fileName}
→ On abandonment: cleaned up when next extract request runs (files >24h old)
```

## Implementation Order

1. `fileStorage.ts` — temp file utilities (foundation)
2. `extraction/types.ts` — pipeline interfaces
3. `extraction/steps/heuristicParser.ts` — regex fallback (no deps, testable)
4. `extraction/steps/textExtractor.ts` — pdf-parse + tesseract.js
5. `extraction/steps/aiStructurer.ts` — transformers.js NER
6. `extraction/invoiceExtractor.ts` — pipeline orchestrator
7. `src/app/api/transactions/extract/route.ts` — API endpoint
8. `InvoiceUploadButton.tsx` — client component
9. `DataTable.tsx` — add `additionalActions` prop
10. `TransactionsList.tsx` — render upload button
11. `NewTransaction.tsx` — expand search param reading
12. `TransactionForm.tsx` — extended prefill + attachment indicator
13. `schemas.ts` — add tempFileId/tempFileName
14. `createTransaction.ts` — handle temp attachment on submit
15. Install npm dependencies

## Verification

1. **Unit test the heuristic parser** with sample invoice texts (various formats, currencies, date styles)
2. **Unit test the text extractor** with a sample PDF and image
3. **Integration test the full pipeline** with real invoice samples
4. **Manual E2E test:**
   - Upload a PDF invoice → verify fields pre-fill correctly → submit → verify attachment appears on transaction detail
   - Upload a photo of a receipt (from mobile camera) → same flow
   - Upload an image where OCR fails → verify graceful degradation (empty form + attached file + warning toast)
   - Abandon a form with temp file → verify cleanup after 24h
5. **Verify mobile**: test `capture="environment"` opens camera on mobile browser
