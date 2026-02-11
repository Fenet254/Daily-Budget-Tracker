// test-connection-simple.js
console.log('🧪 Testing MongoDB Connection from Node.js\n');

// Try to load mongoose
try {
    const mongoose = require('mongoose');
    console.log('✅ mongoose module loaded');
} catch (error) {
    console.log('❌ mongoose not found. Installing...');
    console.log('   Run: npm install mongoose');
    process.exit(1);
}

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

        console.log('\n✅ SUCCESS! MongoDB is connected!');
        console.log(`   Database: ${connection.connection.name}`);
        console.log(`   Host: ${connection.connection.host}`);
        console.log(`   Port: ${connection.connection.port}`);

        // List all databases
        console.log('\n📊 Listing all databases:');
        const adminDb = connection.connection.db.admin();
        const databases = await adminDb.listDatabases();

        databases.databases.forEach(db => {
            console.log(`   - ${db.name} (${(db.sizeOnDisk/1024/1024).toFixed(2)} MB)`);
        });

        // Check if our database exists
        const ourDbName = 'daily-budget-tracker';
        const ourDbExists = databases.databases.some(db => db.name === ourDbName);

        if (ourDbExists) {
            console.log(`\n🎯 Found our database: ${ourDbName}`);

            // List collections in our database
            const ourDb = connection.connection.useDb(ourDbName);
            const collections = await ourDb.listCollections().toArray();

            console.log(`   Collections (${collections.length}):`);
            collections.forEach(col => {
                console.log(`     * ${col.name}`);
            });

            if (collections.length === 0) {
                console.log('\n💡 Database is empty. It will be populated when you register a user.');
            }
        } else {
            console.log(`\n💡 Database "${ourDbName}" doesn't exist yet.`);
            console.log('   It will be created automatically when you register the first user.');
        }

        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Test completed successfully!');

    } catch (error) {
        console.log('\n❌ FAILED to connect to MongoDB');
        console.log(`   Error: ${error.message}`);

        console.log('\n🔧 TROUBLESHOOTING STEPS:');
        console.log('=' .repeat(50));
        console.log('\n1. Check if MongoDB service is running:');
        console.log('   Open PowerShell as Administrator and run:');
        console.log('   > net start MongoDB');
        console.log('\n2. Check if port 27017 is listening:');
        console.log('   > Test-NetConnection 127.0.0.1 -Port 27017');
        console.log('\n3. Check MongoDB installation:');
        console.log('   Location: C:\\Program Files\\MongoDB\\Server\\8.2\\');
        console.log('   Test server: "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe" --version');
        console.log('\n4. Try starting MongoDB manually:');
        console.log('   First, create data directory:');
        console.log('   > mkdir C:\\data\\db -Force');
        console.log('   Then start MongoDB:');
        console.log('   > "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe" --dbpath="C:\\data\\db"');
        console.log('\n5. Check Windows Services:');
        console.log('   > services.msc');
        console.log('   Look for "MongoDB" service');
    }
}

testConnection();