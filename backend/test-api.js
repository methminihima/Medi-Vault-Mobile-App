// Test script to verify backend API is working
// Run with: node test-api.js

const testAPI = async () => {
  try {
    console.log('🧪 Testing MediVault API...\n');

    // Test 1: Health Check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log(healthData.success ? '✅ Health check passed' : '❌ Health check failed');
    console.log('   Response:', healthData.message, '\n');

    // Test 2: Create User
    console.log('2️⃣ Testing user creation...');
    const createUserResponse = await fetch('http://localhost:5000/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'Test User',
        email: 'testuser@example.com',
        phone: '+1234567890',
        username: 'testuser123',
        password: 'password123',
        role: 'patient',
      }),
    });
    
    const createUserData = await createUserResponse.json();
    if (createUserData.success) {
      console.log('✅ User created successfully');
      console.log('   User ID:', createUserData.data.id);
      console.log('   Name:', createUserData.data.fullName);
      console.log('   Email:', createUserData.data.email);
      console.log('   Role:', createUserData.data.role, '\n');
    } else {
      console.log('❌ User creation failed');
      console.log('   Error:', createUserData.message, '\n');
    }

    // Test 3: Get All Users
    console.log('3️⃣ Testing get all users...');
    const usersResponse = await fetch('http://localhost:5000/api/users');
    const usersData = await usersResponse.json();
    if (usersData.success) {
      console.log('✅ Retrieved users successfully');
      console.log('   Total users:', usersData.data.length);
      console.log('   Users:', usersData.data.map(u => u.fullName).join(', '), '\n');
    } else {
      console.log('❌ Failed to retrieve users', '\n');
    }

    console.log('✅ All API tests completed!\n');
    console.log('📝 Your backend is ready to use with the React Native app.');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.log('\n⚠️  Make sure:');
    console.log('   1. Backend server is running (npm run dev in backend folder)');
    console.log('   2. PostgreSQL is running and database is created');
    console.log('   3. Port 5000 is available\n');
  }
};

testAPI();
