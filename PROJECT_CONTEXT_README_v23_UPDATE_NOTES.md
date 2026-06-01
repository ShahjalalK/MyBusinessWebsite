# PROJECT_CONTEXT_README v23 Update Notes

Updated the master handoff README to reflect the current TrackFlow Pro architecture as of 2026-06-01.

Key additions:
- Localhost vs Vercel project split
- Do not mix localhost b2.ts and Vercel b2.ts
- Token-first same-domain report update/re-upload model
- Hybrid storage: B2 PDF, Vercel Blob OG image, Firestore metadata, Supabase chat
- Fresh single reviewed PDF fetch for Create Secure Page
- B2 previous-version purge guidance and debug logs
- Cleanup behavior: best-effort, token-first, Sheet row delete by token
- cleanup_jobs disabled by default to protect Firebase limits
- Google Sheet explicit source columns and routing rules
- Sheet Primary / Sheet Additional / Manual + Report relationship model
- Python/Gemini polished email as source-of-truth
- lowerSheetText route bug and required helper rule
- Updated file-request matrix for future assistants

Always upload PROJECT_CONTEXT_README_UPDATED_v23.md in new chats before asking for project fixes.
