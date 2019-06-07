/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
var https = require('https');


const GetSubscribedProductsHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest' ||
            (request.type === 'IntentRequest' &&
                request.intent.name === 'GetSubscribedProductsIntent');
    },
    async handle(handlerInput) {
        const URL = `https://t481wdms2i.execute-api.us-east-1.amazonaws.com/default/get-subscriptions?email=lulu@l.com`;
        const response = await doRequest(URL);
        const numberProducts = response.Count;
        var i;
        var productCodes = [];
        var productNames = [];
        var speechOutput = " You are currently subscribed to " + numberProducts + " investment products: ";
        var videoOutput = " You are currently subscribed to " + numberProducts + " investment products: ";
        var videoOutputList ="1. "
        var number = 1;
        for (i = 0; i < response.Items.length; i++) {
            productCodes[i] = response.Items[i].productCode;
            if (response.Items[i].productName != undefined) {
                productNames[i] = response.Items[i].productName;
            }
            else { productNames[i] = response.Items[i].productCode; }
            if (i != response.Items.length - 1) {
                number = number+1;
                speechOutput += productNames[i] + " and ";
                videoOutputList += productNames[i].toUpperCase() + "." + "\n" + number
            }
            else {
                speechOutput += productNames[i] + ".";
                videoOutputList += ". " + productNames[i].toUpperCase() + ".";
            }
        }

        speechOutput += '<break time="2s"/>Is there anything else I can do for you?';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .withSimpleCard(videoOutput, videoOutputList)
            .getResponse();
    },
};

const SubscribeToProductHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest' ||
            (request.type === 'IntentRequest' &&
                request.intent.name === 'SubscribeToProductIntent');
    },
    async handle(handlerInput) {
        console.log("In SubscribeToProductHandler handle function");
        const URL = `https://t481wdms2i.execute-api.us-east-1.amazonaws.com/default/add-subscription`;

        // getting user's input for slot fundName from AlexSkill from the request
        const request = handlerInput.requestEnvelope.request;
        var fundName = (request.intent.slots.productName.value ? request.intent.slots.productName.value.toLowerCase() : null);
        console.log("fundName: " + fundName);

        const response = await doPostRequest(URL, fundName);
        var speechOutput = ' You are subscribed to the ' + fundName + '<break time="2s"/>Is there anything else I can do for you?';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .withSimpleCard(SKILL_NAME, speechOutput)
            .getResponse();
    },
};

const DeleteProductHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest' ||
            (request.type === 'IntentRequest' &&
                request.intent.name === 'DeleteProductIntent');
    },
    async handle(handlerInput) {
        console.log("In DeleteProductHandler handle function");
        const URL = `https://t481wdms2i.execute-api.us-east-1.amazonaws.com/default/delete-subscription`;
        // hardcoded fund name to be replaced by the value of slot value of productName from AlexaSkill

        // getting user's input for slot fundName from AlexSkill from the request
        const request = handlerInput.requestEnvelope.request;
        var fundName = (request.intent.slots.productName.value ? request.intent.slots.productName.value.toLowerCase() : null);
        console.log("fundName: " + fundName);

        //remove the fund name from the fund subscriptions
        const response = await doDeleteRequest(URL, fundName);
        var speechOutput = fundName + " has been removed from your subscriptions" + ' <break time="2s"/>Is there anything else I can help with?';
        var videoOutput = fundName + " has been removed from your subscriptions"

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .withSimpleCard(SKILL_NAME, videoOutput)
            .getResponse();
    },
};

const WhatIsNewHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest' ||
            (request.type === 'IntentRequest' &&
                request.intent.name === 'WhatIsNewIntent');
    },
    async handle(handlerInput) {
        const URL = `https://t481wdms2i.execute-api.us-east-1.amazonaws.com/default/get-subscription-what-is-new?email=lulu@l.com`;
        const response = await doWhatIsNewRequest(URL);
        const numberNewArticles = response.Count;
        var i;
        var articleName = [];
        var speechOutput;
        var videoOutput;

        if (numberNewArticles == 1) {
            speechOutput = " You have 1 new article from your subscribed insight collections. ";
            speechOutput += "Article: " + response.Items[0].articleName.S + " from the insight collection: " + response.Items[0].collectionName.S + ". Authored by: " +
                response.Items[0].authorName.S + ", published on " + response.Items[0].publishDate.S;
            videoOutput = speechOutput;
            speechOutput += ' <break time="1s"/>Would you like me to read you the summary of the article?';

        }
        else {
            speechOutput = " You have " + numberNewArticles + " new articles from your subscribed insight collections. ";
            videoOutput = speechOutput;
            for (i = 0; i < response.Items.length; i++) {
                articleName[i] = response.Items[i].articleName.S;
                speechOutput += "Article " + (i + 1) + ": " + response.Items[i].articleName.S + " from the insight collection: " + response.Items[i].collectionName.S + ". Authored by: " +
                    response.Items[i].authorName.S + ", published on " + response.Items[i].publishDate.S;
                videoOutput += "\n" + "Article " + (i + 1) + ": " + response.Items[i].articleName.S + " from the insight collection: " + response.Items[i].collectionName.S + ". Authored by: " +
                    response.Items[i].authorName.S + ", published on " + response.Items[i].publishDate.S;
            }
            speechOutput += ' <break time="1s"/>Would you like me to read you the summary of the first article?';
        }

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .withSimpleCard(SKILL_NAME, videoOutput)
            .getResponse();
    },
};

const WhatIsNewAnswerHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest' ||
            (request.type === 'IntentRequest' &&
                request.intent.name === 'WhatIsNewAnswerIntent');
    },
    async handle(handlerInput) {
        console.log("in WhatIsNewAnswerHandler handle().");
        var speechText;
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const answer = slots['answer'].value;
        console.log("answer: " + answer);

        var yes = answer == 'yes';
        if (yes) {
            console.log("answer is yes? " + yes);
            const URL = `https://t481wdms2i.execute-api.us-east-1.amazonaws.com/default/get-subscription-what-is-new?email=lulu@l.com`;
            const response = await doWhatIsNewRequest(URL);
            const summary = response.Items[0].summary.S;
            speechText = `summary: ${summary}.`;
            speechText += '<break time="2s"/>Is there anything else I can help with?';
        }
        else {
            console.log("In else. ");
            speechText = `Your answered ${answer}. Thanks for using T Rowe Price US Intermediary subscriptions. Have a great day! Goodbye.`;
        }
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('What did I learn', speechText)
            .getResponse();
    },
};

function doRequest(url) {
    return new Promise(function(resolve, reject) {
        console.log('URL', url);
        https.get(url, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
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
    });
}

function doPostRequest(url, fundName) {
    return new Promise(function(resolve, reject) {
        console.log('In doPostRequest(), Post to URL', url);
        var postData = JSON.stringify({
            'email': 'lulu@l.com',
            'productCode': fundName
        });
        console.log('postData', postData);

        var options = {
            hostname: 't481wdms2i.execute-api.us-east-1.amazonaws.com',
            port: 443,
            path: '/default/add-subscription',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        };
        console.log('options', options);

        var req = https.request(options, (res) => {
            console.log('In https.request().');
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);

            res.on('data', (d) => {
                process.stdout.write(d);
            });
        });

        req.on('error', (e) => {
            console.error(e);
        });

        resolve(req.write(postData));
        req.end();
    });
}

function doDeleteRequest(url, fundName) {
    return new Promise(function(resolve, reject) {
        console.log('In doPostRequest(), Post to URL', url);
        var requestData = JSON.stringify({
            'email': 'lulu@l.com',
            'productCode': fundName
        });
        console.log('requestData', requestData);

        var options = {
            hostname: 't481wdms2i.execute-api.us-east-1.amazonaws.com',
            port: 443,
            path: '/default/delete-subscription',
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': requestData.length
            }
        };
        console.log('options', options);

        var req = https.request(options, (res) => {
            console.log('In https.request().');
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);

            res.on('data', (d) => {
                process.stdout.write(d);
            });
        });

        req.on('error', (e) => {
            console.error(e);
        });

        resolve(req.write(requestData));
        req.end();
    });
}

function doWhatIsNewRequest(url) {
    return new Promise(function(resolve, reject) {
        console.log('URL', url);
        https.get(url, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
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
    });
}

const HelpHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' &&
            request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(HELP_MESSAGE)
            .reprompt(HELP_REPROMPT)
            .getResponse();
    },
};

const ExitHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' &&
            (request.intent.name === 'AMAZON.CancelIntent' ||
                request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(STOP_MESSAGE)
            .getResponse();
    },
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

        return handlerInput.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('Sorry, an error occurred.')
            .reprompt('Sorry, an error occurred.')
            .getResponse();
    },
};

const SKILL_NAME = 'Space Facts';
const GET_FACT_MESSAGE = 'Here\'s your fact: ';
const HELP_MESSAGE = 'You can say tell me a space fact, or, you can say exit... What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';

const data = [
    'A year on Mercury is just 88 days long.',
    'Despite being farther from the Sun, Venus experiences higher temperatures than Mercury.',
    'Venus rotates counter-clockwise, possibly because of a collision in the past with an asteroid.',
    'On Mars, the Sun appears about half the size as it does on Earth.',
    'Earth is the only planet not named after a god.',
    'Jupiter has the shortest day of all the planets.',
    'The Milky Way galaxy will collide with the Andromeda Galaxy in about 5 billion years.',
    'The Sun contains 99.86% of the mass in the Solar System.',
    'The Sun is an almost perfect sphere.',
    'A total solar eclipse can happen once every 1 to 2 years. This makes them a rare event.',
    'Saturn radiates two and a half times more energy into space than it receives from the sun.',
    'The temperature inside the Sun can reach 15 million degrees Celsius.',
    'The Moon is moving approximately 3.8 cm away from our planet every year.',
];

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
    .addRequestHandlers(
        GetSubscribedProductsHandler,
        SubscribeToProductHandler,
        WhatIsNewHandler,
        WhatIsNewAnswerHandler,
        DeleteProductHandler,
        HelpHandler,
        ExitHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
