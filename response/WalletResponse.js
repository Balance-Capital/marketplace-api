const WalletResponse = (item) => ({
    address: item.walletAddress,
    name: item.walletName,
    default: item.default,
    lastUpdate: item.updatedAt
});

module.exports = WalletResponse