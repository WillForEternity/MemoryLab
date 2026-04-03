# Memory Lab

A psychology experiment testing how background noise affects memory recall.

## Overview

Memory Lab is an interactive web-based experiment that measures how different types of ambient sounds affect a participant's ability to remember words. Users watch sequences of words flash on screen while various background noises play, then recall as many words as they can remember.

## How It Works

1. **Tutorial**: Participants receive instructions explaining they will see words flash on screen and must remember them. They are reminded to turn up their volume.

2. **Test Phase**: 10 test rounds, each consisting of:
   - A sequence of 10 words displayed one at a time (1.5 seconds each)
   - Background audio playing during the word display (varies by test)
   - A recall phase where participants type the words they remember

3. **Noise Types**:
   - Silence (control)
   - White noise
   - Cafe ambience
   - Nature sounds
   - Background music

4. **Results Dashboard**: After completing all tests, participants can view:
   - Summary statistics (total participants, average accuracy, average response time)
   - Pie chart showing response time by noise type
   - Bar chart showing words remembered by noise category
   - Individual participant breakdowns

## Data Storage

Test results are stored in the browser's localStorage, allowing data to persist across sessions and accumulate results from multiple participants on the same device.

## Setup

```bash
pnpm install
pnpm dev
```

## Vercel Environment Variables
For admin login/admin dashboard to work in production, configure:
`ADMIN_CREDENTIALS` (format: `email1:password1,email2:password2,...`)
`ADMIN_SESSION_SECRET` (optional; used to sign admin session cookies)

