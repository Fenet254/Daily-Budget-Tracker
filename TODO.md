# Daily Budget Tracker - Full Implementation TODO

## Approved Plan Status: ✅ Confirmed by user

**Backend Enhancements (Priority 1)**
- [x] 1.1 Update Transaction model: Add sender/sourceName, indexes
- [x] 1.2 Update Budget model: Add lastResetDate, active flag  
- [x] 1.3 Enhance smsParser.js: Add spec SMS examples (Telebirr/CBE), better regex
- [x] 1.4 Enhance reports routes: Daily/weekly/monthly summaries, trends
- [x] 1.5 Add /api/categories route (CRUD)
- [x] 1.6 Improve error handling/logging across routes (standardized)

**Frontend Enhancements (Priority 2)**
- [x] 2.1 Implement/enhance SMSImport component: Preview parsed data, submit
- [ ] 2.2 Reports: Add CSV/PDF export (jsPDF), date filters
- [ ] 2.3 Budgets: Visual progress, auto-reset logic
- [ ] 2.4 Dashboard: Metrics cards, budget alerts, charts
- [ ] 2.5 Settings: Currency toggle, SMS alerts
- [ ] 2.6 Add global validation/toasts, error boundaries

**Integration & Polish (Priority 3)**
- [ ] 3.1 Seed default categories via backend script
- [ ] 3.2 Full end-to-end testing (SMS → Transaction → Budget update → Reports)
- [ ] 3.3 Responsive design fixes, dark mode
- [ ] 3.4 Install missing deps, update package.json

**Testing & Deploy (Priority 4)**
- [ ] 4.1 Backend: Test all endpoints (Postman/manual)
- [ ] 4.2 Frontend: Test all flows (manual/e2e)
- [ ] 4.3 Production config (.env validation)

**Current Progress:** Ready to start with Backend models → Step 1.1

**Next Action:** Update models, then test.
