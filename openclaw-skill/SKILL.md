---
name: task-manager
description: Manage a personal Kanban task board via REST API. Create, read, update, delete, and move tasks. Query by status, priority, date range, and tags. Get calendar views (daily/weekly/monthly) and productivity reports. Use when the user asks about tasks, to-dos, planning, scheduling, the kanban board, or productivity.
---

# Task Manager Skill

Manage tasks on a personal Kanban board via HTTP API at `http://localhost:3000/api`.

The board has 4 columns: To Do, In Progress, Blocked, Done.
Each task has: title, note (short), description (long), status, priority (low/medium/high), due date, recurring settings, and tags.

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

HTTP status codes:
- `200`: Success
- `201`: Created (POST /api/tasks)
- `400`: Bad Request (validation errors, missing parameters)
- `404`: Not Found (task not found)
- `500`: Internal Server Error

## Task CRUD

### List all tasks

```bash
curl -s http://localhost:3000/api/tasks | jq
```

### List with filters

Available query params: `status`, `priority`, `dueBefore`, `dueAfter`, `tags` (comma-separated).

```bash
curl -s "http://localhost:3000/api/tasks?status=todo" | jq
curl -s "http://localhost:3000/api/tasks?priority=high" | jq
curl -s "http://localhost:3000/api/tasks?status=todo&priority=high" | jq
curl -s "http://localhost:3000/api/tasks?dueBefore=2026-02-28T00:00:00.000Z" | jq
curl -s "http://localhost:3000/api/tasks?dueAfter=2026-02-18T00:00:00.000Z" | jq
curl -s "http://localhost:3000/api/tasks?tags=work,urgent" | jq
```

**Query Parameters:**
- `status` (optional): Filter by status (`todo`, `in-progress`, `blocked`, `done`)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`)
- `dueBefore` (optional): ISO date string - tasks due before this date
- `dueAfter` (optional): ISO date string - tasks due after this date
- `tags` (optional): Comma-separated tags to filter by

### Get a single task

```bash
curl -s http://localhost:3000/api/tasks/{id} | jq
```

**Error (404):** Task not found
```json
{
  "success": false,
  "data": null,
  "error": "Task not found"
}
```

### Create a task

Required field: `title`. All others are optional with defaults.

```bash
curl -s -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review pull request",
    "note": "PR #42 from Alice",
    "description": "Review the changes in PR #42",
    "priority": "high",
    "status": "todo",
    "dueDate": "2026-02-20T17:00:00.000Z",
    "recurringFrequency": "none",
    "recurringEndDate": null,
    "tags": ["work", "code-review"]
  }' | jq
```

**Request Body:**
- `title` (required): 1-200 characters
- `description` (optional): max 2000 characters, defaults to ""
- `note` (optional): max 100 characters, defaults to ""
- `status` (optional): defaults to "todo"
- `priority` (optional): defaults to "medium"
- `dueDate` (optional): ISO 8601 date string or null
- `recurringFrequency` (optional): defaults to "none"
- `recurringEndDate` (optional): ISO 8601 date string or null
- `tags` (optional): array of strings, defaults to []

**Recurring Task Behavior:**
- If `recurringFrequency` is set and `dueDate` is not provided, `dueDate` is automatically set to end of current period:
  - Daily: Today (end of day)
  - Weekly: End of current week (Sunday)
  - Monthly: End of current month
  - Yearly: End of current year
- If `dueDate` is provided for a recurring task, it's adjusted to end of period containing that date

**Error (400):** Validation error
```json
{
  "success": false,
  "data": null,
  "error": "title: String must contain at least 1 character(s)"
}
```

### Update a task (full or partial)

PUT replaces all provided fields. PATCH works identically (all fields optional).

```bash
curl -s -X PUT http://localhost:3000/api/tasks/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review pull request - URGENT",
    "note": "Blocking release",
    "priority": "high",
    "status": "in-progress"
  }' | jq
```

**Special Behavior:**
- If updating `status` to `"done"` and the task has `recurringFrequency` other than `"none"`, a new recurring task instance is automatically created (see Recurring Tasks section below)

**Error (400):** Validation error
**Error (404):** Task not found

### Delete a task

```bash
curl -s -X DELETE http://localhost:3000/api/tasks/{id} | jq
```

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

## Kanban Board

### Get all columns

Returns tasks grouped by status.

```bash
curl -s http://localhost:3000/api/kanban/columns | jq
```

Response shape:
```json
{
  "success": true,
  "data": {
    "todo": [...tasks],
    "in-progress": [...tasks],
    "blocked": [...tasks],
    "done": [...tasks]
  },
  "error": null
}
```

### Move a task between columns

```bash
curl -s -X PATCH http://localhost:3000/api/kanban/move \
  -H "Content-Type: application/json" \
  -d '{"taskId": "{id}", "newStatus": "in-progress"}' | jq
