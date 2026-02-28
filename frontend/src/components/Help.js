import React, { useState } from 'react';
import { 
  FiSearch, FiHelpCircle, FiBook, FiMessageCircle, FiMail,
  FiChevronDown, FiChevronUp, FiExternalLink, FiCreditCard,
  FiDollarSign, FiPieChart, FiTarget, FiLock, FiSmartphone, FiRefreshCw
} from 'react-icons/fi';
import './Help.css';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categories = [
    { id: 'getting-started', label: 'Getting Started', icon: <FiHelpCircle /> },
    { id: 'account', label: 'Account & Security', icon: <FiLock /> },
    { id: 'transactions', label: 'Transactions', icon: <FiCreditCard /> },
    { id: 'budgets', label: 'Budgets', icon: <FiTarget /> },
    { id: 'reports', label: 'Reports', icon: <FiPieChart /> },
    { id: 'import', label: 'SMS Import', icon: <FiSmartphone /> },
  ];

  const faqs = {
    'getting-started': [
      {
        question: 'How do I get started with Daily Budget Tracker?',
        answer: 'Getting started is easy! First, create an account by clicking the "Register" button. Once logged in, you can start adding transactions by clicking "Add Transaction" on your dashboard. You can categorize your income and expenses to track your spending habits.'
      },
      {
        question: 'What currencies does the app support?',
        answer: 'Currently, the app supports Ethiopian Birr (ETB) as the default currency. All your transactions, budgets, and reports will be displayed in ETB.'
      },
      {
        question: 'Can I use the app on mobile devices?',
        answer: 'Yes! Daily Budget Tracker is fully responsive and works on desktops, tablets, and mobile phones. You can access all features through any web browser on your device.'
      },
      {
        question: 'Is my data secure?',
        answer: 'Absolutely. We use industry-standard encryption to protect your data. Your financial information is stored securely and we never share your personal data with third parties.'
      }
    ],
    'account': [
      {
        question: 'How do I reset my password?',
        answer: 'Click on "Forgot Password" on the login page, enter your email address, and we\'ll send you a link to reset your password. The link expires after 24 hours for security.'
      },
      {
        question: 'Can I change my email address?',
        answer: 'Yes, go to Settings > Profile and click on "Change Email". You\'ll need to verify your new email address before it becomes active.'
      },
      {
        question: 'How do I delete my account?',
        answer: 'Go to Settings > Account > Delete Account. Please note this action is irreversible and all your data will be permanently deleted.'
      },
      {
        question: 'Is two-factor authentication available?',
        answer: 'Two-factor authentication is coming soon! We\'re working on adding this extra layer of security to your account.'
      }
    ],
    'transactions': [
      {
        question: 'How do I add a new transaction?',
        answer: 'Click the "Add Transaction" button on your dashboard or navigate to Transactions > Add New. Fill in the amount, select the type (income or expense), choose a category, add a description, and set the date.'
      },
      {
        question: 'Can I edit or delete a transaction?',
        answer: 'Yes! Go to the Transactions page, find the transaction you want to modify, and click the edit icon to modify it or the trash icon to delete it.'
      },
      {
        question: 'What categories are available?',
        answer: 'The app comes with pre-defined categories including Food, Transport, Rent, Utilities, Entertainment, Shopping, Salary, and Investment. You can also create custom categories in Settings.'
      },
      {
        question: 'How do I filter transactions?',
        answer: 'On the Transactions page, use the filter dropdown to select a specific category. You can also filter by date range using the date selector on your dashboard.'
      }
    ],
    'budgets': [
      {
        question: 'How do I create a budget?',
        answer: 'Navigate to Budgets > Create New Budget. Select a category, set your budget limit for the month, and choose the time period. You\'ll receive alerts when you\'re approaching your limit.'
      },
      {
        question: 'Can I set multiple budgets?',
        answer: 'Yes! You can create separate budgets for different categories. This helps you track spending across various areas of your finances.'
      },
      {
        question: 'What happens when I exceed my budget?',
        answer: 'When you reach 80% of your budget, you\'ll see a warning. If you exceed 100%, you\'ll receive an alert prompting you to review your spending.'
      },
      {
        question: 'Can I edit my budget limits?',
        answer: 'Absolutely! Go to Budgets, find the budget you want to modify, and click the edit icon. You can change the category, limit, and time period.'
      }
    ],
    'reports': [
      {
        question: 'What reports can I generate?',
        answer: 'You can generate reports showing your income vs expenses, expense breakdown by category, monthly trends, and savings progress. These reports help you understand your financial behavior.'
      },
      {
        question: 'Can I export my reports?',
        answer: 'Yes! Click the "Export" button on the Reports page. You can export your data as PDF or CSV files for offline analysis or record-keeping.'
      },
      {
        question: 'How far back can I view my data?',
        answer: 'You can view all your transaction history since you started using the app. There\'s no limit to how far back you can analyze your financial data.'
      },
      {
        question: 'Are the charts interactive?',
        answer: 'Yes! Hover over charts to see detailed tooltips with exact values. You can also switch between weekly and monthly views for different perspectives on your data.'
      }
    ],
    'import': [
      {
        question: 'How does SMS Import work?',
        answer: 'SMS Import automatically detects transaction messages from your bank and imports them into the app. This saves you time from manually entering each transaction.'
      },
      {
        question: 'Is SMS Import secure?',
        answer: 'Yes, SMS Import only reads messages from designated sender IDs (your bank). We don\'t access any other messages, and all data is processed locally on your device.'
      },
      {
        question: 'Which banks are supported?',
        answer: 'Currently, we support SMS parsing for major Ethiopian banks including Commercial Bank of Ethiopia, Dashen Bank, and Awash Bank. More banks coming soon!'
      },
      {
        question: 'What if my SMS isn\'t being detected?',
        answer: 'Make sure SMS Import is enabled in Settings. Also, ensure your bank messages come from the official sender ID. If issues persist, you can manually add transactions.'
      }
    ]
  };

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const filteredFaqs = searchQuery 
    ? Object.values(faqs).flat().filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs[activeCategory] || [];

  return (
    <div className="help-page">
      <div className="help-container">
        <div className="help-header">
          <h1>Help Center</h1>
          <p>Find answers to common questions and learn how to make the most of Daily Budget Tracker</p>
        </div>

        {/* Search Bar */}
        <div className="help-search">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="help-content">
          {/* Sidebar - Categories */}
          {!searchQuery && (
            <div className="help-sidebar">
              <h3>Categories</h3>
              <div className="category-list">
                {categories.map(category => (
                  <button
                    key={category.id}
                    className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.icon}
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Section */}
          <div className="faq-section">
            {searchQuery ? (
              <div className="search-results">
                <h2>Search Results</h2>
                <p className="results-count">{filteredFaqs.length} results found</p>
              </div>
            ) : (
              <div className="category-header">
                <h2>{categories.find(c => c.id === activeCategory)?.label}</h2>
                <p>Frequently asked questions about {categories.find(c => c.id === activeCategory)?.label.toLowerCase()}</p>
              </div>
            )}

            <div className="faq-list">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => (
                  <div 
                    key={index} 
                    className={`faq-item ${expandedFaq === index ? 'expanded' : ''}`}
                  >
                    <button 
                      className="faq-question"
                      onClick={() => toggleFaq(index)}
                    >
                      <span>{faq.question}</span>
                      {expandedFaq === index ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                    {expandedFaq === index && (
                      <div className="faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <FiSearch size={48} />
                  <p>No results found. Try a different search term.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="support-section">
          <div className="support-card">
            <div className="support-icon">
              <FiMessageCircle />
            </div>
            <div className="support-content">
              <h3>Still need help?</h3>
              <p>Can't find what you're looking for? Our support team is here to assist you.</p>
            </div>
            <a href="/contact" className="support-btn">
              Contact Support
              <FiExternalLink />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
