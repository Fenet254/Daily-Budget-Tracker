# Daily-Budget-Tracker

A MERN stack app for tracking daily income, expenses, and budgets.

## What’s included
- Manual transaction entry (income/expense)
- Budgets by category with usage monitoring
- Reports and charts for daily/weekly/monthly summaries
- SMS import (Telebirr/CBE Birr-style regex parsing) to auto-create transactions

## Documentation
- Main full spec: [`DOCUMENTATION.md`](./DOCUMENTATION.md)
- System notes and implementation TODOs: [`TODO.md`](./TODO.md)

## Quick start (developer)
1. Start MongoDB (or set `MONGO_URI`)
2. Configure backend env vars (at minimum `JWT_SECRET` and `MONGO_URI` if needed)
3. Run backend and frontend as per the package scripts

