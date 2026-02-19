// Phase 1 API Test Suite
// Run with: node test-phase1-api.js

const baseUrl = 'http://localhost:3000';

async function apiCall(method, endpoint, body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

async function runTests() {
  const results = [];
  let taskId1, taskId2, recurringId;
  
  console.log('🚀 Starting Phase 1 API Tests...\n');
  
  // Test 1: Health Check
  console.log('Test 1: Health Check API...');
  const health = await apiCall('GET', '/api/health');
  const healthPassed = health.status === 200 && health.data?.success === true && health.data?.data?.status === 'ok';
  results.push({ test: 'Health Check', passed: healthPassed, status: health.status, data: health.data });
  console.log(healthPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${health.status}`);
  
  // Test 2: List Tasks (Empty)
  console.log('\nTest 2: List Tasks (Empty)...');
  const listEmpty = await apiCall('GET', '/api/tasks');
  const listEmptyPassed = listEmpty.status === 200 && listEmpty.data?.success === true && Array.isArray(listEmpty.data?.data);
  results.push({ test: 'List Tasks (Empty)', passed: listEmptyPassed, status: listEmpty.status, data: listEmpty.data });
  console.log(listEmptyPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${listEmpty.status}`);
  
  // Test 3: Create Task - Minimal
  console.log('\nTest 3: Create Task (Minimal)...');
  const createMinimal = await apiCall('POST', '/api/tasks', { title: 'Test Task Minimal' });
  taskId1 = createMinimal.data?.data?.id;
  const createMinimalPassed = createMinimal.status === 201 && 
            createMinimal.data?.success === true && 
            createMinimal.data?.data?.title === 'Test Task Minimal' &&
            createMinimal.data?.data?.status === 'todo' &&
            createMinimal.data?.data?.priority === 'medium' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(taskId1);
  results.push({ test: 'Create Task (Minimal)', passed: createMinimalPassed, status: createMinimal.status, data: createMinimal.data });
  console.log(createMinimalPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${createMinimal.status}`, `Task ID: ${taskId1}`);
  
  // Test 4: Create Task - Full Fields
  console.log('\nTest 4: Create Task (Full Fields)...');
  const createFull = await apiCall('POST', '/api/tasks', {
    title: 'Full Task',
    description: 'Test Description',
    note: 'Quick Note',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-02-20T00:00:00.000Z',
    tags: ['tag1', 'tag2']
  });
  taskId2 = createFull.data?.data?.id;
  const createFullPassed = createFull.status === 201 &&
            createFull.data?.data?.title === 'Full Task' &&
            createFull.data?.data?.status === 'in-progress' &&
            createFull.data?.data?.priority === 'high' &&
            createFull.data?.data?.tags?.length === 2;
  results.push({ test: 'Create Task (Full Fields)', passed: createFullPassed, status: createFull.status, data: createFull.data });
  console.log(createFullPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${createFull.status}`);
  
  // Test 5: Validation Error - Empty Title
  console.log('\nTest 5: Validation Error (Empty Title)...');
  const validationError = await apiCall('POST', '/api/tasks', { title: '' });
  const validationPassed = validationError.status === 400 && validationError.data?.success === false;
  results.push({ test: 'Validation Error (Empty Title)', passed: validationPassed, status: validationError.status, data: validationError.data });
  console.log(validationPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${validationError.status}`);
  
  // Test 6: Get Task by ID
  console.log('\nTest 6: Get Task by ID...');
  const getTask = await apiCall('GET', `/api/tasks/${taskId1}`);
  const getTaskPassed = getTask.status === 200 && getTask.data?.data?.id === taskId1;
  results.push({ test: 'Get Task by ID', passed: getTaskPassed, status: getTask.status, data: getTask.data });
  console.log(getTaskPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${getTask.status}`);
  
  // Test 7: Get Task - Not Found
  console.log('\nTest 7: Get Task (Not Found)...');
  const notFound = await apiCall('GET', '/api/tasks/00000000-0000-0000-0000-000000000000');
  const notFoundPassed = notFound.status === 404 && notFound.data?.success === false;
  results.push({ test: 'Get Task (Not Found)', passed: notFoundPassed, status: notFound.status, data: notFound.data });
  console.log(notFoundPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${notFound.status}`);
  
  // Test 8: Update Task (PUT)
  console.log('\nTest 8: Update Task (PUT)...');
  const updateTask = await apiCall('PUT', `/api/tasks/${taskId1}`, {
    title: 'Updated Title',
    status: 'done',
    priority: 'low'
  });
  const updatePassed = updateTask.status === 200 &&
            updateTask.data?.data?.title === 'Updated Title' &&
            updateTask.data?.data?.status === 'done' &&
            updateTask.data?.data?.priority === 'low';
  results.push({ test: 'Update Task (PUT)', passed: updatePassed, status: updateTask.status, data: updateTask.data });
  console.log(updatePassed ? '✅ PASSED' : '❌ FAILED', `Status: ${updateTask.status}`);
  
  // Test 9: Partial Update (PATCH)
  console.log('\nTest 9: Partial Update (PATCH)...');
  const patchTask = await apiCall('PATCH', `/api/tasks/${taskId2}`, {
    status: 'blocked'
  });
  const patchPassed = patchTask.status === 200 &&
            patchTask.data?.data?.status === 'blocked' &&
            patchTask.data?.data?.title === 'Full Task';
  results.push({ test: 'Partial Update (PATCH)', passed: patchPassed, status: patchTask.status, data: patchTask.data });
  console.log(patchPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${patchTask.status}`);
  
  // Test 10: List Tasks with Filters
  console.log('\nTest 10: List Tasks (Filtered)...');
  const filtered = await apiCall('GET', '/api/tasks?status=blocked&priority=high');
  const filteredPassed = filtered.status === 200 &&
            Array.isArray(filtered.data?.data) &&
            filtered.data?.data.every(t => t.status === 'blocked' && t.priority === 'high');
  results.push({ test: 'List Tasks (Filtered)', passed: filteredPassed, status: filtered.status, data: filtered.data });
  console.log(filteredPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${filtered.status}`);
  
  // Test 11: Kanban Columns
  console.log('\nTest 11: Kanban Columns...');
  const kanban = await apiCall('GET', '/api/kanban/columns');
  const kanbanPassed = kanban.status === 200 &&
            kanban.data?.data?.todo !== undefined &&
            kanban.data?.data?.['in-progress'] !== undefined &&
            kanban.data?.data?.blocked !== undefined &&
            kanban.data?.data?.done !== undefined;
  results.push({ test: 'Kanban Columns', passed: kanbanPassed, status: kanban.status, data: kanban.data });
  console.log(kanbanPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${kanban.status}`);
  
  // Test 12: Move Task
  console.log('\nTest 12: Move Task...');
  const moveTask = await apiCall('PATCH', '/api/kanban/move', {
    taskId: taskId2,
    newStatus: 'done'
  });
  const movePassed = moveTask.status === 200 && moveTask.data?.data?.status === 'done';
  results.push({ test: 'Move Task', passed: movePassed, status: moveTask.status, data: moveTask.data });
  console.log(movePassed ? '✅ PASSED' : '❌ FAILED', `Status: ${moveTask.status}`);
  
  // Test 13: Calendar - Daily View
  console.log('\nTest 13: Calendar (Daily View)...');
  const calendarDaily = await apiCall('GET', '/api/calendar?view=daily&date=2026-02-20');
  const calendarDailyPassed = calendarDaily.status === 200 &&
            calendarDaily.data?.data?.view === 'daily' &&
            calendarDaily.data?.data?.tasks !== undefined;
  results.push({ test: 'Calendar (Daily View)', passed: calendarDailyPassed, status: calendarDaily.status, data: calendarDaily.data });
  console.log(calendarDailyPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${calendarDaily.status}`);
  
  // Test 14: Calendar - Weekly View
  console.log('\nTest 14: Calendar (Weekly View)...');
  const calendarWeekly = await apiCall('GET', '/api/calendar?view=weekly&date=2026-02-18');
  const calendarWeeklyPassed = calendarWeekly.status === 200 &&
            calendarWeekly.data?.data?.view === 'weekly';
  results.push({ test: 'Calendar (Weekly View)', passed: calendarWeeklyPassed, status: calendarWeekly.status, data: calendarWeekly.data });
  console.log(calendarWeeklyPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${calendarWeekly.status}`);
  
  // Test 15: Calendar - Missing Parameters
  console.log('\nTest 15: Calendar (Missing Parameters)...');
  const calendarError = await apiCall('GET', '/api/calendar');
  const calendarErrorPassed = calendarError.status === 400 && calendarError.data?.success === false;
  results.push({ test: 'Calendar (Missing Parameters)', passed: calendarErrorPassed, status: calendarError.status, data: calendarError.data });
  console.log(calendarErrorPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${calendarError.status}`);
  
  // Test 16: Reports - Summary
  console.log('\nTest 16: Reports (Summary)...');
  const reportsSummary = await apiCall('GET', '/api/reports?type=summary');
  const reportsSummaryPassed = reportsSummary.status === 200 &&
            reportsSummary.data?.data?.total !== undefined &&
            reportsSummary.data?.data?.byStatus !== undefined &&
            reportsSummary.data?.data?.byPriority !== undefined;
  results.push({ test: 'Reports (Summary)', passed: reportsSummaryPassed, status: reportsSummary.status, data: reportsSummary.data });
  console.log(reportsSummaryPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${reportsSummary.status}`);
  
  // Test 17: Reports - Productivity
  console.log('\nTest 17: Reports (Productivity)...');
  const reportsProd = await apiCall('GET', '/api/reports?type=productivity');
  const reportsProdPassed = reportsProd.status === 200 &&
            reportsProd.data?.data?.completedPerDay !== undefined &&
            reportsProd.data?.data?.avgCompletionTimeHours !== undefined;
  results.push({ test: 'Reports (Productivity)', passed: reportsProdPassed, status: reportsProd.status, data: reportsProd.data });
  console.log(reportsProdPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${reportsProd.status}`);
  
  // Test 18: Delete Task
  console.log('\nTest 18: Delete Task...');
  const deleteTask = await apiCall('DELETE', `/api/tasks/${taskId1}`);
  const deletePassed = deleteTask.status === 200 && deleteTask.data?.success === true;
  results.push({ test: 'Delete Task', passed: deletePassed, status: deleteTask.status, data: deleteTask.data });
  console.log(deletePassed ? '✅ PASSED' : '❌ FAILED', `Status: ${deleteTask.status}`);
  
  // Test 19: Verify Deleted Task
  console.log('\nTest 19: Verify Deleted Task...');
  const verifyDeleted = await apiCall('GET', `/api/tasks/${taskId1}`);
  const verifyDeletedPassed = verifyDeleted.status === 404;
  results.push({ test: 'Verify Deleted Task', passed: verifyDeletedPassed, status: verifyDeleted.status, data: verifyDeleted.data });
  console.log(verifyDeletedPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${verifyDeleted.status}`);
  
  // Test 20: Recurring Task Test
  console.log('\nTest 20: Recurring Task Auto-Create...');
  const recurringTask = await apiCall('POST', '/api/tasks', {
    title: 'Daily Recurring Task',
    recurringFrequency: 'daily',
    dueDate: '2026-02-18T00:00:00.000Z',
    status: 'todo'
  });
  recurringId = recurringTask.data?.data?.id;
  
  const completeRecurring = await apiCall('PATCH', `/api/tasks/${recurringId}`, {
    status: 'done'
  });
  
  // Wait a bit for async operations
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const allTasks = await apiCall('GET', '/api/tasks');
  const newRecurringTask = allTasks.data?.data?.find(t => 
    t.title === 'Daily Recurring Task' && t.status === 'todo' && t.id !== recurringId
  );
  
  const recurringPassed = completeRecurring.status === 200 && newRecurringTask !== undefined;
  results.push({ test: 'Recurring Task Auto-Create', passed: recurringPassed, status: completeRecurring.status, data: { completed: completeRecurring.data, newTask: newRecurringTask } });
  console.log(recurringPassed ? '✅ PASSED' : '❌ FAILED', `Status: ${completeRecurring.status}`);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('\nFailed Tests:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.test} - Status: ${r.status}`);
  });
  
  return results;
}

// Run tests if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, apiCall };
