# 📋 Plan: Smart Canteen Pre-Order & Queue Management System

## 1. Requirement Analysis & Features Checklist

### 👥 User Roles & Access Control (RBAC)
- [ ] **1. Customer / Student / Employee**:
  - Account creation & authentication (JWT/Session).
  - Browse menu filtered by category, price, availability, preparation time, and popularity.
  - Interactive cart: quantity selection, item custom preparation instructions, scheduled pickup slot selection.
  - Order submission with **duplicate submission prevention** (Idempotency Token).
  - Unique **Digital Token** generation (e.g., `C-023`) and QR Code.
  - Real-time order status tracking across 20-step lifecycle.
  - Cancellation before kitchen preparation begins.
  - Order history & 1-click re-ordering.
- [ ] **2. Canteen / Kitchen Staff**:
  - Live Kitchen Queue view with real-time token sequence and preparation countdowns.
  - Order management: Accept, Reject, Start Preparation, Mark Ready, Confirm Collection, Mark Delayed, Mark Not Collected.
  - View special preparation instructions per order item.
  - Real-time stock / item availability toggle (Available, Limited, Sold Out, Temporarily Unavailable).
  - Token verification via QR Scanner / Token Search to prevent duplicate collection.
  - Report order problems / delays.
- [ ] **3. Canteen Manager**:
  - Full Menu Management: CRUD items, prices, preparation time estimates, stock quantities.
  - Pickup Slot & Capacity Limits setup: Max orders per 15-minute slot (e.g. 20 orders/slot), max items per customer.
  - Real-time queue monitor & bottleneck alerts.
  - Operational & Sales Analytics Dashboard: Daily revenue, popular items, peak ordering hours, cancellation rate, average EPT.
- [ ] **4. System Administrator**:
  - User management & role assignment.
  - Category management & system audit activity logs.

---

### 🔄 20-Step Order Status Lifecycle
Primary Path:
1. `Placed` -> 2. `Accepted` -> 3. `Preparing` -> 4. `Ready` -> 5. `Collected` -> 6. `Completed`
Extended Statuses:
- `Cancelled` (Customer cancelled prior to preparation)
- `Rejected` (Staff rejected due to stock/capacity)
- `Delayed` (Auto-flagged or manual when preparation exceeds EPT)
- `Not Collected` (Uncollected past pickup time window)

Complete 20-Step Execution Flow:
1. Customer opens menu
2. System filters currently available items
3. Customer selects food items
4. Items added to cart
5. Customer selects quantities
6. Customer adds special instructions
7. Customer selects valid pickup slot
8. System calculates total amount & verifies slot capacity
9. Customer confirms order
10. System creates order record securely with idempotency check
11. Unique digital token & QR code generated
12. Canteen staff receives incoming order notification
13. Staff accepts order (Status: Accepted)
14. Kitchen begins preparation (Status: Preparing)
15. Customer views live order tracking & estimated ready time
16. Kitchen marks order as Ready (Status: Ready)
17. Customer receives instant ready notification
18. Customer presents QR / Digital Token at counter
19. Staff scans/verifies token & confirms collection (Status: Collected)
20. Order finalized & logs updated (Status: Completed)

---

### 🧠 Smart Queue & Dynamic EPT Algorithm
- **Dynamic EPT Factors**:
  - Base preparation time per item type ($\sum \text{Item Base Time} \times \text{Qty}$).
  - Active kitchen workload coefficient (number of orders currently in `Preparing` state).
  - Multi-item preparation overlap discount factor.
- **Smart Queue Priority Ranking Score ($P$)**:
  $$P = w_1 \cdot T_{\text{wait}} + w_2 \cdot T_{\text{pickup\_urgency}} + w_3 \cdot \text{DelayFlag} - w_4 \cdot T_{\text{prep\_duration}}$$
  - Auto-prioritizes orders nearing pickup time, delayed orders, and quick orders while respecting arrival order.

---

### 🛑 Stock Limits & Capacity Safeguards
- Real-time stock decrement upon order placement.
- Automatic status transition to `Sold Out` when quantity reaches 0.
- Slot Capacity Enforcement: Max $N$ orders per 15-min window; auto-rejects/disables full slots.
- Duplicate Submission Guard: Client-generated UUID `idempotency_key` headers prevent double charging/ordering on retry.
- Single Collection Enforcement: Database transaction locking prevents double-claiming a token.

---

### 🗄️ Database Model & System Architecture (Section 8 PDF Compliance)

#### Exact Specification Database Schemas:

1. **Menu Item Data (`menu_items`)**:
   - `item_id`: Primary Key
   - `item_name`: String
   - `category`: String
   - `price`: Numeric / Float
   - `available_quantity`: Integer
   - `preparation_time`: Integer (in minutes)
   - `status`: Enum / String (`Available`, `Limited`, `Sold Out`, `Temporarily Unavailable`)
   - `image`: String (URL)

2. **Order Data (`orders`)**:
   - `order_id`: Primary Key
   - `customer_id`: Foreign Key -> `users.user_id`
   - `token_number`: String (e.g. `C-023`)
   - `total_amount`: Numeric / Float
   - `order_time`: Timestamp / Datetime
   - `pickup_time`: Timestamp / Datetime
   - `estimated_ready_time`: Timestamp / Datetime
   - `order_status`: Enum / String (`Placed`, `Accepted`, `Preparing`, `Ready`, `Collected`, `Completed`, `Cancelled`, `Rejected`, `Delayed`, `Not Collected`)
   - `payment_status`: Enum / String (`Paid`, `Pending`, `Refunded`)
   - `idempotency_key`: String (Unique constraint to prevent duplicate placement)

