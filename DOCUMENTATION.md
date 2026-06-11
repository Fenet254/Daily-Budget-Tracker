# Daily Income & Expense Budget Monitoring System — Full Documentation

> **Status:** Complete draft (docs + code comments)
> 
> **Last updated:** 2026-05-07

---

## 1) Overview
The **Daily Income & Expense Budget Monitoring System** is a **MERN** application for tracking personal finances:

- Manual transaction entry (income/expense)
- Budget planning by **category** and **period**
- Budget monitoring (spent, remaining, % usage)
- Automated transaction capture from **SMS** (Telebirr/CBE Birr-style messages) via regex parsing
- Analytics and reports for selected date ranges

### Tech Stack
- **Frontend:** React.js
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (Bearer token)
- **SMS Parsing:** Regex-based parser (`backend/utils/smsParser.js`)

---

## 2) System Architecture

### Backend flow (high-level)
1. Client authenticates via `/api/auth/login` and receives a JWT
2. Client sends requests with header: `Authorization: Bearer <token>`
3. Backend uses `protect` middleware to attach `req.user`
4. Transaction creation/update/delete updates budget usage rules
5. Budget and reports endpoints compute analytics using `Transactions` and `Budgets`

### Frontend flow
- **AuthContext** manages token + current user
- Pages are protected through `ProtectedRoute` in `frontend/src/App.js`
- Components:
  - `Transactions.js` — manual transaction CRUD + filters
  - `Budgets.js` — budget CRUD + reset + charts
  - `Reports.js` — KPIs + charts (summary + recent/trend data)
  - `SMSImport.js` — SMS preview + submit import

---

## 3) Data Model

### 3.1 Users (`backend/models/User.js`)
Core fields:
- `name` (string)
- `email` (string, unique, lowercase)
- `password` (hashed with bcryptjs)
- Profile fields: phone, bio, profilePhoto, address, dateOfBirth
- Preferences:
  - `preferences.theme` (`light|dark|system`)
  - `preferences.currency` (default `ETB`)
  - `preferences.notifications.*`
  - `preferences.language`
- Other profile fields included in schema (social links, emergencyContact, moneyPersonality, financialStats, lifestylePreferences, moneyStory)

Authentication methods:
- Password hashing in `pre('save')`
- `matchPassword(enteredPassword)` using bcrypt compare

### 3.2 Transactions (`backend/models/Transaction.js`)
Fields:
- `user` (ObjectId → User)
- `type` (`income|expense`)
- `amount` (number, required)
- `category` (string, required)
- `description` (string, optional)
- `date` (Date, default now)
- `source` (`manual|telebirr|cbe|sms`)
- `sender` (string, optional)

Indexes:
- `{ user: 1, date: -1 }`
- `{ user: 1, category: 1 }`
- `{ user: 1, type: 1 }`

### 3.3 Budgets (`backend/models/Budget.js`)
Fields:
- `user` (ObjectId → User)
- `category` (string)
- `amount` (number, required)
- `spent` (number, default 0)
- `period` (`daily|weekly|monthly`, default monthly)
- `startDate` (Date, default now)
- `endDate` (Date, optional)
- `color` (string, default `#3B82F6`)
- `note` (string, default '')
- `lastResetDate` (Date, optional)
- `isActive` (boolean, default true)

Indexes:
- `{ user: 1, category: 1 }`
- `{ user: 1, isActive: 1 }`

### 3.4 Categories (`backend/models/Category.js`)
Fields:
- `name` (string)
- `type` (`income|expense`)
- `user` (optional ObjectId)
- `isDefault` (boolean)

> Note: the **frontend currently uses its own category lists** for selection; backend categories exist and are exposed via `/api/categories`.

---

## 4) Budget Accounting Rules (Spending, Updates, Reset)

### 4.1 Where `Budget.spent` is updated
There are two patterns in the codebase:

1. **Computed spent on GET `/api/budgets`**
   - The budgets route fetches budgets and then computes **spent** per budget by querying `Transactions` within the budget’s date window.
   - It also returns `percentage` capped to 100.

2. **Incremental spent update on Transaction mutations**
   - `POST /api/transactions`:
     - If `type === 'expense'`, it finds matching budget(s) and increments `budget.spent += amount`.
   - `PUT /api/transactions/:id`:
     - For expense→expense updates, it adjusts budgets by the **difference**.
   - `DELETE /api/transactions/:id`:
     - For expense deletes, it decrements `budget.spent`.

