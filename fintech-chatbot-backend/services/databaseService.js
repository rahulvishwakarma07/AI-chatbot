const { User } = require('../models/User');

async function queryDatabase(message, intent, userId) {
  try {
    let results = [];
    const searchTerm = extractSearchTerm(message);

    switch (intent) {
      case 'user_info':
        if (searchTerm.toLowerCase().includes("my profile") ||
          searchTerm.toLowerCase().includes("my detail") ||
          searchTerm.toLowerCase().includes("my account")) {

          // 🔑 fetch logged-in user's details
          results = await User.findById(userId);

        } else {
          // 🔍 normal search
          results = await User.find({
            $or: [
              { name: { $regex: searchTerm, $options: 'i' } },
              { email: { $regex: searchTerm, $options: 'i' } },
              { city: { $regex: searchTerm, $options: 'i' } }
            ]
          }).limit(10);
        }
        break;
      case 'aum': // Assets Under Management
        results = await AUM.find({
          userId, // only show logged-in user’s AUM
          $or: [
            { portfolioName: { $regex: searchTerm, $options: 'i' } },
            { type: { $regex: searchTerm, $options: 'i' } }
          ]
        }).limit(10);
        break;

      case 'transaction': // User transactions
        results = await Transaction.find({
          userId,
          $or: [
            { description: { $regex: searchTerm, $options: 'i' } },
            { category: { $regex: searchTerm, $options: 'i' } }
          ]
        })
          .sort({ date: -1 }) // show latest first
          .limit(20);
        break;

      case 'client': // Clients under a user (like RM/Advisor use case)
        results = await Client.find({
          advisorId: userId,
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } },
            { city: { $regex: searchTerm, $options: 'i' } }
          ]
        }).limit(10);
        break;

      default:
        // Generic search across all collections
        const users = await User.find({
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } }
          ]
        }).limit(5);

        results = [
          ...users.map(u => ({ type: 'user', ...u.toObject() })),
        ];
    }

    return results;
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

function extractSearchTerm(message) {
  // Simple extraction - you can make this more sophisticated
  const words = message.toLowerCase().split(' ');
  const stopWords = ['find', 'search', 'show', 'get', 'data', 'information', 'about', 'ke', 'ka', 'ki', 'hai', 'ho', 'me', 'mujhe', 'all', 'list'];

  const searchTerms = words.filter(word =>
    word.length > 2 &&
    !stopWords.includes(word)
  );

  return searchTerms.join('|') || '.*'; // Use regex OR operator
}

module.exports = { queryDatabase };
