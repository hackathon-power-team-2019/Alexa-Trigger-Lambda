"use strict";
const Alexa = require("ask-sdk-core"); // import the library
const https = require('https');

const SPEECH = require('./handlers/speechUtil');

//const newSessionHandlers = require('./handlers/newSessionHandlers');
//const PERMISSIONS = ['alexa::profile:name:read', 'alexa::profile:email:read'];

const APP_ID = "amzn1.ask.skill.256760c6-f794-41d1-a173-d347db50e00e";

// =====================================================================================================
// --------------------------------- Section 1. Data and Text strings  ---------------------------------

const dsRequire = require('./datasource');
const data = dsRequire[0];
const persistenceAdapter = dsRequire[1];

// =====================================================================================================
// ------------------------------ Section 2. Skill Code - Intent Handlers  -----------------------------
// =====================================================================================================
// CAUTION: Editing anything below this line might break your skill.
//======================================================================================================


const states = require('./handlers/ConstStates');

// ------------------------- END of Intent Handlers  ---------------------------------


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

function generateSearchHelpMessage() {
    let sentence = "Sorry, I don't know that. You can ask me - what's BCG's price" ;
    return sentence;
}

function generateTellMeMoreMessage(product) {
    let sentence = product.productName + " current price " + (Math.random() * 101).toFixed(2) + " US dollars. " + generateSendingCardToAlexaAppMessage(product, "general");
    return sentence;
}


function generateSpecificInfoMessage(slots, product) {
    return product.productName + "'s " + infoQuery.toLowerCase() + " is - " + product[infoQuery.toLowerCase()] + " . Would you like to know anything else about this fund? " + getGenericHelpMessage(data); ;
}

const alexaNewSession = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'NewSession';
    },
    handle(handlerInput) {
        // if(Object.keys(this.attributes).length === 0) { // Check if it's the first time the skill has been invoked
        //     this.attributes['endedSessionCount'] = 0;
        //     this.attributes['savedFunds'] = [];
        // }
        this.handler.state = states.SEARCHMODE;
        this.response.speak("Hello ");

        this.emit(':responseReady');

        let response = axios.get("https://fund-service-bucket.s3.amazonaws.com/dynamic-slot-type-funddata.json");
        return handlerInput.responseBuilder
            .addDirective(response.data)
            .getResponse();
    }
};

// core functionality for fact skill
const GetNewFactHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        // checks request type
        return request.type === 'LaunchRequest'
            || (request.type === 'IntentRequest'
                && request.intent.name === 'GetNewFactIntent');
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        // gets a random fact by assigning an array to the variable
        // the random item from the array will be selected by the i18next library
        // the i18next library is set up in the Request Interceptor
        const randomFact = requestAttributes.t('FACTS');
        // concatenates a standard message with the random fact
        const speakOutput = requestAttributes.t('GET_FACT_MESSAGE') + randomFact;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            // Uncomment the next line if you want to keep the session open so you can
            // ask for another fact without first re-opening the skill
            // .reprompt(requestAttributes.t('HELP_REPROMPT'))
            .withSimpleCard(requestAttributes.t('SKILL_NAME'), randomFact)
            .getResponse();
    },
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(alexaNewSession,
        //require('./handlers/newSessionHandlers'),
        //require('./handlers/startSearchHandlers'),
        require('./handlers/subscriber/SubscribeToFund')
        /*descriptionHandlers, multipleSearchResultsHandlers */
    )//.addErrorHandlers(ErrorHandler)
    .withPersistenceAdapter(persistenceAdapter('TRPAskMeAttributes'))
    .lambda();


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
