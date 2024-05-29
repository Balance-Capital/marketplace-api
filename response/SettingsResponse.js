/* eslint-disable no-underscore-dangle */
const settingsResponse = (settings) => ({
  userId: settings._id,
  firstName: settings.firstName,
  lastName: settings.lastName,
  email: settings.email,
  avatar: settings.avatar,
  wallets: settings.wallets
});

module.exports = settingsResponse;