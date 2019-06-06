const getPersistenceAdapter = function(tableName) {
    // Determines persistence adapter to be used based on environment
    // Note: tableName is only used for DynamoDB Persistence Adapter
    //if (process.env.S3_PERSISTENCE_BUCKET) {
        // in Alexa Hosted Environment
        // eslint-disable-next-line global-require
        const s3Adapter = require('ask-sdk-s3-persistence-adapter');
        return new s3Adapter.S3PersistenceAdapter({
            bucketName: process.env.S3_PERSISTENCE_BUCKET,
        });
    //}

    // Not in Alexa Hosted Environment
    //return new ddbAdapter.DynamoDbPersistenceAdapter({
    //    tableName: tableName,
    //    createTable: true,
    //});
};

const axios = require('axios');
const productData = (async function() {
// =====================================================================================================
// --------------------------------- Section 1. Data and Text strings  ---------------------------------

    const fallbackdata = [
        { productCode: "AME", productName: "Africa & Middle East Fund", ticker: "TRAMX", cusip: "77956H740", shareClass: "Investor Class", assetClass: "Equity", coreCategory: "International Equity/Multi-Cap", "price": "$9.07", morningStarRating: "3", portfolioManager: "Oliver Bell", totalNetOfAssets: "$135.5m", investmentObjective: "The fundFinder seeks long-term growth of capital by investing primarily in the common stocks of companies located (or with primary operations) in Africa and the Middle East." },
        { productCode: "BCG", productName: "Blue Chip Growth Fund", ticker: "TRBCX", cusip: "77954Q106", shareClass: "Investor Class", assetClass: "Equity", coreCategory: "Equity/Large-Cap", "price": "$110.18", morningStarRating: "5", portfolioManager: "Larry Puglia", totalNetOfAssets: "$63.3b", investmentObjective: "The fundFinder seeks to provide long-term capital growth. Income is a secondary objective." },
        { productCode: "BCA", productName: "Blue Chip Growth Fund - Advisor Class", ticker: "PABGX", cusip: "77954Q205", shareClass: "Advisor Class", assetClass: "Equity", coreCategory: "Equity/Large-Cap", "price": "$108.25", morningStarRating: "5", portfolioManager: "Larry Puglia", totalNetOfAssets: "$63.3b", investmentObjective: "The fundFinder seeks to provide long-term capital growth. Income is a secondary objective." },
        { productCode: "BCI", productName: "Blue Chip Growth Fund - I Class", ticker: "TBCIX", cusip: "77954Q403", shareClass: "I Class", assetClass: "Equity", coreCategory: "Equity/Large-Cap", "price": "$110.34", morningStarRating: "5", portfolioManager: "Larry Puglia", totalNetOfAssets: "$63.3b", investmentObjective: "The fundFinder seeks to provide long-term capital growth. Income is a secondary objective." },
        { productCode: "BCR", productName: "Blue Chip Growth Fund - R Class", ticker: "RRBGX", cusip: "77954Q304", shareClass: "R Class", assetClass: "Equity", coreCategory: "Equity/Large-Cap", "price": "$103.91", morningStarRating: "5", portfolioManager: "Larry Puglia", totalNetOfAssets: "$63.3b", investmentObjective: "The fundFinder seeks to provide long-term capital growth. Income is a secondary objective." },
        { productCode: "GFA", productName: "Global Allocation Fund - Advisor Class", ticker: "PAFGX", cusip: "87281T202", shareClass: "Advisor Class", assetClass: "Asset Allocation", coreCategory: "/Asset Allocation/Multi-Asset", "price": "$12.40", morningStarRating: "5", portfolioManager: "Charles M. Shriver", totalNetOfAssets: "$688.8m", investmentObjective: "The Fund seeks long-term capital appreciation and income." },
        { productCode: "R3A", productName: "Retirement 2010 Fund - R Class", ticker: "RRTAX", cusip: "74149P606", shareClass: "R Class", assetClass: "Target Date", coreCategory: "/Target Date/Retirement Date", "price": "$17.13", morningStarRating: "4", portfolioManager: "Jerome Clark", totalNetOfAssets: "$4.1b", investmentObjective: "The fundFinder seeks the highest total return over time consistent with an emphasis on both capital growth and income." },
        { productCode: "GUA", productName: "Dynamic Global Bond Fund - Advisor Class", ticker: "PAIEX", cusip: "77956H567", shareClass: "Advisor Class", assetClass: "Fixed Income", coreCategory: "/Fixed Income/International", "price": "$9.43", morningStarRating: "1", portfolioManager: "Arif Husain", totalNetOfAssets: "$4.2b", investmentObjective: "The fundFinder seeks high current income." },
        { productCode: "SPF", productName: "Spectrum International Fund", ticker: "PSILX", cusip: "779906304", shareClass: "Investor Class", assetClass: "Asset Allocation", coreCategory: "/Asset Allocation/Multi-Asset", "price": "$12.60", morningStarRating: "5", portfolioManager: "Charles M. Shriver", totalNetOfAssets: "$1.5b", investmentObjective: "The fundFinder seeks long-term capital appreciation." },
        { productCode: "EMF", productName: "Emerging Markets Stock Fund", ticker: "PRMSX", cusip: "77956H864", shareClass: "Investor Class", assetClass: "Asset Allocation", coreCategory: "/Asset Allocation/Multi-Asset", "price": "$40.20", morningStarRating: "5", portfolioManager: "Gonzalo Pangaro", totalNetOfAssets: "$13.2b", investmentObjective: "The fundFinder seeks long-term growth of capital through investments primarily in the common stocks of companies located (or with primary operations) in emerging markets." },
        { productCode: "GCF", productName: "Global Consumer Fund", ticker: "PGLOX", cusip: "77956H344", shareClass: "Investor Class", assetClass: "Equity", coreCategory: "/International Equity/Sector", "price": "$12.21", morningStarRating: "3", portfolioManager: "Jason Nogueira", totalNetOfAssets: "$19.9m", investmentObjective: "The fundFinder seeks to provide long-term capital growth." }
    ];
    let data = fallbackdata;
    try {
        const response = await axios.get('https://fund-service-bucket.s3.amazonaws.com/funddata.json');
        console.log(`Fund data call - statusCode: ${response.status}`);

        if (response.status >= 200 && response.status < 203) {
            console.log ('Setting the data');
            data = response.data; // or return a custom object using properties from response
        }
    } catch (error) {
        // If the promise rejects, an error will be thrown and caught here
        console.error('Going to fallback data, major error and fund data cannot be fetched.' + JSON.stringify(error));
    }

    return data;

});