3. **Order Item Data (`order_items`)**:
   - `order_item_id`: Primary Key
   - `order_id`: Foreign Key -> `orders.order_id`
   - `item_id`: Foreign Key -> `menu_items.item_id`
   - `quantity`: Integer
   - `price`: Numeric / Float (Price snapshot at order time)
   - `special_instruction`: String (Optional custom instructions)

4. **User Data (`users`)**:
   - `user_id`: Primary Key
   - `name`: String
   - `email`: String (Unique)
   - `role`: Enum / String (`Customer`, `Kitchen Staff`, `Canteen Manager`, `Admin`)
   - `account_status`: Enum / String (`Active`, `Suspended`)
   - `password_hash`: String

5. **Pickup Slots & Capacity (`pickup_slots`)**:
   - `slot_id`: Primary Key
   - `slot_time`: Timestamp / Datetime (15-min intervals)
   - `max_orders`: Integer (e.g. 20)
   - `current_orders`: Integer
   - `status`: Enum / String (`Available`, `Full`)

#### Recommended System Architecture Pipeline:
```
Customer Web / Mobile App
          │
          ▼
    Backend API
          │
          ▼
 Order & Queue Manager ◄───► Menu / Availability Manager
          │
          ▼
 Database (PostgreSQL / SQLite + MCP Integration)
          │
          ▼
Kitchen / Canteen Dashboard
```

---

## 2. Technical Stack & System Architecture

- **Frontend**: Vite + React, Vanilla CSS / Tailwind CSS with glassmorphism design system, dark/light theme, responsive layout, dynamic animations.
- **Backend**: Node.js, Express, TypeScript, SQLite (`better-sqlite3`) / PostgreSQL (`pg` with MCP integration), WebSockets / SSE for live queue updates.
- **Testing**: Vitest for automated unit and integration testing.

---

## 3. Test-Driven Shielding Strategy

Before building feature code, automated test suites will cover:
1. `tests/queue-priority.test.ts`: Priority scoring, pickup slot sorting, quick-item elevation, delay handling.
2. `tests/slot-capacity.test.ts`: Max orders per 15-min slot limit enforcement and concurrency guards.
3. `tests/duplicate-prevention.test.ts`: Idempotency keys, double submission blocking, single collection verification.
4. `tests/ept-calculator.test.ts`: Dynamic preparation time calculation under varying kitchen workloads.

---

## 4. Parallel Implementation Plan & Subagent Execution

### Subagent 1: Database & MCP Integration (`share` workspace mode)
- Create schema migrations (`src/db/schema.sql` or `src/db/schema.ts`) implementing the exact 4 entities (`menu_items`, `orders`, `order_items`, `users`) plus `pickup_slots` and `staff_activity_logs`.
- Seed menu items (Burgers, Pizzas, Drinks, Combos, Desserts) with high-res food images.
- Connect schema with Postgres/SQLite MCP server.

### Subagent 2: Backend Core Logic & APIs (`share` workspace mode)
- File paths:
  - `src/server/index.ts`: Server initialization & WebSocket broadcast.
  - `src/server/services/ept.service.ts`: Dynamic EPT calculation engine.
  - `src/server/services/queue.service.ts`: Live digital queue priority algorithm.
  - `src/server/controllers/order.controller.ts`: Idempotent order placement, status transitions (20-step lifecycle).
  - `src/server/controllers/menu.controller.ts`: Stock decrement & auto-sold-out triggers.
  - `src/server/controllers/token.controller.ts`: QR code generation & single-collection token verifier.
  - `src/server/controllers/analytics.controller.ts`: Manager metrics and AI predictive insights.

### Subagent 3: Frontend Interfaces & Design System (`share` workspace mode)
- File paths:
  - `src/client/App.tsx`: Main app routing with role switcher (Customer, Kitchen Staff, Canteen Manager, Admin).
  - `src/client/components/CustomerView.tsx`: Menu filtering, category pill bars, search, cart modal, preparation notes, pickup slot picker.
  - `src/client/components/OrderTracker.tsx`: Live 20-step status pipeline, token display with QR code, delay indicators, countdown timer.
  - `src/client/components/KitchenQueueBoard.tsx`: Live kitchen dashboard, order cards prioritized by urgency/EPT, status progression buttons (`Accept` -> `Prepare` -> `Ready`).
  - `src/client/components/TokenScannerModal.tsx`: Counter collection scanner/verifier with duplicate claim block.
  - `src/client/components/ManagerDashboard.tsx`: Real-time analytics charts, stock limits, slot capacity management, AI delay/demand forecasts.

---

## 5. Verification & Quality Assurance Pipeline

1. **Automated Unit & Integration Tests**: Run `npm test` to verify zero failures across queue priority, slot limits, idempotency, and DB integrity.
2. **Browser Subagent E2E Validation**:
   - Customer places pre-order with scheduled slot.
   - Kitchen receives order, accepts, and updates status to preparing.
   - EPT recalculates dynamically.
   - Kitchen marks order ready.
   - Counter verifies token and collects order.
   - Manager checks updated sales analytics & slot usage.

---

✅ Plan updated and ready for execution.
