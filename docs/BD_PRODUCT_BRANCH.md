# Bangladesh Product Branch (`product/bangladesh`)

This branch is a **separate product line** for the Bangladesh student market. It is intentionally isolated from the global StudyBuddy/Jaquizy deployment on Railway.

## Branch policy

| Branch | Purpose | Hosting |
|---|---|---|
| `master` | Stable global release | Railway (production) |
| `feature/simplified-architecture` | Global product development | Railway (linked) |
| `product/bangladesh` | Bangladesh market product (QuizBD) | **Separate platform** (Render/Fly/etc.) |
| `feature/offline-mode-v1` | Desktop offline experiment | Not tied to BD launch |

### Rules

1. **Do not merge `product/bangladesh` into `master` or `feature/simplified-architecture`** unless you deliberately unify products later.
2. **Do not point Railway at this branch.** Keep `railway.json` on global branches only.
3. **Cherry-pick shared fixes** (auth bugs, practice scoring, upload parsing) from `feature/simplified-architecture` into `product/bangladesh` as needed.
4. **Rebase or merge from `feature/simplified-architecture` periodically** only for engine-level fixes you want in both products — never the reverse.

## Product identity

- Working name: **QuizBD**
- Market config: `config/markets/bangladesh.json`
- Activate with env: `PRODUCT_MARKET=bangladesh`

## Deployment (separate hosting)

Use a new project on Render, Fly.io, or similar — not the existing Railway service.

1. Create a new web service from branch `product/bangladesh`.
2. Set environment variables from `deploy/bangladesh.env.example`.
3. Use `render.yaml` in repo root for Render blueprint deploys.
4. Point a `.com.bd` or BD-focused domain at the new host.
5. Use a **separate Supabase project** (or dedicated schema) so BD user data stays isolated from global beta users.

## Launch backlog (P0)

- [ ] Wire image upload + Bangla OCR
- [ ] Bangla UI for upload → practice → results
- [ ] Enforce free tier limits server-side (5 uploads/month)
- [ ] BDT pricing page + manual bKash checkout flow
- [ ] SSC/HSC topic presets
- [ ] Weak-topic scorecard + retake missed questions

## Syncing engine fixes from global branch

```bash
# On product/bangladesh, cherry-pick a specific fix commit:
git fetch origin
git cherry-pick <commit-sha-from-feature/simplified-architecture>

# Or merge only engine updates (review diff carefully):
git merge origin/feature/simplified-architecture
```

After merging engine updates, re-verify BD-specific config (`PRODUCT_MARKET`, pricing, copy) was not overwritten.
