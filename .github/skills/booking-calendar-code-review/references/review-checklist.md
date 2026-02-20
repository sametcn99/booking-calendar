# Review Checklist

- Are there correctness bugs or runtime failure paths?
- Are controller/service/repository boundaries preserved?
- Is API response shape still `{ success, data?, error? }`?
- Are user-facing backend messages i18n-key based via `t("...")`?
- Could route order cause dynamic path shadowing in `src/server/index.ts`?
- Do race-sensitive write flows use transactions?
- Are client build-time `VITE_*` assumptions still valid?
- Are translation keys and schemas still valid when copy changed?
- Is validation/testing coverage sufficient for touched paths?