Because the budgets endpoint recomputes totals anyway, the incremental updates act as a fast path and/or keep persisted `spent` consistent.

### 4.2 Reset behavior
Endpoint:
- `PUT /api/budgets/:id/reset`

Behavior in code:
- Sets `budget.spent = 0`
- Sets `budget.lastResetDate = new Date()`

> If the schema supports `lastResetDate`, it will be stored. Budget viewing recomputes spent from transactions anyway, so “reset” mainly affects immediate UI if any client relies on persisted `spent`.

---

## 5) API Reference (REST)

### Authentication
All routes below that require auth must include:
- Header: `Authorization: Bearer <token>`

JWT token issuance:
- `POST /api/auth/register`
- `POST /api/auth/login`

#### `GET /api/auth/me`
Returns current user (password removed).

---

### 5.1 Auth endpoints

#### `POST /api/auth/register`
**Body**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123"
}
```
**Success response**
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "name": "Alice", "email": "alice@example.com" }
}
```

#### `POST /api/auth/login`
**Body**
```json
{ "email": "alice@example.com", "password": "secret123" }
```

#### `PUT /api/auth/profile`
Updates profile fields present in body.

#### `PUT /api/auth/password`
Body:
```json
{ "currentPassword": "...", "newPassword": "..." }
```

---

### 5.2 Transactions

#### `GET /api/transactions`
**Query params (optional):**
- `startDate` (ISO string)
- `endDate` (ISO string)
- `category` (string, case-insensitive regex)
- `limit` (number)

**Response:** array of `Transaction` documents

#### `POST /api/transactions`
**Body**
```json
{
  "type": "income|expense",
  "amount": 1200.5,
  "category": "Food",
  "description": "Lunch",
  "date": "2026-05-07T00:00:00.000Z",
  "source": "manual|telebirr|cbe|sms"
}
```
Validation:
- `type` must be `income` or `expense`
- `amount` must parse to a positive number
- `category` must be non-empty

Server behavior:
- Saves transaction
- If `expense`, attempts to update matching budgets by category and monthly date window.

#### `PUT /api/transactions/:id`
Updates transaction fields.
Server behavior:
- If both original and updated are `expense`, adjusts budgets by amount difference and/or category change.

#### `DELETE /api/transactions/:id`
Deletes the transaction.
Server behavior:
- If deleted transaction is `expense`, decrements `Budget.spent` for matching category.

---

### 5.3 Budgets

#### `GET /api/budgets`
Returns budgets for the user including computed:
- `spent` (computed from transactions)
- `percentage` = `spent/amount * 100` capped at 100

#### `POST /api/budgets`
**Body**
```json
{
  "category": "Food",
  "amount": 5000,
  "period": "monthly",
  "startDate": "2026-05-01T00:00:00.000Z",
  "endDate": "2026-05-31T00:00:00.000Z",
  "color": "#3B82F6",
  "note": "May plan"
}
```

#### `PUT /api/budgets/:id`
Updates category/amount/period/color/note (depending on provided body).

#### `DELETE /api/budgets/:id`
Deletes budget.

#### `PUT /api/budgets/:id/reset`
Resets persisted `spent` to zero and updates `lastResetDate`.

---

### 5.4 Reports

#### `GET /api/reports/summary`
Supports either:
- `period` query (`daily|weekly|monthly`) OR
- custom `startDate` and `endDate`

Response includes:
- `totalIncome`, `totalExpense`, `balance`
- `categoryBreakdown` = per category `{ income, expense }`
- `topCategories` (top 5 by expense)
- `budgetStatus` = per active budget `{ category, budgeted, spent, remaining, percentage, color }`
- `trends` = array of `{ date, amount }` (daily aggregation)

#### `GET /api/reports/transactions`
Query params:
- `type` (income/expense)
- `category`
- `period` (`daily|weekly|monthly`)

Returns up to 100 transactions.

---

### 5.5 SMS Import

#### `POST /api/sms/import`
**Auth required**

**Body**
```json
{ "smsText": "You have received 500 ETB from Abebe." }
```

Server behavior:
1. Parses SMS with `parseSMS(smsText)`
2. Creates a new `Transaction` with `date: new Date()`
3. If parsed `type === 'expense'`, attempts to update a matching budget using startDate/endDate window

> Note: budget matching for SMS import may differ from the budget update logic in `/api/transactions`.

---

## 6) SMS Parsing (Telebirr / CBE Birr) — Current Behavior

Implementation: `backend/utils/smsParser.js`

### Output Contract
The parser returns either an error-like object or a structured transaction:

```js
{
  type: 'income' | 'expense',
  amount: number,
  category: string,
  description: string,
  source: 'telebirr' | 'cbe' | 'sms',
  sender: string,
  confidence: number, // 0..1
  detectedKeywords: string[]
}
```

### Telebirr Example
SMS:
> “You have received 500 ETB from Abebe.”

Regex pattern extracts:
- amount = `500`
- sender = `Abebe`
- type = `income`
- category = `Transfer`
- source = `telebirr`

### CBE Birr Example (credit/debit)
Parser supports patterns containing:
- `credit` / `credited` (income)
- `debit` / `debited` / `payment` (expense)

### Fallback amount extraction
If amount is not extracted by spec regex, the parser uses fallback amount regex patterns that look for ETB/Birr numeric amounts.

### Known gaps
- `smsParser.js` contains an area labeled as “existing keyword logic … unchanged for brevity” / incomplete logic in the current file.
- Documentation should reflect **real behavior** (current patterns) rather than intended full Telebirr/CBE coverage.

---

## 7) End-to-End Workflow

1. **User logs in**
   - `POST /api/auth/login` → store token in localStorage
2. **Add transaction manually**
   - `POST /api/transactions`
3. **Budget usage updates**
   - Transactions endpoint attempts to update budgets.spent on expense
   - Budgets endpoint also computes spent from transactions
4. **Dashboard / Reports**
   - Reports endpoint aggregates totals + charts data
5. **Import from SMS**
   - `POST /api/sms/import` with raw SMS text
   - Backend parses → saves transaction → attempts budget update (expense only)

---

## 8) Environment & Setup

### Environment Variables (Backend)
Used in code:
- `MONGO_URI` (optional; defaults to `mongodb://127.0.0.1:27017/daily-budget-tracker`)
- `JWT_SECRET` (optional; defaults to `secret`)
- `PORT` (optional; defaults to `5001`)

Frontend:
- `REACT_APP_API_URL` (optional; defaults to `http://localhost:5001/api`)

### Running Backend
From `/backend`:
- `npm install`
- `npm start` (or `node server.js` depending on package scripts)

### Running Frontend
From `/frontend`:
- `npm install`
- `npm start`

---

## 9) Testing Checklist (Manual / Postman)

### Auth
- Register new user
- Login and call `GET /api/auth/me`

### Transactions
- Create expense transaction and verify:
  - `/api/transactions` returns it
  - `/api/budgets` shows increased spent
- Update an expense transaction amount/category and verify budget spent adjustments
- Delete an expense transaction and verify budget spent decreases

### Budgets
- Create budget
- Fetch budgets and confirm computed spent/percentage
- Reset budget and ensure response updates `spent` and `lastResetDate`

### SMS Import
- Import Telebirr income SMS
- Import CBE debit expense SMS
- Confirm created transaction source/type/category and confirm budget update behavior

---

## 10) Known Limitations
- Category taxonomy: frontend category lists may not fully align with backend `categories` collection.
- SMS parser logic is regex-driven and may not parse all SMS formats.
- SMS budget matching logic may differ from manual transaction budget matching.
- “Budget reset” resets persisted spent, but budgets view recomputes spent from transactions.

---

## 11) Appendix: Endpoint Summary Table

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create user and return JWT |
| POST | `/api/auth/login` | No | Login and return JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| PUT | `/api/auth/profile` | Yes | Update profile |
| PUT | `/api/auth/password` | Yes | Change password |
| GET | `/api/transactions` | Yes | List transactions (filters supported) |
| POST | `/api/transactions` | Yes | Create transaction (updates budgets) |
| PUT | `/api/transactions/:id` | Yes | Update transaction (adjust budgets) |
| DELETE | `/api/transactions/:id` | Yes | Delete transaction (adjust budgets) |
| GET | `/api/budgets` | Yes | List budgets with computed spent |
| POST | `/api/budgets` | Yes | Create budget |
| PUT | `/api/budgets/:id` | Yes | Update budget |
| DELETE | `/api/budgets/:id` | Yes | Delete budget |
| PUT | `/api/budgets/:id/reset` | Yes | Reset budget spent |
| GET | `/api/reports/summary` | Yes | Summary KPIs + charts data |
| GET | `/api/reports/transactions` | Yes | Recent transactions report |
| POST | `/api/sms/import` | Yes | Parse SMS and import transaction |
| (likely) | `/api/categories` | Yes | Category CRUD (exists in codebase) |