const getFundsDynamicSlot = (async function() {
// =====================================================================================================
// --------------------------------- Section 1. Data and Text strings  ---------------------------------

    let data = '';

    try {
        const response = await axios.get('https://fund-service-bucket.s3.amazonaws.com/dynamic-slot-type-funddata.json');
        console.log(`Dynamic slot call - statusCode: ${response.status} `);

        if (response.status >= 200 && response.status < 203) {
            data = response.data; // or return a custom object using properties from response
        }
    } catch (error) {
        // If the promise rejects, an error will be thrown and caught here
        console.error('Going to fallback data, major error and fund data cannot be fetched.' + JSON.stringify(error));
    }

    return data;

});



const searchDatabase = function(dataset, searchQuery, searchType) {
    let matchFound = false;
    let results = [];

    //beginning search
    for (let i = 0; i < dataset.length; i++) {
        let dataValue = (dataset[i][searchType] || '').toLowerCase();
        if (sanitizeSearchQuery(searchQuery) === dataValue) {
            results.push(dataset[i]);
            matchFound = true;
            console.log('matched! ' + dataValue );
        }
        if ((i === dataset.length - 1) && (matchFound === false)) {
            //this means that we are on the last record, and no match was found
            matchFound = false;
            console.log("no match was found using " + searchType);
            //if more than searchable items were provided, set searchType to the next item, and set i=0
            //ideally you want to start search with lastName, then firstname, and then cityName
        }
    }
    return {
        count: results.length,
        results: results
    };
};

module.exports = {
    productData : productData,
    fetchFundDynamicSlot : getFundsDynamicSlot,
    persistenceAdapter : getPersistenceAdapter
} ;

