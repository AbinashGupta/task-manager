# Task Manager Application - Complete Behavior Documentation

**Version**: Phase 1-3 Complete  
**Last Updated**: February 18, 2026  
**Status**: Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Backend Infrastructure](#phase-1-backend-infrastructure)
3. [Phase 2: Kanban Board UI](#phase-2-kanban-board-ui)
4. [Phase 3: Calendar, Reports, and Reminders](#phase-3-calendar-reports-and-reminders)
5. [Additional Enhancements](#additional-enhancements)
6. [Recurring Tasks - Complete Behavior](#recurring-tasks-complete-behavior)
7. [Task Status Management](#task-status-management)
8. [Data Storage](#data-storage)

---

## Overview

The Task Manager is a full-stack Next.js 14+ application built with TypeScript, Tailwind CSS, and CSV-based storage. It provides a Kanban board interface, calendar views, reports dashboard, and comprehensive task management with recurring task support.

### Key Technologies
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: CSV files (swappable via `IStorage` interface)
- **Date Handling**: date-fns
- **Charts**: Recharts
- **Validation**: Zod

---

## Phase 1: Backend Infrastructure

### Core Components

#### 1. Type System (`lib/types.ts`)

**Task Model**:
```typescript
interface Task {
  id: string;                    // UUID v4
  title: string;                 // Required, max 200 chars
  description: string;            // Optional, max 2000 chars
  note: string;                   // Quick note, max 100 chars
  status: TaskStatus;            // 'todo' | 'in-progress' | 'blocked' | 'done'
  priority: TaskPriority;        // 'low' | 'medium' | 'high'
  dueDate: string | null;        // ISO 8601 date string
  createdAt: string;             // ISO 8601, set on creation
  updatedAt: string;             // ISO 8601, updated on every edit
  recurringFrequency: RecurringFrequency; // 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  recurringEndDate: string | null; // ISO 8601 or null
  tags: string[];                // Array of strings
}
```

**Status Constants**:
- `TASK_STATUSES`: `['todo', 'in-progress', 'blocked', 'done']`
- `CARET_NAVIGABLE_STATUSES`: `['todo', 'in-progress', 'done']` (excludes 'blocked')
- `COLUMN_LABELS`: Human-readable labels for each status

#### 2. Storage Layer (`lib/storage/`)

**CSV Storage** (`csvStorage.ts`):
- File location: `data/tasks.csv` (or `CSV_PATH` env variable)
- Atomic writes using temporary files
- Automatic file/directory creation
- CSV sanitization to prevent injection attacks
- All CRUD operations implemented

**Storage Interface** (`interface.ts`):
- Abstract `IStorage` interface for future database migration
- Methods: `getAllTasks()`, `getTaskById()`, `createTask()`, `updateTask()`, `deleteTask()`, `getTasksByStatus()`, `getTasksByDateRange()`

#### 3. Business Logic (`lib/services/`)

**Task Service** (`taskService.ts`):
- `listTasks(filters?)`: List tasks with optional filtering
- `getTask(id)`: Get single task
- `createTask(data)`: Create new task with validation
- `updateTask(id, updates)`: Update task (triggers recurring task creation)
- `deleteTask(id)`: Delete task
- `getKanbanColumns()`: Get tasks grouped by status
- `moveTask(taskId, newStatus)`: Move task between statuses

**Reminder Service** (`reminderService.ts`):
- `getOverdueTasks()`: Tasks past due date (status !== 'done')
- `getDueTodayTasks()`: Tasks due today
- `getDueSoonTasks(hoursAhead?)`: Tasks due within specified hours

#### 4. Utilities (`lib/utils.ts`)

**Date Helpers**:
- `isOverdue(task)`: Check if task is past due date
- `isDueToday(task)`: Check if task is due today
- `isDueSoon(task, hoursAhead)`: Check if task is due soon
- `getNextRecurringDate(dueDate, frequency)`: Calculate next occurrence from a date
- `getNextRecurringDateFromDueDate(dueDate, frequency)`: Calculate next occurrence from completed task's due date
- `getEndOfPeriodDate(date, frequency)`: Get end of period (day/week/month/year)
- `getInitialRecurringDueDate(frequency)`: Get initial due date for new recurring task
- `expandRecurringTasks(tasks, start, end)`: Generate virtual instances for calendar views

**Other Utilities**:
- `sanitizeCsvField(value)`: Sanitize CSV fields to prevent injection

#### 5. Validation (`lib/validations.ts`)

**Zod Schemas**:
- `createTaskSchema`: Validates task creation (title required, max lengths, enum values)
- `updateTaskSchema`: Validates task updates (all fields optional)
- `moveTaskSchema`: Validates kanban move operations

### API Routes

All API routes return: `{ success: boolean, data: T | null, error: string | null }`

#### Health Check
- **GET** `/api/health`
- Returns: `{ status: "ok", taskCount: number, timestamp: ISO string }`

#### Tasks API
- **GET** `/api/tasks` - List tasks
  - Query params: `status`, `priority`, `dueBefore`, `dueAfter`, `tags`
- **POST** `/api/tasks` - Create task
  - Body: `CreateTaskInput`
  - Returns: Created task
- **GET** `/api/tasks/[id]` - Get single task
- **PUT** `/api/tasks/[id]` - Full update
- **PATCH** `/api/tasks/[id]` - Partial update
- **DELETE** `/api/tasks/[id]` - Delete task

#### Kanban API
- **GET** `/api/kanban/columns` - Get tasks grouped by status
  - Returns: `{ todo: Task[], 'in-progress': Task[], blocked: Task[], done: Task[] }`
- **PATCH** `/api/kanban/move` - Move task to new status
  - Body: `{ taskId: string, newStatus: TaskStatus }`

#### Calendar API
- **GET** `/api/calendar` - Get calendar tasks
  - Query params: `view` ('daily' | 'weekly' | 'monthly'), `date` (ISO string)
  - Returns: Tasks for the specified date range (with recurring task expansion)

#### Reports API
- **GET** `/api/reports` - Get reports
  - Query param: `type` ('summary' | 'productivity')
  - Returns: Summary statistics or productivity metrics

---

## Phase 2: Kanban Board UI

### Page Structure

**Main Page** (`app/page.tsx`):
- Route: `/`
- Client component with state management
- Features: Task filtering, modal management, column refresh

### Components

#### 1. Navigation (`components/ui/`)

**Navbar** (`Navbar.tsx`):
- App title: "Task Manager"
- Navigation links: Board, Calendar, Reports
- Active link highlighting (blue background)
- Notification badge integration

**NotificationBadge** (`NotificationBadge.tsx`):
- Shows count of overdue + due-today tasks
- Badge appears when count > 0
- Browser notification support (permission-based)
- Auto-refreshes every 30 seconds

#### 2. Task Components (`components/task/`)

**PriorityBadge** (`PriorityBadge.tsx`):
- Color-coded badges: High (red), Medium (amber), Low (green)
- Small pill-shaped indicators

**TaskCard** (`TaskCard.tsx`):
- Displays: Priority badge, due date, title, quick note, tags
- Visual indicators:
  - Red left border: Overdue tasks
  - Amber left border: Due today tasks
- Move buttons (caret symbols):
  - Left arrow: Move to previous status
  - Right arrow: Move to next status
  - **Behavior**: Skips 'blocked' status (progression: todo → in-progress → done)
- Click card body: Opens edit modal

**TaskModal** (`TaskModal.tsx`):
- Create mode: Empty form, "Create Task" title
- Edit mode: Pre-filled form, "Edit Task" title, Delete button
- Fields:
  - Title* (required)
  - Quick Note
  - Description
  - Status (dropdown: To Do, In Progress, Blocked, Done)
  - Priority (dropdown: Low, Medium, High)
  - Due Date (datetime-local input)
  - Recurring (dropdown: None, Daily, Weekly, Monthly, Yearly)
  - Recurring Until (datetime-local, shown when recurring selected)
  - Tags (comma-separated)
- **Recurring Task Behavior**:
  - When recurring frequency selected: Auto-sets due date to end of current period
  - Daily: Today (end of day)
  - Weekly: End of current week (Sunday)
  - Monthly: End of current month
- Save/Cancel/Delete buttons

#### 3. Kanban Components (`components/kanban/`)

**QuickAddBar** (`QuickAddBar.tsx`):
- Text input: "Quick add a task... (press Enter)"
- Press Enter: Creates task with default values (status: todo, priority: medium)
- Input clears after creation

**FilterBar** (`FilterBar.tsx`):
- Priority filter: Dropdown (All Priorities, High, Medium, Low)
- Tag filter: Text input
- Clear button: Resets both filters

**KanbanColumn** (`KanbanColumn.tsx`):
- Column header: Status label + task count
- Color-coded headers:
  - To Do: Blue (`bg-blue-500`)
  - In Progress: Amber (`bg-amber-500`)
  - Blocked: Red (`bg-red-500`)
  - Done: Green (`bg-green-500`)
- Empty state: "No tasks" message

**KanbanBoard** (`KanbanBoard.tsx`):
- 4-column responsive grid
- Columns: To Do, In Progress, Blocked, Done
- Passes `onMoveTask` and `onEditTask` handlers to columns

### User Interactions

#### Creating Tasks
1. **Quick Add**: Type in QuickAddBar, press Enter → Creates task in "To Do"
2. **Full Modal**: Click "+ New Task" → Fill form → Save

#### Editing Tasks
- Click task card → Opens edit modal
- Modify fields → Save
- Or click Delete → Confirms → Deletes task

#### Moving Tasks
- **Caret Buttons**: Click left/right arrows on task card
  - **Behavior**: Skips 'blocked' status
  - From 'todo': Can only move right → 'in-progress'
  - From 'in-progress': Can move left → 'todo', or right → 'done'
  - From 'blocked': Cannot use caret buttons (must use modal dropdown)
  - From 'done': Can only move left → 'in-progress'
- **Modal Dropdown**: Can set any status including 'blocked'

#### Filtering
- Select priority from dropdown → Filters tasks by priority
- Type tag in filter input → Filters tasks containing that tag
- Click Clear → Removes all filters

---

## Phase 3: Calendar, Reports, and Reminders

### Calendar View (`app/calendar/page.tsx`)

**Route**: `/calendar`

**Features**:
- Three view modes: Daily, Weekly, Monthly
- Date navigation: Prev, Today, Next buttons
- Task display with priority color-coding
- Click task → Opens edit modal
- **Recurring Task Expansion**: Shows all future occurrences within date range

#### Calendar Components

**CalendarView** (`components/calendar/CalendarView.tsx`):
- View switcher: Daily, Weekly, Monthly buttons
- Date label: Shows current period
- Navigation buttons: Prev, Today, Next

**MonthlyView** (`components/calendar/MonthlyView.tsx`):
- Traditional month grid (7 columns × ~5 rows)
- Day cells show:
  - Day number
  - Tasks for that day (max 3 visible, "+N more" if more)
  - Priority color-coding (red/amber/green)
  - Overdue indicator (red ring)
- Gray background for days outside current month
- Blue ring for today

**WeeklyView** (`components/calendar/WeeklyView.tsx`):
- 7-column grid (one per day)
- Each column shows:
  - Day header (name + date)
  - Task cards with priority badge, title, quick note
  - Overdue indicator (red ring)

**DailyView** (`components/calendar/DailyView.tsx`):
- Single day view
- Full task cards with:
  - Priority badge + Status badge
  - Title, note, description
  - Tags
  - Due time (if time component present)
- Overdue indicator (red ring)

### Reports Dashboard (`app/reports/page.tsx`)

**Route**: `/reports`

**Features**:
- Summary statistics cards
- Pie charts: Tasks by Status, Tasks by Priority
- Bar chart: Tasks Completed (Last 7 Days)
- Average completion time display

#### Reports Components

**ReportsDashboard** (`components/reports/ReportsDashboard.tsx`):
- **Summary Cards** (4 cards):
  - Total Tasks
  - Completion Rate (%)
  - Overdue (red if > 0)
  - Completed This Week
- **Charts**:
  - Tasks by Status (Pie chart)
  - Tasks by Priority (Pie chart)
  - Tasks Completed Per Day (Bar chart, last 7 days)
- **Average Completion Time**: Hours (stat card)

### Reminder Indicators

**Visual Indicators**:
- **TaskCard**: Red left border (overdue), Amber left border (due today)
- **Calendar Views**: Red ring around overdue task chips
- **NotificationBadge**: Shows count in navbar

**Browser Notifications**:
- Requests permission on first load
- Shows notifications for overdue/due-today tasks
- Auto-refreshes every 30 seconds

---

## Additional Enhancements

### Recurring Task Due Date Logic

#### When Creating Recurring Tasks

**Behavior**:
- If no due date provided: Auto-sets to end of current period
  - **Daily**: Today (end of day, 23:59:59 local time)
  - **Weekly**: End of current week (Sunday, end of day)
  - **Monthly**: End of current month (last day, end of day)
- If due date provided: Adjusts to end of period containing that date

**Implementation**:
- `getInitialRecurringDueDate(frequency)`: Calculates end of current period
- `getEndOfPeriodDate(date, frequency)`: Gets end of period for a given date
- Auto-populates in TaskModal when recurring frequency is selected

#### When Completing Recurring Tasks

**Behavior**:
- Calculates next occurrence from **completed task's due date** (not from "now")
- Ensures proper sequence: If task due Feb 19 is completed, next is Feb 20

**Next Occurrence Logic**:
- **Daily**: Completed task's due date + 1 day → End of that day
- **Weekly**: Completed task's due date + 1 week → End of that week (Sunday)
- **Monthly**: Completed task's due date + 1 month → End of that month
- **Yearly**: Completed task's due date + 1 year → End of that year

**Implementation**:
- `getNextRecurringDateFromDueDate(dueDate, frequency)`: Calculates from completed task's due date
- Called in `taskService.ts` when task status changes to 'done'

**Example**:
- Task due: Feb 19 (end of day)
- You complete it: Feb 19 at 11:08 PM
- Next occurrence created: **Feb 20** (end of day) ✓

### Caret Navigation Enhancement

**Problem**: Caret buttons allowed navigation through 'blocked' status, which doesn't make sense for progress flow.

**Solution**:
- Created `CARET_NAVIGABLE_STATUSES`: `['todo', 'in-progress', 'done']`
- Added helper functions:
  - `getNextCaretStatus(currentStatus)`: Returns next status skipping blocked
  - `getPreviousCaretStatus(currentStatus)`: Returns previous status skipping blocked
- Updated `TaskCard` to use these helpers

**Behavior**:
- **Progression**: `todo` → `in-progress` → `done` (skips `blocked`)
- **Blocked tasks**: Cannot use caret buttons to move to 'done'
- **Setting Blocked**: Only via status dropdown in modal
- **From Blocked**: Must use modal to change status (caret buttons disabled)

### Calendar Recurring Task Expansion

**Problem**: Recurring tasks only showed on their initial due date, not on future occurrences.

**Solution**:
- `expandRecurringTasks(tasks, start, end)`: Generates virtual task instances
- Calendar API uses this to show all occurrences within date range
- Virtual instances have unique IDs: `${task.id}-${date.toISOString()}`

**Behavior**:
- Daily recurring task created Feb 18 → Shows on Feb 18, 19, 20, 21... in calendar
- Weekly recurring task → Shows on each week's end date
- Monthly recurring task → Shows on each month's end date
- Respects `recurringEndDate` if set

---

## Recurring Tasks - Complete Behavior

### Storage Model

**Hybrid Approach**:
- **Lazy Creation**: When a recurring task is marked as "done", a new task record is created with the next occurrence's due date
- **Virtual Expansion**: For calendar views, future occurrences are generated on-the-fly (not stored)

### Task Lifecycle

1. **Create Recurring Task**:
   - User selects recurring frequency (daily/weekly/monthly/yearly)
   - Due date auto-sets to end of current period (if not provided)
   - Task stored with `recurringFrequency` and optional `recurringEndDate`

2. **Display in Calendar**:
   - Calendar API expands recurring tasks to show all occurrences within date range
   - Virtual instances generated for future dates
   - Each instance shows same task details with different due dates

3. **Complete Task**:
   - User marks task as "done"
   - System calculates next occurrence from completed task's due date
   - New task created with:
     - Same title, description, note, priority, tags
     - Next occurrence's due date (end of next period)
     - Status: 'todo'
     - Same `recurringFrequency` and `recurringEndDate`

4. **Next Occurrence**:
   - Appears in "To Do" column
   - Can be moved, edited, or completed like any other task
   - When completed, creates another occurrence (if within `recurringEndDate`)

### Due Date Rules

#### Daily Recurring Tasks
- **Creation**: Due date = Today (end of day, 23:59:59 local time)
- **Completion**: Next occurrence = Tomorrow (end of day)
- **Example**: Create Feb 18 → Due Feb 18. Complete Feb 18 → Next due Feb 19

#### Weekly Recurring Tasks
- **Creation**: Due date = End of current week (Sunday, end of day)
- **Completion**: Next occurrence = End of next week (Sunday, end of day)
- **Week Definition**: Monday = first day, Sunday = last day
- **Example**: Create during week of Feb 16-22 → Due Feb 22. Complete Feb 22 → Next due Mar 1

#### Monthly Recurring Tasks
- **Creation**: Due date = End of current month (last day, end of day)
- **Completion**: Next occurrence = End of next month
- **Example**: Create in February → Due Feb 28. Complete Feb 28 → Next due Mar 31

#### Yearly Recurring Tasks
- **Creation**: Due date = End of current year (Dec 31, end of day)
- **Completion**: Next occurrence = End of next year
- **Example**: Create in 2026 → Due Dec 31, 2026. Complete Dec 31, 2026 → Next due Dec 31, 2027

### Recurring End Date

- **Optional**: Can set `recurringEndDate` to limit recurrence
- **Behavior**: No new occurrences created after `recurringEndDate`
- **Example**: Daily task with end date Feb 25 → Stops creating after Feb 25

---

## Task Status Management

### Status Flow

**Standard Progression** (via caret buttons):
```
todo → in-progress → done
```

**Full Status Options** (via modal dropdown):
- `todo`: Initial state, not started
- `in-progress`: Currently being worked on
- `blocked`: Blocked by external dependency (can only be set via modal)
- `done`: Completed

### Caret Navigation Rules

**From 'todo'**:
- Can move right → 'in-progress'
- Cannot move left (already at start)

**From 'in-progress'**:
- Can move left → 'todo'
- Can move right → 'done' (skips 'blocked')

**From 'blocked'**:
- **Cannot use caret buttons**
- Must use modal dropdown to change status
- Rationale: Blocked doesn't represent progress, so caret navigation doesn't apply

**From 'done'**:
- Can move left → 'in-progress' (skips 'blocked')
- Cannot move right (already at end)

### Status Change Behavior

**Moving to 'done'**:
- If task is recurring → Creates next occurrence automatically
- Next occurrence appears in 'todo' column
- Original task remains in 'done' column

**Moving from 'done'**:
- Does not delete or affect any created recurring occurrences
- Simply changes status back to previous state

---

## Data Storage

### CSV Format

**File**: `data/tasks.csv` (or `CSV_PATH` environment variable)

**Columns**:
```
id,title,description,note,status,priority,dueDate,createdAt,updatedAt,recurringFrequency,recurringEndDate,tags
```

**Data Format**:
- `id`: UUID v4
- `tags`: Pipe-delimited (`tag1|tag2|tag3`)
- `dueDate`, `recurringEndDate`: ISO 8601 strings or empty string
- Empty fields: Stored as empty string (not null)
- Dates: ISO 8601 format (e.g., `2026-02-18T23:59:59.999Z`)

### Storage Operations

**Atomic Writes**:
- All writes use temporary file + rename for atomicity
- Prevents data corruption on crashes

**Automatic File Creation**:
- Creates `data/tasks.csv` with header if doesn't exist
- Creates `data/` directory if doesn't exist

**CSV Sanitization**:
- Removes leading `=`, `+`, `-`, `@`, tabs, carriage returns
- Prevents CSV injection attacks

### Data Persistence

- All changes persist immediately to CSV file
- No caching layer (direct file I/O)
- Thread-safe via atomic writes
- Suitable for single-user or low-concurrency scenarios

---

## API Response Format

All API endpoints return a standardized response envelope:

```typescript
{
  success: boolean;
  data: T | null;      // Response payload (null on error)
  error: string | null; // Error message (null on success)
}
```

**Success Response**:
```json
{
  "success": true,
  "data": { /* response data */ },
  "error": null
}
```

**Error Response**:
```json
{
  "success": false,
  "data": null,
  "error": "Error message here"
}
```

---

## Error Handling

### Client-Side
- Loading states shown during API calls
- Error messages logged to console
- User-friendly error handling in modals

### Server-Side
- Validation errors: 400 Bad Request
- Not found errors: 404 Not Found
- Server errors: 500 Internal Server Error
- All errors return standardized `ApiResponse` format

---

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Responsive design (mobile-friendly)
- Browser notifications require user permission

---

## Performance Considerations

### Calendar Views
- Recurring task expansion happens server-side
- Virtual instances generated on-demand
- Date range queries optimized

### Kanban Board
- Client-side filtering for instant feedback
- Optimistic UI updates
- Column refresh after mutations

### Reports
- Aggregations computed server-side
- Charts rendered client-side with Recharts
- No caching (always fresh data)

---

## Future Enhancements (Not Implemented)

- Sequence numbers for recurring tasks
- Recurring task template management
- Bulk operations
- Task dependencies
- Time tracking
- Export/import functionality
- User authentication
- Multi-user support
- Database migration (PostgreSQL, MongoDB, etc.)

---

## Summary of Key Behaviors

### ✅ Working Features

1. **Task CRUD**: Create, read, update, delete tasks
2. **Kanban Board**: 4-column board with task movement
3. **Filtering**: By priority and tags
4. **Calendar Views**: Daily, weekly, monthly with recurring task expansion
5. **Reports Dashboard**: Statistics and charts
6. **Recurring Tasks**: Auto-creation with proper due date sequencing
7. **Reminders**: Visual indicators and browser notifications
8. **Status Management**: Caret navigation (skips blocked), modal for all statuses

### 🔧 Recent Fixes (This Conversation)

1. **Recurring Task Due Dates**: Fixed to use end of period and calculate from completed task's due date
2. **Caret Navigation**: Fixed to skip 'blocked' status
3. **Date Display**: Fixed timezone handling in datetime-local inputs
4. **Calendar Expansion**: Fixed to show all recurring occurrences

---

**Document Version**: 1.0  
**Last Updated**: February 18, 2026  
**Maintained By**: Development Team
