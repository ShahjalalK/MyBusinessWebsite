# TrackFlowPro Follow-up Threading Fix

## Files to replace

Replace these files in your project:

```text
app/api/trackflow/[...action]/route.ts
app/admin/dashboard/types.ts
```

## What changed

- Follow-up emails now include email-threading headers:
  - `In-Reply-To`
  - `References`
  - `X-TFP-Thread-Root`
- Follow-up subject is normalized as `Re: original subject` without double `Re: Re:`.
- Follow-up send records extra thread metadata in Firestore:
  - `customMessageId`
  - `inReplyTo`
  - `references`
  - `threadRootMessageId`
  - `lastFollowupCustomMessageId`
  - `lastFollowupInReplyTo`
  - `lastFollowupReferences`
- Initial email behavior is unchanged.
- Signature/footer behavior is unchanged.

## Test checklist

1. Run:

```bash
npm run build
npm run dev
```

2. Send an initial test email to your own address.
3. Open it once so it becomes eligible.
4. Make the lead due for F-1 and run follow-up.
5. In Gmail, the follow-up should appear in the same conversation/thread as the initial email.
6. Firestore `sent_messages` should contain the follow-up with `inReplyTo` and `references` populated.

## Note

Email clients ultimately decide threading behavior. Gmail usually threads reliably when `Subject`, `In-Reply-To`, and `References` are present.
