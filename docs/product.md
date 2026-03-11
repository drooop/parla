# Product Definition

## Goal

Provide Chinese-speaking learners with a fully local, zero-cost English speaking practice tool. Core value: practice anytime, no embarrassment, with correction feedback.

## Target Users

- Native Chinese speakers
- Want to improve spoken English but lack practice opportunities
- Value privacy — unwilling to upload voice data to the cloud

## Core Interaction Flow

1. User holds the record button or spacebar and speaks in English
2. On release, speech is transcribed and displayed in the chat
3. AI replies naturally in English while pointing out grammar/vocabulary errors
4. AI reply is played back as audio

## Practice Modes

### Free Talk
- No fixed topic — talk about anything
- AI acts as a friendly English coach
- Corrections appended after each reply

### Scenarios
- **Coffee Shop**: AI plays a barista, user orders a drink
- **Job Interview**: AI plays an interviewer, simulates a tech interview
- **Hotel Check-in**: AI plays a front desk clerk, simulates check-in

Scenario is selected when creating a new conversation and locked after creation.

## Pronunciation Feedback

Confidence-based approach:
- faster-whisper outputs word-level probability
- Words below 0.6 are flagged as "possibly unclear pronunciation"
- No phoneme-level analysis (too complex for current scope)

## LLM Reply Format

```
[Natural conversational reply, 2-3 sentences]

---
**Correction:** [error] → [corrected] (explanation)
```

If the user's English is correct, the correction section shows "No corrections needed. Great job!"

## Conversation Management

- Browse conversation history via sidebar
- Auto-generated title (LLM) after first message, user can edit manually
- Delete conversations
- PostgreSQL storage + localStorage cache dual-layer architecture
- Automatic fallback to local-only mode when database is unavailable
