const { User } = require('../models/User');
const Transaction = require('../models/Transaction')
const AUM = require('../models/PresentDaySummary')
const Client = require('../models/ClientBatch')

async function queryDatabase(intent, sub_intent, filters = {}, userId) {
  try {
    let results = [];

    switch (intent) {
      // ================= AUM =================
      case "AUM":
        if (sub_intent === "total_aum") {
          // sum of all client AUM
          results = await AUM.aggregate([
            {
              $group: {
                _id: null,
                totalAUM: { $sum: { $toDouble: "$cur_val" } }
              }
            },
            {
              $project: {
                _id: 0,       // remove _id
                totalAUM: 1   // keep only totalAUM
              }
            }
          ]);

        } else if (sub_intent === "client_aum") {
          if (!filters.clientId && !filters.clientName) {
            results = [];
          } else {
            let clientId = filters.clientId;

            // 🔹 If clientName is provided → lookup from Client collection
            if (!clientId && filters.clientName) {
              const client = await Client.findOne({ name: { $regex: filters.clientName, $options: "i" } });
              if (client) {
                clientId = client.ID; // or whatever field matches with AUM.ID
              } else {
                results = [];
              }
            }

            if (clientId) {
              results = await AUM.aggregate([
                {
                  $match: { ID: clientId }
                },
                {
                  $group: {
                    _id: "$ID",
                    totalAUM: { $sum: { $toDouble: "$cur_val" } }
                  }
                },
                {
                  $project: {
                    _id: 0,
                    clientId: "$_id",
                    totalAUM: 1
                  }
                }
              ]);
            }
          }
        }
        break;

      // ================= Client =================
      case "Client":
        if (sub_intent === "all_clients") {
          results = await Client.find(
            {},
            // only selected fields
            "ID name mobile pan email"
          ).limit(10);

        } else if (sub_intent === "client_info") {
          if (!filters.clientId && !filters.clientName) return [];
          results = await Client.find({
            ...(filters.clientId ? { ID: filters.clientId } : {}),
            ...(filters.clientName ? { name: { $regex: filters.clientName, $options: "i" } } : {})
          },
            "ID name mobile pan email" // <-- projection: only these fields
          );
        }
        break;

      // ================= Transaction =================
      case "Transaction":
        if (sub_intent === "all_transactions") {
          results = await Transaction.find({}, "ID fundDesc amt transDate").sort({ date: -1 }).limit(10);
        } else if (sub_intent === "client_transactions") {
          if (!filters.clientId) return [];

          results = await Transaction.find({
            ...(filters.clientId ? { ID: filters.clientId } : {}),
            // ...(filters.clientName ? { name: { $regex: filters.clientName, $options: "i" } } : {})
          }, "ID fundDesc amt transDate").sort({ date: -1 }).limit(10);
        }
        else if (sub_intent === "filtered_transactions") {
          let query = {};

          if (filters.clientId) query.ID = filters.clientId;
          if (filters.dateRange) {
            const from = new Date(filters.dateRange.from);
            const to = new Date(filters.dateRange.to);

            if (!isNaN(from) && !isNaN(to)) {
              query.transDate = {
                $gte: from,
                $lte: to
              };
            }
          }
          if (filters.minAmount || filters.maxAmount) {
            query.amt = {};
            if (filters.minAmount) query.amt.$gte = filters.minAmount;
            if (filters.maxAmount) query.amt.$lte = filters.maxAmount;
          }

          results = await Transaction.find(query, 'ID fundDesc amt transDate').sort({ date: -1 }).limit(10);
        }
        break;

      // ================= General =================
      default:
        results = []; // General knowledge → no DB query
    }

    return results;
  } catch (error) {
    console.error("Database query error:", error);
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


//  Define additional test queries in English and Hinglish
// test_queries = [
//     ("What’s the AUM of client Rajeev Sharma?", "English"),
//     ("Mujhe client Anjali ka AUM batao", "Hinglish"),
//     ("How much total AUM do we manage?", "English"),
//     ("Total AUM kitna hai sab clients ka?", "Hinglish"),
//     ("Give details of client ID 2005.", "English"),
//     ("Client ID 2005 ke details dikhayein", "Hinglish"),
//     ("List all registered clients.", "English"),
//     ("Sab clients ke naam dikhao", "Hinglish"),
//     ("Show last 10 transactions for client Ramesh.", "English"),
//     ("Client Ramesh ke last 10 transactions dikhao", "Hinglish"),
//     ("Give me all recent transactions.", "English"),
//     ("Recent wale sabhi transactions dikhao", "Hinglish"),
//     ("Show transactions above ₹50,000 between June and August.", "English"),
//     ("₹50,000 se upar ke transactions dikhayein June se August ke beech", "Hinglish"),
//     ("What is SIP and how does it work?", "English"),
//     ("SIP kya hota hai aur kaise kaam karta hai?", "Hinglish"),
//     ("What's the latest cricket score?", "English"),
//     ("Cricket ka score kya hai abhi?", "Hinglish"),
// ]
