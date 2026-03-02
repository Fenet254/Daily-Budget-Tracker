# Dashboard Modification Plan

## Task Summary
- Remove Smart Insights from dashboard
- Remove the container holding Quick Actions and Smart Insights
- Style Quick Action buttons as individual standalone buttons

## Changes to Dashboard.js

### 1. Remove insights-related code:
- [ ] Remove `insights` state variable
- [ ] Remove `generateInsights` function
- [ ] Remove call to `generateInsights` in `fetchSummary`
- [ ] Remove FiInfo import (if not used elsewhere)

### 2. Modify Quick Actions section:
- [ ] Remove `actions-insights-section` wrapper div
- [ ] Keep `actions-card` as standalone section
- [ ] Make each action button individually prominent

## Changes to Dashboard.css

### 1. Remove styles:
- [ ] Remove `.insights-card` styles
- [ ] Remove `.insight-item` styles
- [ ] Remove `.actions-insights-section` styles

### 2. Update Quick Action button styles:
- [ ] Change `.action-btn` from dashed border to solid styled button
- [ ] Add proper button shadows, colors, and hover effects
- [ ] Make buttons stand out individually

## Implementation Steps:
1. Edit Dashboard.js - Remove Smart Insights code and modify structure
2. Edit Dashboard.css - Remove insights styles and update action button styles
