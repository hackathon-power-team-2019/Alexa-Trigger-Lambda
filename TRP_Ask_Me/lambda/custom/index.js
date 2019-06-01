"use strict";
const Alexa = require("alexa-sdk"); // import the library
const https = require('https');
const axios = require('axios');
const SPEECH = require('./handlers/speechUtil');
const startSearchHandlers = require('./handlers/startSearchHandlers');


const APP_ID = "amzn1.ask.skill.256760c6-f794-41d1-a173-d347db50e00e";

// =====================================================================================================
// --------------------------------- Section 1. Data and Text strings  ---------------------------------

const data = [
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

//======================================================================================================
//TODO: Replace these text strings to edit the welcome and help messages
//======================================================================================================



//This is the message a user will hear when they ask Alexa for help in your skill.
const HELP_MESSAGE = "I can help you find and subscribe to T. Rowe Price Mutual Funds.";





//TODO
const DESCRIPTION_STATE_HELP_MESSAGE = "Here are some things you can say: Tell me more, or give me his or her contact info";

//TODO
const MULTIPLE_RESULTS_STATE_HELP_MESSAGE = "Sorry, please say the first and last name of the person you'd like to learn more about";



//This is the message a user will hear when they try to cancel or stop the skill.
const EXIT_SKILL_MESSAGE = "We go beyond the numbers. Goodbye.";



const description = 'What would you like to know about today?';

// =====================================================================================================
// ------------------------------ Section 2. Skill Code - Intent Handlers  -----------------------------
// =====================================================================================================
// CAUTION: Editing anything below this line might break your skill.
//======================================================================================================


const states = require('./handlers/ConstStates');



let multipleSearchResultsHandlers = Alexa.CreateStateHandler(states.MULTIPLE_RESULTS, {

    "AMAZON.StartOverIntent": function () {
        this.handler.state = states.SEARCHMODE;
        var output = "Ok, starting over. " + SPEECH.getGenericHelpMessage(data);
        this.response.speak(output).listen(output);
        this.emit(':responseReady');
    },
    "AMAZON.YesIntent": function () {
        var output = "Hmm. I think you said - yes, but can you please say the name of the person you'd like to learn more about?";
        this.response.speak(output).listen(output);
        this.emit(':responseReady');
    },
    "AMAZON.NoIntent": function () {
        this.response.speak(SHUTDOWN_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.RepeatIntent": function () {
        this.response.speak(this.attributes.lastSearch.lastSpeech).listen(this.attributes.lastSearch.lastSpeech);
        this.emit(':responseReady');
    },
    "SearchByFundIntent": function () {
        this.handler.state = states.SEARCHMODE;
        this.emitWithState("SearchByFundIntent");
    },
    "AMAZON.HelpIntent": function () {
        this.response.speak(MULTIPLE_RESULTS_STATE_HELP_MESSAGE).listen(MULTIPLE_RESULTS_STATE_HELP_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.StopIntent": function () {
        this.response.speak(EXIT_SKILL_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.CancelIntent": function () {
        this.response.speak(EXIT_SKILL_MESSAGE);
        this.emit(':responseReady');
    },
    "getSubscribedFunds": function() {
        this.handler.state = states.ACTION;
        this.emitWithState("getSubscribedFunds");
    },
    "SessionEndedRequest": function () {
        this.emit("AMAZON.StopIntent");
    },
    "Unhandled": function () {
        console.log("Unhandled intent in multipleSearchResultsHandlers");
        this.response.speak(MULTIPLE_RESULTS_STATE_HELP_MESSAGE).listen(MULTIPLE_RESULTS_STATE_HELP_MESSAGE);
        this.emit(':responseReady');
    }
});
let descriptionHandlers = Alexa.CreateStateHandler(states.DESCRIPTION, {
    "TellMeMoreIntent": function () {
        let product;
        let speechOutput;
        let repromptSpeech;
        let cardContent;

        if (this.attributes.lastSearch) {
            product = this.attributes.lastSearch.results[0];
            cardContent = generateCard(product); //calling the helper function to generate the card content that will be sent to the Alexa app.
            speechOutput = generateTellMeMoreMessage(product);
            repromptSpeech = "Would you like to find another evangelist? Say yes or no";

            console.log("the contact you're trying to find more info about is " + product.productName);
            this.handler.state = states.SEARCHMODE;
            this.attributes.lastSearch.lastSpeech = speechOutput;
            this.response.cardRenderer(cardContent.title, cardContent.body, cardContent.image);
            this.response.speak(speechOutput).listen(repromptSpeech);
        }
        else {
            speechOutput = SPEECH.getGenericHelpMessage(data);
            repromptSpeech = SPEECH.getGenericHelpMessage(data);
            this.handler.state = states.SEARCHMODE;
            this.response.speak(speechOutput).listen(repromptSpeech);
        }

        this.emit(':responseReady');
    },
    "TellMeThisIntent": function () {
        let slots = this.event.request.intent.slots;
        let product = this.attributes.lastSearch.results[0];
        let infoType = isSlotValid(this.event.request, "infoType");
        let speechOutput;
        let repromptSpeech;
        let cardContent;

        console.log(isInfoTypeValid("github"));

        if (this.attributes.lastSearch && isInfoTypeValid(infoType)) {
            product = this.attributes.lastSearch.results[0];
            cardContent = generateCard(product);
            speechOutput = generateSpecificInfoMessage(slots, product);
            repromptSpeech = "Would you like to find another evangelist? Say yes or no";
            this.handler.state = states.SEARCHMODE;
            this.attributes.lastSearch.lastSpeech = speechOutput;
            this.response.cardRenderer(cardContent.title, cardContent.body, cardContent.image);
            this.response.speak(speechOutput).listen(repromptSpeech);
        } else {
            //not a valid slot. no card needs to be set up. respond with simply a voice response.
            speechOutput = generateSearchHelpMessage(product.productCode);
            repromptSpeech = "Ask me something useful";
            // repromptSpeech = "You can ask me - what's " + genderize("his-her", product.gender) + " twitter, or give me " + genderize("his-her", person.gender) + " git-hub username";
            this.attributes.lastSearch.lastSpeech = speechOutput;
            this.handler.state = states.SEARCHMODE;
            this.response.speak(speechOutput).listen(repromptSpeech);
        }
        this.emit(':responseReady');
    },
    "SearchByFundIntent": function () {
        searchByFundIntentHandler.call(this);
    },
    "AMAZON.HelpIntent": function () {
        var person = this.attributes.lastSearch.results[0];
        this.response.speak(generateNextPromptMessage(person, "current")).listen(generateNextPromptMessage(person, "current"));
        this.emit(':responseReady');
    },
    "AMAZON.StopIntent": function () {
        this.response.speak(EXIT_SKILL_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.CancelIntent": function () {
        this.response.speak(EXIT_SKILL_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.NoIntent": function () {
        this.response.speak(SHUTDOWN_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.YesIntent": function () {
        this.emit("TellMeMoreIntent");
    },
    "AMAZON.RepeatIntent": function () {
        this.response.speak(this.attributes.lastSearch.lastSpeech).listen(this.attributes.lastSearch.lastSpeech);
        this.emit(':responseReady');
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = states.SEARCHMODE;
        var output = "Ok, starting over. " + SPEECH.getGenericHelpMessage(data);
        this.response.speak(output).listen(output);
        this.emit(':responseReady');
    },
    "getSubscribedFunds": function() {
        this.handler.state = states.ACTION;
        this.emitWithState("getSubscribedFunds");
    },
    "SessionEndedRequest": function () {
        this.emit("AMAZON.StopIntent");
    },
    "Unhandled": function () {
        let person = this.attributes.lastSearch.results[0];
        console.log("Unhandled intent in DESCRIPTION state handler");
        this.response.speak("Sorry, I don't know that" + generateNextPromptMessage(person, "general"))
            .listen("Sorry, I don't know that" + generateNextPromptMessage(person, "general"));
        this.emit(':responseReady');
    }
});

let actionHandlers = Alexa.CreateStateHandler(states.ACTION, {
    "SubscribeToFund": function() {
        let product = this.attributes.lastSearch.results[0];

        this.subscribeToFund(product);
        this.response.speak("You are subscribed to the fundFinder.");
        this.emit(':responseReady');
    },
    "getSubscribedFunds": function() {
        getSubscribedFunds.call();
        this.response.speak("You are subscribed to the fundFinder.");
        this.emit(':responseReady')
    },
    "AMAZON.StopIntent": function () {
        this.response.speak(EXIT_SKILL_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.CancelIntent": function () {
        this.response.speak(EXIT_SKILL_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.NoIntent": function () {
        this.response.speak(SHUTDOWN_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.YesIntent": function () {
        this.emit("TellMeMoreIntent");
    },
    "AMAZON.RepeatIntent": function () {
        this.response.speak(this.attributes.lastSearch.lastSpeech).listen(this.attributes.lastSearch.lastSpeech);
        this.emit(':responseReady');
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = states.SEARCHMODE;
        var output = "Ok, starting over. " + SPEECH.getGenericHelpMessage(data);
        this.response.speak(output).listen(output);
        this.emit(':responseReady');
    },
    "SessionEndedRequest": function () {
        this.emit("AMAZON.StopIntent");
    },
    "Unhandled": function () {
        let person = this.attributes.lastSearch.results[0];
        console.log("Unhandled intent in DESCRIPTION state handler");
        this.response.speak("Sorry, I don't know that" + generateNextPromptMessage(person, "general"))
            .listen("Sorry, I don't know that" + generateNextPromptMessage(person, "general"));
        this.emit(':responseReady');
    }
});

// ------------------------- END of Intent Handlers  ---------------------------------

function searchDatabase(dataset, searchQuery, searchType) {
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
}

function figureOutWhichSlotToSearchBy(productName, productCode, ticker, assetClass) {
    if (productName && productName.length > 0) {
        console.log("search by productName");
        return "productName";
    }
    else if (productCode) {
        console.log("search by productCode");
        return "productCode";
    }
    else if (!ticker && productCode) {
        console.log("search by ticker");
        return "ticker";
    }
    else if (!ticker && !productCode && assetClass) {
        console.log("search by assetClass");
        return "assetClass";
    }
    else {
        console.log("no valid slot provided. can't search.");
        return false;
    }
}


function searchByInfoTypeIntentHandler() {
    var slots = this.event.request.intent.slots;
    var fundName = isSlotValid(this.event.request, "fundTerms");
    var fundAttrTypes = isSlotValid(this.event.request, "fundAttrTypes");

    var firstName = isSlotValid(this.event.request, "firstName");
    var lastName = isSlotValid(this.event.request, "lastName");
    var cityName = isSlotValid(this.event.request, "cityName");
    var infoType = isSlotValid(this.event.request, "infoType");

    var canSearch = figureOutWhichSlotToSearchBy(fundName, firstName, lastName, cityName);
    console.log("canSearch is set to = " + canSearch);

    if (canSearch) {
        var searchQuery = slots[canSearch].value;
        var searchResults = searchDatabase(data, searchQuery, canSearch);

        //saving lastSearch results to the current session
        var lastSearch = this.attributes.lastSearch = searchResults;
        var output;

        //saving last intent to session attributes
        this.attributes.lastSearch.lastIntent = "SearchByFundIntent";

        if (searchResults.count > 1) { //multiple results found
            console.log("multiple results were found");
            let listOfPeopleFound = loopThroughArrayOfObjects(lastSearch.results);
            output = generateSearchResultsMessage(searchQuery, searchResults.results) + listOfPeopleFound + ". Who would you like to learn more about?";
            this.handler.state = states.MULTIPLE_RESULTS; // change state to MULTIPLE_RESULTS
            this.attributes.lastSearch.lastSpeech = output;
            this.response.speak(output).listen(output);
        } else if (searchResults.count === 1) { //one result found
            this.handler.state = states.DESCRIPTION; // change state to description
            console.log("one match was found");
            if (infoType) {
                //if a specific infoType was requested, redirect to specificInfoIntent
                console.log("infoType was provided as well");
                let person = this.attributes.lastSearch.results[0];
                let cardContent = generateCard(person);
                let speechOutput = generateSpecificInfoMessage(slots, person);
                let repromptSpeech = "Would you like to find another evangelist? Say yes or no";
                this.attributes.lastSearch.lastSpeech = speechOutput;
                this.handler.state = states.SEARCHMODE;
                this.response.cardRenderer(cardContent.title, cardContent.body, cardContent.image);
                this.response.speak(speechOutput).listen(repromptSpeech);
                // this.emitWithState("TellMeThisIntent");
            }
            else {
                console.log("no infoType was provided.");
                output = generateSearchResultsMessage(searchQuery, searchResults.results);
                this.attributes.lastSearch.lastSpeech = output;
                // this.emit(":ask", generateSearchResultsMessage(searchQuery,searchResults.results));
                this.response.speak(output).listen(output);
            }
        }
        else {//no match found
            console.log("no match found");
            console.log("searchQuery was  = " + searchQuery);
            console.log("searchResults.results was  = " + searchResults);
            output = generateSearchResultsMessage(searchQuery, searchResults.results);
            this.attributes.lastSearch.lastSpeech = output;
            // this.emit(":ask", generateSearchResultsMessage(searchQuery,searchResults.results));
            this.response.speak(output).listen(output);
        }
    }

    this.emit(':responseReady');

}
// =====================================================================================================
// ------------------------------- Section 3. Generating Speech Messages -------------------------------
// =====================================================================================================
function generateSendingCardToAlexaAppMessage(person, mode) {
    let sentence = "I have sent " + person.productName + "'s contact card to your Alexa app" + generateNextPromptMessage(person, mode);
    return sentence;
}

function generateSearchResultsMessage(searchQuery, results) {
    let sentence;
    let details;
    let prompt;

    if (results) {
        switch (true) {
            case (results.length === 0):
                sentence = "Hmm. I couldn't find " + searchQuery + ". " + SPEECH.getGenericHelpMessage(data);
                break;
            case (results.length === 1):
                let product = results[0];
                details = product.productName + " is " + product.productCode + ", with a price of " + (Math.random() * 101).toFixed(2) + " US dollars";
                prompt = generateNextPromptMessage(product, "current");
                sentence = details + prompt;
                console.log(sentence);
                break;
            case (results.length > 1):
                sentence = "I found " + results.length + " matching results";
                break;
        }
    }
    else {
        sentence = "Sorry, I didn't quite get that. " + SPEECH.getGenericHelpMessage(data);
    }
    return sentence;
}



function generateSearchHelpMessage(gender) {
    let sentence = "Sorry, I don't know that. You can ask me - what's BCG fundFinder's price" ;
    return sentence;
}

function generateTellMeMoreMessage(product) {
    let sentence = product.productName + " current price " + (Math.random() * 101).toFixed(2) + " US dollars. " + generateSendingCardToAlexaAppMessage(product, "general");
    return sentence;
}
function generateSpecificInfoMessage(slots, product) {
    let infoTypeValue;
    let sentence;

    if (slots.infoType.value == "git hub") {
        infoTypeValue = "github";
        console.log("resetting gith hub to github");
    }
    else {
        console.log("no reset required for github");
        infoTypeValue = slots.infoType.value;
    }

    sentence = product.productName + "'s " + infoTypeValue.toLowerCase() + " is - " + person["say" + infoTypeValue.toLowerCase()] + " . Would you like to find another evangelist? " + SPEECH.getGenericHelpMessage(data);
    return optimizeForSpeech(sentence);
}


exports.handler = function (event, context, callback) {
    let alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(newSessionHandlers, startSearchHandlers, descriptionHandlers, multipleSearchResultsHandlers);
    alexa.execute();
};

// =====================================================================================================
// ------------------------------------ Section 4. Helper Functions  -----------------------------------
// =====================================================================================================
// For more helper functions, visit the Alexa cookbook at https://github.com/alexa/alexa-cookbook
//======================================================================================================

function titleCase(str) {
    return str.replace(str[0], str[0].toUpperCase());
}

function generateCard(product) {
    let cardTitle = "Product Info for " + titleCase(product.productName);
    let cardBody = "Price: " + product.price + " \n" + "Fund Manager: " + product.portfolioManager + " \n";
    /*let imageObj = {
        smallImageUrl: "https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/team-lookup/avatars/" + person.firstName + "._TTH_.jpg",
        largeImageUrl: "https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/team-lookup/avatars/" + person.firstName + "._TTH_.jpg",
    }; */
    return {
        "title": cardTitle,
        "body": cardBody,
        //"image": imageObj
    };
}

function loopThroughArrayOfObjects(arrayOfStrings) {
    let joinedResult = "";
    // Looping through the each object in the array
    for (let i = 0; i < arrayOfStrings.length; i++) {
        //concatenating names (firstName + lastName ) for each item
        joinedResult = joinedResult + ", " + arrayOfStrings[i].productName;
    }
    return joinedResult;
}

function loopThroughArrayOfFunds(arrayOfStrings) {
    const builder = new Alexa.templateBuilders.ListTemplate1Builder();
    // Looping through the each object in the array
    for (let i = 0; i < arrayOfStrings.length; i++) {
        builder.addItem(makeImage(imageURL),searchResults.results[i].cusip,arrayOfStrings[i].productName,searchResults.results[i].morningStarRating,arrayOfStrings[i].price);
    }
    return builder;
}

function sanitizeSearchQuery(searchQuery) {
    searchQuery = searchQuery.replace(/’s/g, "").toLowerCase();
    searchQuery = searchQuery.replace(/'s/g, "").toLowerCase();
    return searchQuery;
}

function optimizeForSpeech(str) {
    let optimizedString = str.replace("github", "git-hub");
    return optimizedString;
}

function isSlotValid(request, slotName) {
    let slot = request.intent.slots[slotName];
    //console.log("request = "+JSON.stringify(request)); //uncomment if you want to see the request
    let slotValue;

    //if we have a slot, get the text and store it into speechOutput
    if (slot && slot.value) {
        // strip the invalid characters (added by Shain)
        slotValue = slot.value.replace(/[^a-zA-Z0-9 ]+/g, "").toLowerCase();
        return slotValue;
    } else {
        //we didn't get a value in the slot.
        return false;
    }
}

function isInArray(value, array) {
    return array.indexOf(value) > -1;
}

function isInfoTypeValid(infoType) {
    let validTypes = ["price", "investment strategy", "net asset", "morningstar", "manager"];
    return isInArray(infoType, validTypes);
}

async function subscribeToFund(product) {
    function doRequest(url){
        return new Promise(function(resolve, reject){
            console.log('URL', url);
            
            const options = {
                hostname: 't481wdms2i.execute-api.us-east-1.amazonaws.com',
                path: '/default/add-subscription',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': 'Q6YT1r7xii7u77ZS81PVI10pKP1srWFvS98MJhZ4'
                },
                
            };
            const postData = {'emailAddress': 'idx_developers@troweprice.com', 'productCode': 'AME'}
            const req = https.request(options, (resp) => {
                let data = '';

                // A chunk of data has been received.
                resp.on('data', (chunk) => {
                    data += chunk;
                });

                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    resolve(JSON.parse(data));
                });

            }).on("error", (err) => {
                reject(err);
            });
            req.write(postData);
            req.end();
        });
    }
    if(product) {
        const URL = 'https://t481wdms2i.execute-api.us-east-1.amazonaws.com/default/add-subscription';
        const response = await doRequest(URL);
        return {
            statusCode: 200,
            body: response
        };
    }
}

function getSubscribedFunds() {

    const https = require('https');

    https.get('https://t481wdms2i.execute-api.us-east-1.amazonaws.com/default/get-subscriptions?email=jeff_beninghove@troweprice.com', (res) => {
        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);

        res.on('data', (d) => {
            process.stdout.write(d);
            console.log('dd:', d);
        });

    }).on('error', (e) => {
        console.error(e);
    });


}

function doRequest(url){
    return new Promise((resolve, reject)=>{
        console.log('URL', url);
        https.get(url, (resp) => {
            let data = '';
            console.log('LOGGING');

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                console.log(JSON.parse(data));
                resolve(JSON.parse(data));
            });

        }).on("error", (err) => {
            reject(err);
        });
    });
}

async function searchAemFundDatabase(answer) {
    if(answer) {

        async callAem(query)
        {
            let encodedQuery = encodeURIComponent(query);
            const URL = `https://www.troweprice.com/aem-services/trp/fai/sitesearch/query?query=${encodedQuery}`;
            const response = await doRequest(URL);
        };
        const bcgURL ='https://www.troweprice.com/financial-intermediary/us/en/investments/mutual-funds/us-products/blue-chip-growth-fund/jcr:content.json';
        console.log(`CALLING PART1! ${bcgURL}`);
        try {
            let resp1 = await doRequest(bcgURL);
            let productDetailsURL = `https://io9jvz0wni.execute-api.us-east-1.amazonaws.com/demo-stage?productCode=${resp1.productCode}`;
            console.log(`FINISHED p1 ${JSON.stringify(resp1)}`);

            console.log(`CALLING PART2! ${productDetailsURL}`);
            let bcgProductCodeResponse = await doRequest(productDetailsURL);
            console.log(`FINISHED p2 ${JSON.stringify(bcgProductCodeResponse)}`);
        } catch (error) {
            console.log ("Error calling to Product Code. ");
        }

        let results = [bcgProductCodeResponse];
        return {
            count: results.length,
            results: results
        };
    }
}

