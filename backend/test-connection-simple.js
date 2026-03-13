// test-connection-simple.js - FIXED VERSION
// Fixed "mongoose is not defined" error (TODO Step 1 ✓)

console.log('🧪 Testing MongoDB Connection from Node.js\n');

// Import mongoose at top level
const mongoose = require('mongoose');
console.log('✅ mongoose module loaded');

async function testConnection() {
    console.log('\n🔗 Testing connection to MongoDB...');

    // Use 127.0.0.1 instead of localhost (more reliable on Windows)
    const mongoURI = 'mongodb://127.0.0.1:27017/daily-budget-tracker';
    console.log(`   URI: ${mongoURI}`);

    try {
        // Connect with timeout
        const connection = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // 5 second timeout
        });

        console.log('\n✅ SUCCESS! MongoDB is connected! 🟢');
        console.log(`   Database: ${connection.connection.name}`);
        console.log(`   Host: ${connection.connection.host}:${connection.connection.port}`);

        // List all databases
        console.log('\n📊 Listing all databases:');
        const adminDb = connection.connection.db.admin();
        const databases = await adminDb.listDatabases();

        databases.databases.forEach(db => {
            console.log(`   📁 ${db.name} (${(db.sizeOnDisk/1024/1024).toFixed(2)} MB)`);
        });

        // Check if our database exists
        const ourDbName = 'daily-budget-tracker';
        const ourDbExists = databases.databases.some(db => db.name === ourDbName);

        if (ourDbExists) {
            console.log(`\n🎯 Found our database: ${ourDbName} ✅`);

            // List collections in our database
            const ourDb = connection.connection.useDb(ourDbName);
            const collections = await ourDb.listCollections().toArray();

            console.log(`   📋 Collections (${collections.length}):`);
            collections.forEach(col => {
                console.log(`     📄 ${col.name}`);
            });

            if (collections.length === 0) {
                console.log('\n💡 Database is empty. Register a user to populate it.');
            }
        } else {
            console.log(`\n📝 Database "${ourDbName}" will be created on first user registration.`);
        }

        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Test completed successfully! Ready to run: node backend/server.js');

    } catch (error) {
        console.log('\n❌ FAILED to connect to MongoDB');
        console.log(`   Error: ${error.message}`);

        console.log('\n🔧 QUICK FIX STEPS (Windows):');
        console.log('='.repeat(60));
        console.log('\n🚀 STEP 1: Start MongoDB Service');
        console.log('   Open PowerShell AS ADMINISTRATOR');
        console.log('   > net start MongoDB');
        console.log('\n📡 STEP 2: Check Port 27017');
        console.log('   > Test-NetConnection 127.0.0.1 -Port 27017');
        console.log('\n🔍 STEP 3: Manual Start (if service fails)');
        console.log('   > mkdir C:\\data\\db -Force');
        console.log('   > "C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe" --dbpath="C:\\data\\db"');
        console.log('\n⚙️ STEP 4: Services');
        console.log('   > services.msc (Find "MongoDB Server" → Start)');
        console.log('\n💡 TIP: Keep MongoDB running in separate terminal when starting backend!');
    }
}

testConnection();
