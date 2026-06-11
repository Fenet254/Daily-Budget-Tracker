const mongoose = require('mongoose');
const Category = require('./models/Category');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/daily-budget-tracker')
  .then(async () => {
    console.log('Connected to MongoDB for seeding');
    
    const defaultCategories = [
      { name: 'Salary', type: 'income', isDefault: true },
      { name: 'Freelance', type: 'income', isDefault: true },
      { name: 'Food', type: 'expense', isDefault: true },
      { name: 'Transport', type: 'expense', isDefault: true },
      { name: 'Rent', type: 'expense', isDefault: true },
      { name: 'Utilities', type: 'expense', isDefault: true },
      { name: 'Entertainment', type: 'expense', isDefault: true },
      { name: 'Shopping', type: 'expense', isDefault: true },
      { name: 'Transfer', type: 'income', isDefault: true },
      { name: 'Other', type: 'expense', isDefault: true }
    ];

    for (const cat of defaultCategories) {
      const existing = await Category.findOne({ name: cat.name, type: cat.type, user: null });
      if (!existing) {
        await Category.create(cat);
        console.log(`Seeded: ${cat.name} (${cat.type})`);
      } else {
        console.log(`Skipped (exists): ${cat.name} (${cat.type})`);
      }
    }

    console.log('Seeding complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });

