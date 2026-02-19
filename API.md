# Task Manager API Documentation

This document describes all REST API endpoints available in the Task Manager application.

## Base URL

All endpoints are prefixed with `/api`.

## Response Format

All endpoints return a standard response envelope:

```json
{
  "success": boolean,
  "data": any | null,
  "error": string | null
}
```

- `success`: `true` for successful requests, `false` for errors
- `data`: Response payload (null on error)
- `error`: Error message string (null on success)

## Endpoints

### Health Check

#### GET `/api/health`

Check API health and get basic statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "taskCount": 5,
    "timestamp": "2026-02-18T10:30:00.000Z"
  },
  "error": null
}
```

---

### Tasks

#### GET `/api/tasks`

List all tasks with optional filters.

**Query Parameters:**
- `status` (optional): Filter by status (`todo`, `in-progress`, `blocked`, `done`)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`)
- `dueBefore` (optional): ISO date string - tasks due before this date
- `dueAfter` (optional): ISO date string - tasks due after this date
- `tags` (optional): Comma-separated tags to filter by

**Example:**
```
GET /api/tasks?status=todo&priority=high&tags=urgent,work
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "title": "Task title",
      "description": "Task description",
      "note": "Quick note",
      "status": "todo",
      "priority": "high",
      "dueDate": "2026-02-20T00:00:00.000Z",
      "createdAt": "2026-02-18T10:00:00.000Z",
      "updatedAt": "2026-02-18T10:00:00.000Z",
      "recurringFrequency": "none",
      "recurringEndDate": null,
      "tags": ["urgent", "work"]
    }
  ],
  "error": null
}
```

#### POST `/api/tasks`

Create a new task.

**Request Body:**
```json
{
  "title": "Task title",                    // required, 1-200 chars
  "description": "Task description",         // optional, max 2000 chars, defaults to ""
  "note": "Quick note",                      // optional, max 100 chars, defaults to ""
  "status": "todo",                          // optional, defaults to "todo"
  "priority": "medium",                      // optional, defaults to "medium"
  "dueDate": "2026-02-20T00:00:00.000Z",    // optional, ISO 8601 or null
  "recurringFrequency": "none",             // optional, defaults to "none"
  "recurringEndDate": null,                  // optional, ISO 8601 or null
  "tags": ["tag1", "tag2"]                  // optional, defaults to []
}
```

**Recurring Task Behavior:**
- If `recurringFrequency` is set and `dueDate` is not provided, `dueDate` is automatically set to end of current period:
  - Daily: Today (end of day)
  - Weekly: End of current week (Sunday)
  - Monthly: End of current month
  - Yearly: End of current year
- If `dueDate` is provided for a recurring task, it's adjusted to end of period containing that date

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "title": "Task title",
    // ... full task object
  },
  "error": null
}
```

**Error (400):** Validation error
```json
{
  "success": false,
  "data": null,
  "error": "title: String must contain at least 1 character(s)"
}
```

#### GET `/api/tasks/[id]`

Get a single task by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    // ... full task object
  },
  "error": null
}
```

**Error (404):** Task not found
```json
{
  "success": false,
  "data": null,
  "error": "Task not found"
}
```

#### PUT `/api/tasks/[id]`

Update a task (full update - all fields optional but will replace existing values).

**Request Body:** Same as POST, but all fields are optional.

**Response (200):** Updated task object

**Special Behavior:**
- If updating `status` to `"done"` and the task has `recurringFrequency` other than `"none"`, a new recurring task instance is automatically created (see Recurring Tasks section below)

**Error (400):** Validation error
**Error (404):** Task not found

#### PATCH `/api/tasks/[id]`

Partially update a task (same as PUT, but semantically indicates partial update).

**Request Body:** Same as PUT - all fields optional.

**Response (200):** Updated task object

**Special Behavior:**
- If updating `status` to `"done"` and the task has `recurringFrequency` other than `"none"`, a new recurring task instance is automatically created (see Recurring Tasks section below)

**Error (400):** Validation error
**Error (404):** Task not found

#### DELETE `/api/tasks/[id]`

Delete a task.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "deleted": "uuid-here"
  },
  "error": null
}
```

**Error (404):** Task not found

---

### Kanban

#### GET `/api/kanban/columns`

Get all tasks organized by kanban columns.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "todo": [/* array of tasks */],
    "in-progress": [/* array of tasks */],
    "blocked": [/* array of tasks */],
    "done": [/* array of tasks */]
  },
  "error": null
}
```

#### PATCH `/api/kanban/move`

Move a task to a different column (change status).

**Request Body:**
```json
{
  "taskId": "uuid-here",
  "newStatus": "in-progress"  // "todo" | "in-progress" | "blocked" | "done"
}
```

**Response (200):** Updated task object

**Special Behavior:**
- If moving to `"done"` and the task has `recurringFrequency` other than `"none"`, a new recurring task instance is automatically created (see Recurring Tasks section below)

