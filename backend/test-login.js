// Test login directly
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mongoURI = 'mongodb://127.0.0.1:27017/daily-budget-tracker';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB\n');
  
  const User = require('./models/User');
  
  // Ask for email to test
  const email = process.argv[2] || 'simbani011@gmail.com';
  const password = process.argv[3] || 'your-password-here';
  
  console.log(`Testing login with:`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}\n`);
  
  // Find user by email (lowercase)
  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    console.log('❌ User not found!');
    
    // Try to find similar emails
    const similarUsers = await User.find({ 
      email: { $regex: new RegExp(email.split('@')[0], 'i') } 
    });
    
    if (similarUsers.length > 0) {
      console.log('\nSimilar emails in database:');
      similarUsers.forEach(u => console.log(`  - ${u.email}`));
    }
  } else {
    console.log('✓ User found!');
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password hash: ${user.password.substring(0, 30)}...`);
    
    // Test password
    const isMatch = await user.matchPassword(password);
    console.log(`\nPassword match: ${isMatch ? '✓ YES' : '❌ NO'}`);
    
    if (!isMatch) {
      // Try to find what the password might be
      console.log('\n--- Trying to identify the issue ---');
      console.log('The password you entered does not match the hash in the database.');
      console.log('This could mean:');
      console.log('  1. You entered a different password during registration');
      console.log('  2. The password was not hashed properly during registration');
    }
  }
  
  await mongoose.connection.close();
  process.exit(0);
})
.catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

