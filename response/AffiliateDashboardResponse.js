const AffiliateDashboardResponse = (item) => ({
    userName: item.userName,
    availableBalance: item.availableBalance,
    pendingCommission: item.pendingCommission,
    linkClicks: item.linkClicks,
    conversions: item.conversions,
    activity: item.activity,
    pagination: item.pagination,
    currency: item.currency
});

module.exports = AffiliateDashboardResponse