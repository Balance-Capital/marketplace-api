const MyRewardsResponse = (item) => ({
    totalEarnings: item.totalEarnings,
    pendingEarnings: item.pendingEarnings,
    availableEarnings: item.availableEarnings,
    transactions: item.transactions,
    currency: item.currency
});

module.exports = MyRewardsResponse