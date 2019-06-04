"use strict";
const Alexa = require("alexa-sdk"); // import the library
const https = require('https');

const SPEECH = require('./handlers/speechUtil');
const startSearchHandlers = require('./handlers/startSearchHandlers');
const newSessionHandlers = require('./handlers/newSessionHandlers');
//const newSessionHandlers = require('./handlers/newSessionHandlers');
//const PERMISSIONS = ['alexa::profile:name:read', 'alexa::profile:email:read'];

const APP_ID = "amzn1.ask.skill.256760c6-f794-41d1-a173-d347db50e00e";

// =====================================================================================================
// --------------------------------- Section 1. Data and Text strings  ---------------------------------

const data = require('./datasource');

//======================================================================================================
//TODO: Replace these text strings to edit the welcome and help messages
//======================================================================================================


//This is the message a user will hear when they try to cancel or stop the skill.
const EXIT_SKILL_MESSAGE = "We go beyond the numbers. Goodbye.";


// =====================================================================================================
// ------------------------------ Section 2. Skill Code - Intent Handlers  -----------------------------
// =====================================================================================================
// CAUTION: Editing anything below this line might break your skill.
//======================================================================================================


const states = require('./handlers/ConstStates');

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


const alexaNewSession = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'NewSession';
    },
    handle(handlerInput) {

        let response = axios.get("https://fund-service-bucket.s3.amazonaws.com/dynamic-slot-type-funddata.json");
        return handlerInput.responseBuilder
            .addDirective(response.data)
            .getResponse();
    }
};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = APP_ID;
    alexa.registerHandlers(alexaNewSession, newSessionHandlers, startSearchHandlers /*descriptionHandlers, multipleSearchResultsHandlers */);
    alexa.dynamoDBTableName = 'TRPAskMe';
    alexa.execute();
};

// =====================================================================================================
// ------------------------------------ Section 4. Helper Functions  -----------------------------------
// =====================================================================================================
// For more helper functions, visit the Alexa cookbook at https://github.com/alexa/alexa-cookbook
//======================================================================================================


function loopThroughArrayOfObjects(arrayOfStrings) {
    let joinedResult = "";
    // Looping through the each object in the array
    for (let i = 0; i < arrayOfStrings.length; i++) {
        //concatenating names (firstName + lastName ) for each item
        joinedResult = joinedResult + ", " + arrayOfStrings[i].productName;
    }
    return joinedResult;
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

/*
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

*/