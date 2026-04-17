
const mongoose = require('mongoose');
const mongoURI = 'mongodb://127.0.0.1:27017/daily-budget-tracker';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  

  const User = require('./models/User');
  
 
  const users = await User.find({});
  console.log(`\nTotal users in database: ${users.length}`);
  
  if (users.length > 0) {
    console.log('\nUsers:');
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
      console.log(`   Date: ${user.date}`);
    });
  } else {
    console.log('\nNo users found in database!');
  }
  
  // Try to test password
  if (users.length > 0) {
    const testUser = users[0];
    console.log('\n--- Testing password ---');
    const bcrypt = require('bcryptjs');
    
    // Test with a simple password
    const testPassword = 'test123';
    const isMatch = await testUser.matchPassword(testPassword);
    console.log(`Testing password '${testPassword}': ${isMatch}`);
    
    // Test with the stored password
    console.log(`Stored password starts with: ${testUser.password.substring(0, 10)}`);
  }
  
  await mongoose.connection.close();
  process.exit(0);
})
.catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

