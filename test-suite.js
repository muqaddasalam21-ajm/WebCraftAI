async function runPhase3TestSuite() {
  console.log('🧪 Starting WebCraftAI Phase 3 (Database + User Management + Profile) Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Health Check
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthData = await healthRes.json();
  assert(healthRes.status === 200 && healthData.version.includes('0.3.0'), 'Backend health check running Phase 3 v0.3.0');

  // Authenticate Admin
  const adminLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@webcraft.ai',
      password: 'Password123!'
    })
  });
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.token;
  assert(adminLoginRes.status === 200 && adminData.user.role === 'admin', 'Admin logged in for user management testing');

  // TEST 1: Real Database User List
  const userListRes = await fetch('http://localhost:5000/api/users', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const userListData = await userListRes.json();
  assert(
    userListRes.status === 200 && Array.isArray(userListData.users) && userListData.total >= 4,
    'TEST 1 (User List): Real persistent database users retrieved with pagination'
  );

  // TEST 2: Search Users
  const searchRes = await fetch('http://localhost:5000/api/users?search=Elena', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const searchData = await searchRes.json();
  assert(
    searchRes.status === 200 && searchData.users.some(u => u.name.includes('Elena')),
    'TEST 2 (User Search): Queried database by name with matching results'
  );

  // TEST 3: Role Filter
  const roleFilterRes = await fetch('http://localhost:5000/api/users?role=vendor', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const roleFilterData = await roleFilterRes.json();
  assert(
    roleFilterRes.status === 200 && roleFilterData.users.every(u => u.role === 'vendor'),
    'TEST 3 (Role Filter): Filtered database query returns only vendor records'
  );

  // TEST 4: Status Filter
  const statusFilterRes = await fetch('http://localhost:5000/api/users?status=active', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const statusFilterData = await statusFilterRes.json();
  assert(
    statusFilterRes.status === 200 && statusFilterData.users.every(u => u.status === 'active'),
    'TEST 4 (Status Filter): Filtered database query returns only active records'
  );

  // TEST 5: Create a new user then Edit User
  const newEmail = `user_edit_${Date.now()}@example.com`;
  const createRes = await fetch('http://localhost:5000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Editable User',
      email: newEmail,
      password: 'Password123!'
    })
  });
  const createData = await createRes.json();
  const testUserId = createData.user.id;
  const testUserToken = createData.token;

  const editRes = await fetch(`http://localhost:5000/api/users/${testUserId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'Edited Name User',
      phone: '+1 (555) 999-0000'
    })
  });
  const editData = await editRes.json();
  assert(
    editRes.status === 200 && editData.user.name === 'Edited Name User',
    'TEST 5 (Edit User): Admin successfully updated user record in database'
  );

  // TEST 6: Change Role (User -> Vendor)
  const roleChangeRes = await fetch(`http://localhost:5000/api/users/${testUserId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ role: 'vendor' })
  });
  const roleChangeData = await roleChangeRes.json();
  assert(
    roleChangeRes.status === 200 && roleChangeData.user.role === 'vendor',
    'TEST 6 (Change Role): Admin promoted user to Vendor role'
  );

  // TEST 7: Change Status to Inactive & Verify access blocked
  const statusChangeRes = await fetch(`http://localhost:5000/api/users/${testUserId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'inactive' })
  });
  assert(
    statusChangeRes.status === 200,
    'TEST 7a (Change Status): Admin marked user account inactive'
  );

  const inactiveAttemptRes = await fetch('http://localhost:5000/api/profile', {
    headers: { Authorization: `Bearer ${testUserToken}` }
  });
  assert(
    inactiveAttemptRes.status === 401,
    'TEST 7b (Inactive Block): Inactive user rejected from authenticated endpoints'
  );

  // Reactivate user for profile and password testing
  await fetch(`http://localhost:5000/api/users/${testUserId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'active' })
  });

  // TEST 8: Delete User
  const deleteTargetEmail = `delete_target_${Date.now()}@example.com`;
  const deleteSignupRes = await fetch('http://localhost:5000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'To Be Deleted',
      email: deleteTargetEmail,
      password: 'Password123!'
    })
  });
  const deleteSignupData = await deleteSignupRes.json();
  const deleteRes = await fetch(`http://localhost:5000/api/users/${deleteSignupData.user.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    deleteRes.status === 200,
    'TEST 8 (Delete User): Admin safely deleted user account from database'
  );

  // TEST 9: User Profile Read
  const profileRes = await fetch('http://localhost:5000/api/profile', {
    headers: { Authorization: `Bearer ${testUserToken}` }
  });
  const profileData = await profileRes.json();
  assert(
    profileRes.status === 200 && profileData.user.id === testUserId && !profileData.user.passwordHash,
    'TEST 9 (User Profile): Retrieved authenticated user profile with sensitive fields omitted'
  );

  // TEST 10: Edit Profile
  const profileUpdateRes = await fetch('http://localhost:5000/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${testUserToken}`
    },
    body: JSON.stringify({
      fullName: 'Updated Self Name',
      phone: '+1 (555) 777-8888',
      bio: 'My personal bio'
    })
  });
  const profileUpdateData = await profileUpdateRes.json();
  assert(
    profileUpdateRes.status === 200 && profileUpdateData.user.name === 'Updated Self Name',
    'TEST 10 (Edit Profile): User updated own profile information in database'
  );

  // TEST 11: Change Password
  const changePassRes = await fetch('http://localhost:5000/api/profile/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${testUserToken}`
    },
    body: JSON.stringify({
      currentPassword: 'Password123!',
      newPassword: 'BrandNewPassword456!',
      confirmNewPassword: 'BrandNewPassword456!'
    })
  });
  assert(
    changePassRes.status === 200,
    'TEST 11a (Change Password): Password successfully changed'
  );

  const oldPassLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: newEmail, password: 'Password123!' })
  });
  const newPassLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: newEmail, password: 'BrandNewPassword456!' })
  });
  assert(
    oldPassLoginRes.status === 401 && newPassLoginRes.status === 200,
    'TEST 11b (Password Verification): Old password rejected and new password authenticated'
  );

  // TEST 12 & 13: Role Escalation & User Security
  const normalUserLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@webcraft.ai', password: 'Password123!' })
  });
  const normalUserData = await normalUserLogin.json();
  const normalUserToken = normalUserData.token;

  const forbiddenUsersGet = await fetch('http://localhost:5000/api/users', {
    headers: { Authorization: `Bearer ${normalUserToken}` }
  });
  const forbiddenRolePatch = await fetch(`http://localhost:5000/api/users/${normalUserData.user.id}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${normalUserToken}`
    },
    body: JSON.stringify({ role: 'admin' })
  });
  assert(
    forbiddenUsersGet.status === 403 && forbiddenRolePatch.status === 403,
    'TEST 12 & 13 (User Security & Role Escalation Block): Normal user blocked from GET /api/users and PATCH role'
  );

  // TEST 14: Phase 1 AI Still Works
  const aiRes = await fetch('http://localhost:5000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Recommend a landing page layout for an architecture firm.' }]
    })
  });
  const aiData = await aiRes.json();
  assert(
    aiRes.status === 200 && aiData.reply && aiData.reply.length > 50,
    'TEST 14 (Phase 1 AI Integration): AI assistant responded accurately'
  );

  // TEST 15: Frontend Server check
  const feRes = await fetch('http://localhost:3000/');
  assert(feRes.status === 200, 'Frontend dev server running and accessible on port 3000');

  console.log(`\n========================================`);
  console.log(`🏁 PHASE 3 TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runPhase3TestSuite().catch(err => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});