```

**Request Body:**
```json
{
  "taskId": "uuid-here",
  "newStatus": "in-progress"  // "todo" | "in-progress" | "blocked" | "done"
}
```

Valid statuses: `todo`, `in-progress`, `blocked`, `done`.

**Special Behavior:**
- If moving to `"done"` and the task has `recurringFrequency` other than `"none"`, a new recurring task instance is automatically created (see Recurring Tasks section below)

**Error (400):** Validation error (invalid UUID or status)
**Error (404):** Task not found

## Calendar

Get tasks for a specific calendar view and date range. **Automatically expands recurring tasks** to show all occurrences within the date range.

```bash
# Daily view
curl -s "http://localhost:3000/api/calendar?view=daily&date=2026-02-18" | jq

# Weekly view
curl -s "http://localhost:3000/api/calendar?view=weekly&date=2026-02-18" | jq

# Monthly view
curl -s "http://localhost:3000/api/calendar?view=monthly&date=2026-02-01" | jq
```

**Query Parameters:**
- `view` (required): `daily` | `weekly` | `monthly`
- `date` (required): ISO date string (e.g., "2026-02-18")

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
- Only returns tasks that have a due date

**Error (400):** Missing or invalid `view` or `date` parameter

## Reports

### Task summary

```bash
curl -s "http://localhost:3000/api/reports?type=summary" | jq
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

Returns: total count, counts by status and priority, overdue count, completion rate, completed this week.

### Productivity stats

```bash
curl -s "http://localhost:3000/api/reports?type=productivity" | jq
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "completedPerDay": [
      { "date": "2026-02-12", "count": 2 },
      { "date": "2026-02-13", "count": 0 },
      { "date": "2026-02-14", "count": 5 }
      // ... last 7 days
    ],
    "avgCompletionTimeHours": 48.5
  },
  "error": null
}
```

Returns: tasks completed per day (last 7 days), average completion time in hours.

**Query Parameters:**
- `type` (optional): `summary` (default) | `productivity`

**Error (400):** Invalid `type` parameter

## Health Check

```bash
curl -s http://localhost:3000/api/health | jq
```

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

## Task Fields Reference

| Field | Type | Required | Default | Max Length |
|-------|------|----------|---------|-----------|
| title | string | yes | - | 200 |
| description | string | no | "" | 2000 |
| note | string | no | "" | 100 |
| status | enum | no | "todo" | - |
| priority | enum | no | "medium" | - |
| dueDate | ISO 8601 / null | no | null | - |
| createdAt | ISO 8601 | auto | - | - |
| updatedAt | ISO 8601 | auto | - | - |
| recurringFrequency | enum | no | "none" | - |
| recurringEndDate | ISO 8601 / null | no | null | - |
| tags | string[] | no | [] | - |

**Status values**: `todo`, `in-progress`, `blocked`, `done`
**Priority values**: `low`, `medium`, `high`
**Recurring values**: `none`, `daily`, `weekly`, `monthly`, `yearly`

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
  updatedAt: string;                   // ISO 8601 timestamp
  recurringFrequency: "none" | "daily" | "weekly" | "monthly" | "yearly";
  recurringEndDate: string | null;     // ISO 8601 date string or null
  tags: string[];                       // array of tag strings
}
```

## Recurring Tasks

### Auto-Creation Behavior

When a task with `recurringFrequency` other than `"none"` is marked as `done` (via PUT/PATCH update or kanban move), the system automatically creates a new task with:
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

## Task Status Management

### Status Flow

**Standard Progression** (via kanban move or update):
- `todo`: Initial state, not started
- `in-progress`: Currently being worked on
- `blocked`: Blocked by external dependency
- `done`: Completed

**Status Change Behavior:**
- Moving to `done`: If task is recurring → Creates next occurrence automatically
- Next occurrence appears in `todo` column
- Original task remains in `done` column

## Common Workflows

**Daily standup check**: "What tasks are in progress?" -> `GET /api/tasks?status=in-progress`

**End of day review**: "What did I complete today?" -> `GET /api/tasks?status=done` (then filter by updatedAt)

**Planning**: "What's due this week?" -> `GET /api/calendar?view=weekly&date={today}`

**Quick capture**: "Add a task to buy groceries" -> `POST /api/tasks` with title only

**Prioritize**: "Set task X to high priority" -> `PATCH /api/tasks/{id}` with `{"priority":"high"}`

**Review blocked items**: "What tasks are blocked?" -> `GET /api/tasks?status=blocked`

**Move task to done**: "Complete task X" -> `PATCH /api/kanban/move` with `{"taskId": "{id}", "newStatus": "done"}`

**Create recurring task**: "Add a daily standup task" -> `POST /api/tasks` with `{"title": "Daily standup", "recurringFrequency": "daily"}`

**View calendar**: "Show me tasks for next week" -> `GET /api/calendar?view=weekly&date={next-week-date}`

**Get productivity stats**: "How productive was I this week?" -> `GET /api/reports?type=productivity`