**Error (400):** Validation error (invalid UUID or status)
**Error (404):** Task not found

---

### Calendar

#### GET `/api/calendar`

Get tasks for a specific calendar view and date range. **Automatically expands recurring tasks** to show all occurrences within the date range.

**Query Parameters:**
- `view` (required): `daily` | `weekly` | `monthly`
- `date` (required): ISO date string (e.g., "2026-02-18")

**Example:**
```
GET /api/calendar?view=weekly&date=2026-02-18
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "view": "weekly",
    "startDate": "2026-02-16T00:00:00.000Z",
    "endDate": "2026-02-22T23:59:59.999Z",
    "tasks": [
      /* array of tasks with dueDate in range */
      /* includes virtual instances for recurring tasks */
      /* virtual instances have IDs like: "original-id-2026-02-19T..." */
    ]
  },
  "error": null
}
```

**Recurring Task Expansion:**
- For recurring tasks, the API generates virtual instances for all occurrences within the date range
- Virtual instances are not stored in the database - they're computed on-the-fly
- Each virtual instance has a unique ID: `${originalTaskId}-${occurrenceDate.toISOString()}`
- Virtual instances respect `recurringEndDate` if set

**Error (400):** Missing or invalid `view` or `date` parameter

---

### Reports

#### GET `/api/reports`

Get analytics and reports.

**Query Parameters:**
- `type` (optional): `summary` (default) | `productivity`

#### Summary Report

```
GET /api/reports?type=summary
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "byStatus": {
      "todo": 10,
      "in-progress": 5,
      "blocked": 2,
      "done": 8
    },
    "byPriority": {
      "high": 5,
      "medium": 15,
      "low": 5
    },
    "overdue": 3,
    "completionRate": 0.32,
    "completedThisWeek": 5
  },
  "error": null
}
```

#### Productivity Report

```
GET /api/reports?type=productivity
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "completedPerDay": [
      { "date": "2026-02-12", "count": 2 },
      { "date": "2026-02-13", "count": 0 },
      { "date": "2026-02-14", "count": 5 },
      // ... last 7 days
    ],
    "avgCompletionTimeHours": 48.5
  },
  "error": null
}
```

**Error (400):** Invalid `type` parameter

---

## Task Object Schema

```typescript
{
  id: string;                          // UUID v4
  title: string;                        // 1-200 characters
  description: string;                  // max 2000 characters
  note: string;                         // max 100 characters (quick note for kanban)
  status: "todo" | "in-progress" | "blocked" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string | null;              // ISO 8601 date string or null
  createdAt: string;                    // ISO 8601 timestamp
  updatedAt: string;                    // ISO 8601 timestamp
  recurringFrequency: "none" | "daily" | "weekly" | "monthly" | "yearly";
  recurringEndDate: string | null;     // ISO 8601 date string or null
  tags: string[];                       // array of tag strings
}
```

## Recurring Tasks

### Auto-Creation Behavior

When a task with `recurringFrequency` other than `"none"` is marked as `done`, the system automatically creates a new task with:
- Same title, description, note, priority, tags
- Status set to `"todo"`
- `dueDate` calculated from the **completed task's due date** (not from current time)
- Same `recurringFrequency` and `recurringEndDate`
- Only created if `recurringEndDate` is null or the next date is before `recurringEndDate`

### Due Date Calculation Rules

The next occurrence's due date is calculated from the completed task's due date:

- **Daily**: Completed task's due date + 1 day → End of that day (23:59:59 local time)
  - Example: Task due Feb 19 → Next due Feb 20 (end of day)
  
- **Weekly**: Completed task's due date + 1 week → End of that week (Sunday, 23:59:59 local time)
  - Week definition: Monday = first day, Sunday = last day
  - Example: Task due Feb 22 (Sunday) → Next due Mar 1 (Sunday)
  
- **Monthly**: Completed task's due date + 1 month → End of that month (last day, 23:59:59 local time)
  - Example: Task due Feb 28 → Next due Mar 31
  
- **Yearly**: Completed task's due date + 1 year → End of that year (Dec 31, 23:59:59 local time)
  - Example: Task due Dec 31, 2026 → Next due Dec 31, 2027

### Initial Due Date for New Recurring Tasks

When creating a new recurring task:
- If no `dueDate` provided: Auto-sets to end of current period
  - Daily: Today (end of day)
  - Weekly: End of current week (Sunday)
  - Monthly: End of current month
  - Yearly: End of current year
- If `dueDate` provided: Adjusts to end of period containing that date

### Calendar View Expansion

The calendar API (`GET /api/calendar`) automatically expands recurring tasks to show all occurrences within the requested date range. Virtual task instances are generated for future dates (not stored in database) to display recurring tasks across multiple days/weeks/months in calendar views.

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created (POST /api/tasks)
- `400`: Bad Request (validation errors, missing parameters)
- `404`: Not Found (task not found)
- `500`: Internal Server Error

Error responses always follow the standard envelope format with `success: false` and an `error` message.
