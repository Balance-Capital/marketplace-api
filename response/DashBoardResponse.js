const dashBoardResponse = ({dashboard,imported}) => 
     ({
        dashboard: [...dashboard.map( element =>({ 
            allStores : element.allStores,
            allOffers : element.allOffers,
            validOffers : element.validOffers,
            expiresOffers : element.expiresOffers,
            siteMapOffers : element.siteMapOffers,
            siteMapStores : element.siteMapStores,
            storesWithoutLogo: element.storesWithoutLogo,
            storesWithoutDescription: element.storesWithoutDescription,
            storesWithoutFaq: element.storesWithoutFaq,
            storesWithoutCommission: element.storesWithoutCommission,
            storesWithoutCategories: element.storesWithoutCategories,
            updatedAt : element.updatedAt,
            allActiveStores: element.allActiveStores,
            allProducts: element.allProducts,
            checkedProducts: element.checkedProducts,
            checkedOffers: element.checkedOffers,
            groupBySource: element.groupBySource
            }))
        ],
        import: [...imported.map(pos => ({
            storeDomain: pos.storeDomain,
            countOffers: pos.countOffers,
            countNewOffers: pos.countNewOffers,
            countIncomeOffers: pos.countIncomeOffers,
            countIncomeDuplicate: pos.countIncomeDuplicate,
            updatedAt: pos.updatedAt
            }))
        ]
    });

module.exports = dashBoardResponse