/* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable  no-use-before-define */

const Alexa = require('ask-sdk-core');
const https = require('https');
const messages = require('./handlers/speechUtil');

const SKILL_NAME = 'Trusty Alexa';
const backgroundURL  = 'https://www.troweprice.com/content/dam/tpd/Images/C6YX9WAX6_TPD_Homepage%20Background%20Image_1987px%20x%201200px_180905.jpg';

// 1. Handlers ===================================================================================

const { productData, fetchFundDynamicSlot, lookupProductCode, subscribeUserToFund, unsubscribeUserToFund, doRequest } = require('./datasource');
const data = productData();

const LaunchHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const requestAttributes = attributesManager.getRequestAttributes();

        const speechOutput = `${requestAttributes.t('WELCOME')} ${requestAttributes.t('HELP')} `;

        const hasDisplay = false; //supportsDisplay(handlerInput);
        if (hasDisplay) {
            // let builder = new Alexa.templateBuilders.BodyTemplate1Builder();
            // const template = builder.setTitle("Hello from Trusty Alexa, T. Rowe Price")
            //     .setBackgroundImage(makeImage(backgroundURL))
            //     .setTextContent(makeRichText('' + description + ''), null, null)
            //     .build();

            responseBuilder.addRenderTemplateDirective({
                type: 'BodyTemplate1',
                backButton: 'visible',
                image,
                backgroundImage : backgroundURL,
                title : 'Trusty Alexa',
                textContent: 'The most awesome and trusted skill.',
            });
        }

        return responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .getResponse();
    },
};

function concat(...args) {
    return args.reduce((acc, val) => [...acc, ...val]);
}

function getFundsFromRequest(fundType) {
    let fundSlotDetails = fundType.resolutions.resolutionsPerAuthority.filter( (authority) => {
        return authority.hasOwnProperty("values") && authority.values.length > 0;
    }).map( (authority) => { return authority.values; });

    return concat(fundSlotDetails)
        .map( (arr) => { return Array.isArray(arr) ? arr[0] : arr; })
        .filter( (o) => { return o.hasOwnProperty("value");} )
        .map( (o) => { return o.value; } );
}

const SearchByFundIntent = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'SearchByFundIntent'
            && request.dialogState === 'COMPLETED';
    },
    async handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        let responseBuilder = handlerInput.responseBuilder;
        const request = handlerInput.requestEnvelope.request;
        const slots = request.intent.slots;

        let fundSlotDetails = getFundsFromRequest(slots.fundType);

        console.log("SLOT FUND DETAILS " + JSON.stringify(fundSlotDetails));

        // there are going to be multiple resulting matches from the the Static Definition and the Dynamic Definitions
        // we choose the first one always (the result if multiple ideally would be presented in a list view)
        const productCode = fundSlotDetails[0].id;
        const data = await lookupProductCode(productCode);
        console.log("Result Data" + JSON.stringify(data));

        const hasFundAttribute = slots.fundAttributes.hasOwnProperty('resolutions')
            && slots.fundAttributes.resolutions && slots.fundAttributes.resolutions.resolutionsPerAuthority.length > 0;

        const speakProductCode = `<voice name="Kimberly"><say-as interpret-as="spell-out">${productCode}</say-as></voice><p/>`;
        if (hasFundAttribute) {
            const fundAttributes = slots.fundAttributes.resolutions.resolutionsPerAuthority[0].values[0].value.name;
            const attributeId = slots.fundAttributes.resolutions.resolutionsPerAuthority[0].values[0].value.id;

            let responsePhrase = `the ${fundAttributes} is ${data[attributeId]}`;
            let starVar = '';
            if(attributeId === "morningstarRating"){
                data[attributeId] === "1" ?  starVar = ` star` : starVar = ` stars`;
                responsePhrase = `the ${fundAttributes} rating is ${data[attributeId]}` +  starVar;
            }
            responseBuilder = responseBuilder
                .speak(responsePhrase)
                .addElicitSlotDirective('fundAttributes');
        } else {
            responseBuilder = responseBuilder
                .speak(`The current price for ${speakProductCode} is ${data.price}. `)
                .reprompt(`What would would like to know about this mutual fund? ${messages.generateNextPromptMessage('current')}`)
                .addElicitSlotDirective('fundAttributes');
        }

        return responseBuilder.getResponse();
    },
};

const WhatsMyFundIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'SearchByFundIntent'
            && request.dialogState !== 'COMPLETED';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        if (sessionAttributes.fundType) {
            return handlerInput.responseBuilder
                .speak(`OK$, {sessionAttributes.fundType}`)
                .getResponse();
        } else {
            return handlerInput.responseBuilder
                .speak('You need to tell me the mutual fund first..')
                .reprompt('For which mutual fund?')
                .addElicitSlotDirective('fundType')
                .getResponse();
        }
    }
};


const GetSubscribedFundsHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return (request.type === 'IntentRequest' &&
            request.intent.name === 'GetSubscribedFundsIntent');
    },
    async handle(handlerInput) {
        const response = await doRequest.get('https://t481wdms2i.execute-api.us-east-1.amazonaws.com/default/get-subscriptions?email=alexaskills2019@gmail.com');
        const numberProducts = response.Count;

        let productCodes = [];
        let productNames = [];
        let speechOutput = `You are currently subscribed to ${numberProducts} investment products: \n`;
        for (let i = 0; i < response.Items.length; i++) {
            productCodes[i] = response.Items[i].productCode;
            if (response.Items[i].productName !== undefined) {
                productNames[i] = response.Items[i].productName;
            }
            else { productNames[i] = response.Items[i].productCode; }
            if (i !== response.Items.length - 1) {
                speechOutput += productNames[i] + " and ";
            }
            else {
                speechOutput += productNames[i] + "."
            }
        }

        speechOutput += '<break time="1s"/>Is there anything else I can do for you?';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .withSimpleCard(SKILL_NAME, `Subscribed to ${numberProducts} products.`)
            .getResponse();
    },
};

const SubscribeToFundHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return (request.type === 'IntentRequest' &&
            request.intent.name === 'SubscribeToFundIntent');
    },
    async handle(handlerInput) {
        console.log("In SubscribeToFundHandler handle function");

        // getting user's input for slot fundName from AlexSkill from the request
        const request = handlerInput.requestEnvelope.request;
        let fundName = (request.intent.slots.fundType.value ? request.intent.slots.fundType.value.toLowerCase() : null);

        const response = await subscribeUserToFund('alexaskills2019@gmail.com', fundName);
        let speechOutput = ' You are subscribed to the ' + fundName + '.<break time="1s"/> Is there anything else I can do for you?';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(`You can ask me, what's my subscribed funds?`)
            .withSimpleCard(SKILL_NAME, 2)
            .getResponse();
    },
};

const UnsubscribeFundHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'UnsubscribeToFundIntent';
    },
    async handle(handlerInput) {
        console.log("In DeleteProductHandler handle function");
        // hardcoded fund name to be replaced by the value of slot value of productName from AlexaSkill

        // getting user's input for slot fundName from AlexSkill from the request
        const request = handlerInput.requestEnvelope.request;
        var fundName = (request.intent.slots.fundType.value ? request.intent.slots.fundType.value.toLowerCase() : null);
        console.log("unsubscribe fundName: " + fundName);

        //remove the fund name from the fund subscriptions
        const response = await unsubscribeUserToFund('alexaskills2019@gmail.com', fundName);
        const speechOutput = fundName + " has been removed from your subscriptions" + ' <break time="2s"/>Is there anything else I can help with?';
        const videoOutput = fundName + " has been removed from your subscriptions";

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .withSimpleCard(SKILL_NAME, videoOutput)
            .getResponse();
    },
};

//
// const SubscribeToFund = {
//     canHandle(handlerInput) {
//         const request = handlerInput.requestEnvelope.request;
//         return request.type === 'IntentRequest'
//             && request.intent.name === 'SubscribeToFundIntent';
//         //&& request.dialogState === 'COMPLETED';
//     },
//     handle(handlerInput) {
//         const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
//         const newFavorite = getSlotValue(handlerInput.requestEnvelope, 'fundName');
//         const hasFavoriteFunds = sessionAttributes.hasOwnProperty("favoriteFunds") && Array.isArray(sessionAttributes.favoriteFunds);
//         if (hasFavoriteFunds) {
//             sessionAttributes.favoriteFunds.push(newFavorite);
//         } else {
//             sessionAttributes.favoriteFunds = [newFavorite];
//         }
//
//         handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
//
//         const speechText = `I saved the fund ${newFavorite} in the session attributes.
//            Ask me for your subscribed funds to demonstrate retrieving your favorites.`;
//         const repromptText = `You can ask me, what's my subscribed funds?`;
//
//         return handlerInput.responseBuilder
//             .speak(speechText)
//             .reprompt(repromptText)
//             .getResponse();
//     }
// };

const YesHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.YesIntent';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const sessionAttributes = attributesManager.getSessionAttributes();
        const restaurantName = sessionAttributes.restaurant;
        const restaurantDetails = getFundByName(restaurantName);
        const speechOutput = `${restaurantDetails.name
            } is located at ${restaurantDetails.address
            }, the phone number is ${restaurantDetails.phone
            }, and the description is, ${restaurantDetails.description
            }  I have sent these details to the Alexa App on your phone.  Enjoy your meal!
        <say-as interpret-as="interjection">bon appetit</say-as>`;

        const card = `${restaurantDetails.name}\n${restaurantDetails.address}\n$
        {data.city}, ${data.state} ${data.postcode}\nphone: ${restaurantDetails.phone}\n`;

        return responseBuilder
            .speak(speechOutput)
            .withSimpleCard(SKILL_NAME, card)
            .getResponse();
    },
};

const HelpHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const requestAttributes = attributesManager.getRequestAttributes();
        return responseBuilder
            .speak(requestAttributes.t('ASSIST'))
            .reprompt(requestAttributes.t('ASSIST'))
            .getResponse();
    },
};

const StopHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && (request.intent.name === 'AMAZON.NoIntent'
                || request.intent.name === 'AMAZON.CancelIntent'
                || request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const requestAttributes = attributesManager.getRequestAttributes();
        return responseBuilder
            .speak(requestAttributes.t('STOP'))
            .getResponse();
    },
};

const SessionEndedHandler = {
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
        const request = handlerInput.requestEnvelope.request;

        console.log(`Error handled: ${error.message}`);
        console.log(` Original request was ${JSON.stringify(request, null, 2)}\n`);

        return handlerInput.responseBuilder
            .speak('Sorry, I can\'t understand the command. Please say again.')
            .reprompt('Please try another command.')
            .getResponse();
    },
};

const FallbackHandler = {

    // AMAZON.FallackIntent is only currently available in en-US locale.
    // This handler will not be triggered except in that locale, so it can be
    // safely deployed for any locale.
    canHandle(handlerInput) {

        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.FallbackIntent';

    },
    handle(handlerInput) {

        return handlerInput.responseBuilder
            .speak(FALLBACK_MESSAGE)
            .reprompt(FALLBACK_REPROMPT)
            .getResponse();

    },

};


// 2. Constants ==================================================================================

const FALLBACK_MESSAGE = `The ${SKILL_NAME} skill can\'t help you with that.  `;
const FALLBACK_REPROMPT = 'What can I help you with?';



// 3. Helper Functions ==========================================================================



function getFundByName(fundName) {
    let fund = {};
    for (let i = 0; i < data.length; i += 1) {
        if (data.productName === fundName) {
            restaurant = data[i];
        }
    }
    return fund;
}

function randomArrayElement(array) {
    let i = 0;
    i = Math.floor(Math.random() * array.length);
    return (array[i]);
}

function imageMaker(pDesc, pSource) {
    const myImage = new Alexa.ImageHelper()
        .withDescription(pDesc)
        .addImageInstance(pSource)
        .getImage();

    return myImage;
}


function supportsDisplay(handlerInput) {

    return hasDisplay =
        handlerInput.requestEnvelope.context &&
        handlerInput.requestEnvelope.context.System &&
        handlerInput.requestEnvelope.context.System.device &&
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display;

}

const MessagesInterceptor = {
    process(handlerInput) {
        const attributes = handlerInput.attributesManager.getRequestAttributes();
        attributes.t = function (...args) {
            console.log('Message name' + arguments[0]);

            return messages[arguments[0] + '_MESSAGE'];
        };
    },
};

const InitDataLoaderInterceptor = {
    async process(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        if (!sessionAttributes.hasOwnProperty('fetchedFunds')) {
            const attributes = handlerInput.attributesManager.getRequestAttributes();
            const replaceEntityDirective = await fetchFundDynamicSlot();
            console.log("Fetched directive." + JSON.stringify(replaceEntityDirective));
            attributes.fundDirective = replaceEntityDirective;
            handlerInput.responseBuilder.addDirective(replaceEntityDirective);
            sessionAttributes.fetchedFunds = true;
        }
    },
};

// 4. Export =====================================================================================

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchHandler,
        SearchByFundIntent,
        WhatsMyFundIntentHandler,
        GetSubscribedFundsHandler,
        SubscribeToFundHandler,
        UnsubscribeFundHandler,
        YesHandler,
        HelpHandler,
        StopHandler,
        FallbackHandler,
        SessionEndedHandler
    )
    .addRequestInterceptors(MessagesInterceptor, InitDataLoaderInterceptor)
    .addErrorHandlers(ErrorHandler)
    .lambda();
