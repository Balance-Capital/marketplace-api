const referralsResponse = (referrals) => ({
    referral: referrals && referrals.referral || 0,
    clicked: referrals && referrals.clicked || 0,
    joined: referrals && referrals.joined || 0,
    availableRewards: referrals && referrals.availableRewards || 0,
    pendingRewards: referrals && referrals.pendingRewards || 0,
    uses: referrals && referrals.data && referrals.data.map((item) => ({
      'refBonus': item.refBonus || null,
      'satus': item.status || 'pending',
      'referral': referrals.usersJoined.filter((r) => r.referralCode === item.referral )[0]?.referralId  || null,
      'created' : item.createdAt || null
    })),
    pagination: referrals.pagination
});

module.exports = referralsResponse;