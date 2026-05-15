const Profile = require("../database/models/economy/profile");

// --------------------
// READ
// --------------------
async function getProfile(query = {}, projection = null, options = {}) {
  return await Profile.findOne(query, projection, options);
}

// ensures profile exists (useful for every command)
async function ensureProfile(userID) {
  let profile = await Profile.findOne({ userID });

  if (!profile) {
    profile = await Profile.create({
      userID,
      wallet: 0,
      bank: 0,
      inventory: [],
      padlock: {
        isActive: false,
        usesLeft: 0,
      },
      xp: 0,
      bankCapacity: 5000,
      dailyStreak: 0,
    });
  }

  return profile;
}

// --------------------
// WRITE (GENERIC)
// --------------------
async function updateProfile(query, update, options = {}) {
  return await Profile.updateOne(query, update, options);
}

// --------------------
// MONEY HELPERS
// --------------------
async function addMoney(userID, amount) {
  if (!amount || amount <= 0) return;
  return await Profile.updateOne({ userID }, { $inc: { wallet: amount } });
}

async function removeMoney(userID, amount) {
  if (!amount || amount <= 0) return;
  return await Profile.updateOne({ userID }, { $inc: { wallet: -amount } });
}

// --------------------
// FIELD HELPERS
// --------------------
async function set(userID, data) {
  return await Profile.updateOne({ userID }, { $set: data });
}

async function inc(userID, data) {
  return await Profile.updateOne({ userID }, { $inc: data });
}

// --------------------
// INVENTORY HELPERS (optional but useful)
// --------------------
async function addItem(userID, itemName, amount = 1) {
  const profile = await Profile.findOne({ userID });

  if (!profile) return;

  const existing = profile.inventory.find((i) => i.name === itemName);

  if (existing) {
    return await Profile.updateOne(
      { userID, "inventory.name": itemName },
      { $inc: { "inventory.$.amount": amount } },
    );
  }

  return await Profile.updateOne(
    { userID },
    { $push: { inventory: { name: itemName, amount } } },
  );
}

async function removeItem(userID, itemName, amount = 1) {
  return await Profile.updateOne(
    { userID, "inventory.name": itemName },
    { $inc: { "inventory.$.amount": -amount } },
  );
}

// --------------------
// EXPORTS
// --------------------
module.exports = {
  getProfile,
  ensureProfile,
  updateProfile,
  addMoney,
  removeMoney,
  set,
  inc,
  addItem,
  removeItem,
};
