export const QUEUE_NAMES = {
  DOCUMENT_INTAKE: 'document-intake',
  DOCUMENT_OCR: 'document-ocr',
  DOCUMENT_CLASSIFICATION: 'document-classification',
  DOCUMENT_EXTRACTION: 'document-extraction',
  CANDIDATE_MATCHING: 'candidate-matching',
  CONVERSATION_INTAKE: 'conversation-intake',
  CONVERSATION_EXTRACTION: 'conversation-extraction',
  SPREADSHEET_INTAKE: 'spreadsheet-intake',
  SPREADSHEET_COMMIT: 'spreadsheet-commit',
} as const;

export const JOB_NAMES = {
  DOCUMENT_INTAKE_PROCESS: 'document-intake-process',
  DOCUMENT_OCR_PROCESS: 'document-ocr-process',
  DOCUMENT_CLASSIFICATION_PROCESS: 'document-classification-process',
  DOCUMENT_EXTRACTION_PROCESS: 'document-extraction-process',
  CANDIDATE_MATCHING_PROCESS: 'candidate-matching-process',
  CONVERSATION_INTAKE_PROCESS: 'conversation-intake-process',
  CONVERSATION_EXTRACTION_PROCESS: 'conversation-extraction-process',
  SPREADSHEET_INTAKE_PROCESS: 'spreadsheet-intake-process',
  SPREADSHEET_COMMIT_PROCESS: 'spreadsheet-commit-process',
} as const;
