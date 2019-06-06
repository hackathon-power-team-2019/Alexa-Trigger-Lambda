/* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable  no-use-before-define */

const Alexa = require('ask-sdk-core');
const https = require('https');

const SKILL_NAME = 'Trusty Alexa';

const backgroundURL  = 'https://www.troweprice.com/content/dam/tpd/Images/C6YX9WAX6_TPD_Homepage%20Background%20Image_1987px%20x%201200px_180905.jpg';

// 1. Handlers ===================================================================================

const { productData, fetchFundDynamicSlot, lookupProductCode } = require('./datasource');
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
        return responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .getResponse();
    },
};


const AlexaNewSessionHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'NewSession';
    },
    async handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;


        const hasDisplay = supportsDisplay.call(this);
        if (hasDisplay) {
            const description = 'What would you like to know about today?';
            let builder = new Alexa.templateBuilders.BodyTemplate1Builder();
            const template = builder.setTitle("Hello from Trusty Alexa, T. Rowe Price")
                .setBackgroundImage(makeImage(backgroundURL))
                .setTextContent(makeRichText('' + description + ''), null, null)
                .build();

            this.response.renderTemplate(template);
        }

        const sessionAttributes = attributesManager.getSessionAttributes();
        //sessionAttributes.products = productData();

        const replaceEntityDirective = await fetchFundDynamicSlot();
        console.log("NEW SESSION REPLACE ENTITY CALL. " + replaceEntityDirective);
        return responseBuilder.getResponse();
    }
};

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

        const requestAttributes = attributesManager.getRequestAttributes();

        //request.intent.slots.fundType.value
        //request.intent.slots.fundAttributes
        const productCode = request.intent.slots.fundType.resolutions.resolutionsPerAuthority[1].values[0].value.name;

        const hasFundAttribute = request.intent.slots.fundAttributes.hasOwnProperty('resolutions');

        const data = await lookupProductCode(productCode);
        //<prosody rate="slow"><say-as interpret-as="spell-out">${productCode}</say-as></prosody>
        const speakProductCode = `<voice name="Kimberly"><prosody rate="slow"><say-as interpret-as="spell-out">${productCode}</say-as></prosody></voice><p/>`;
        if (hasFundAttribute) {
            const fundAttributes = request.intent.slots.fundAttributes.resolutions.resolutionsPerAuthority[0].values[0].value.name;
            const attributeId = request.intent.slots.fundAttributes.resolutions.resolutionsPerAuthority[0].values[0].value.id;
            responseBuilder = responseBuilder
                .speak(`the ${fundAttributes} is ${data[attributeId]}` )
                .addElicitSlotDirective('fundAttributes');
        } else {
            responseBuilder = responseBuilder
                .speak(`${speakProductCode}  current price is ${data.price}. `  )
                .reprompt("What would would like to know about this mutual fund.  You can ask who is the fund manager, what is the ticker ? ")
                .addElicitSlotDirective('fundAttributes');
        }

        return responseBuilder.getResponse();
    },
};

function generateTellMeMoreMessage(product) {
    let sentence = product.productName + " current price " + (Math.random() * 101).toFixed(2) + " US dollars. " + generateSendingCardToAlexaAppMessage(product, "general");
    return sentence;
}


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

const SubscribeToFund = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && request.intent.name === 'SubscribeToFundIntent';
        //&& request.dialogState === 'COMPLETED';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const newFavorite = getSlotValue(handlerInput.requestEnvelope, 'fundName');
        const hasFavoriteFunds = sessionAttributes.hasOwnProperty("favoriteFunds") && Array.isArray(sessionAttributes.favoriteFunds);
        if (hasFavoriteFunds) {
            sessionAttributes.favoriteFunds.push(newFavorite);
        } else {
            sessionAttributes.favoriteFunds = [newFavorite];
        }

        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        const speechText = `I saved the fund ${newFavorite} in the session attributes. 
           Ask me for your subscribed funds to demonstrate retrieving your favorites.`;
        const repromptText = `You can ask me, what's my subscribed funds?`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(repromptText)
            .getResponse();
    }
};


const CoffeeHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'CoffeeIntent';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const sessionAttributes = attributesManager.getSessionAttributes();
        const restaurant = randomArrayElement(getRestaurantsByMeal('coffee'));
        sessionAttributes.restaurant = restaurant.name;
        const speechOutput = `For a great coffee shop, I recommend, ${restaurant.name}. Would you like to hear more?`;

        return responseBuilder.speak(speechOutput).reprompt(speechOutput).getResponse();
    },
};

const BreakfastHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'BreakfastIntent';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const sessionAttributes = attributesManager.getSessionAttributes();
        const restaurant = randomArrayElement(getRestaurantsByMeal('breakfast'));
        sessionAttributes.restaurant = restaurant.name;
        const speechOutput = `For breakfast, try this, ${restaurant.name}. Would you like to hear more?`;

        return responseBuilder.speak(speechOutput).reprompt(speechOutput).getResponse();
    },
};

const LunchHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'LunchIntent';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const sessionAttributes = attributesManager.getSessionAttributes();
        const restaurant = randomArrayElement(getRestaurantsByMeal('lunch'));
        sessionAttributes.restaurant = restaurant.name;
        const speechOutput = `Lunch time! Here is a good spot. ${restaurant.name}. Would you like to hear more?`;

        return responseBuilder.speak(speechOutput).reprompt(speechOutput).getResponse();
    },
};

const DinnerHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'DinnerIntent';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const sessionAttributes = attributesManager.getSessionAttributes();
        const restaurant = randomArrayElement(getRestaurantsByMeal('dinner'));
        sessionAttributes.restaurant = restaurant.name;
        const speechOutput = `Enjoy dinner at, ${restaurant.name}. Would you like to hear more?`;

        return responseBuilder.speak(speechOutput).reprompt(speechOutput).getResponse();
    },
};

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

const AttractionHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'AttractionIntent';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;

        let distance = 200;
        if (request.intent.slots.distance.value && request.intent.slots.distance.value !== "?") {
            distance = request.intent.slots.distance.value;
        }

        const attraction = randomArrayElement(getAttractionsByDistance(distance));

        const speechOutput = `Try ${
            attraction.name}, which is ${
            attraction.distance === '0' ? 'right downtown. ' : `${attraction.distance} miles away. Have fun! `
            }${attraction.description}`;

        return responseBuilder.speak(speechOutput).getResponse();
    },
};

// const GoOutHandler = {
//     canHandle(handlerInput) {
//         const request = handlerInput.requestEnvelope.request;
//
//         return request.type === 'IntentRequest' && request.intent.name === 'GoOutIntent';
//     },
//     handle(handlerInput) {
//         return new Promise((resolve) => {
//             getWeather((localTime, currentTemp, currentCondition) => {
//                 const speechOutput = `It is ${localTime
//                     } and the weather in ${data.city
//                     } is ${
//                     currentTemp} and ${currentCondition}`;
//                 resolve(handlerInput.responseBuilder.speak(speechOutput).getResponse());
//             });
//         });
//     },
// };

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
            .speak(requestAttributes.t('HELP'))
            .reprompt(requestAttributes.t('HELP'))
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
            .reprompt('Sorry, I can\'t understand the command. Please say again.')
            .getResponse();
    },
};

const FallbackHandler = {

    // 2018-May-01: AMAZON.FallackIntent is only currently available in en-US locale.

    //              This handler will not be triggered except in that locale, so it can be

    //              safely deployed for any locale.

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


function getRestaurantsByMeal(mealType) {
    const list = [];
    for (let i = 0; i < data.restaurants.length; i += 1) {
        if (data.restaurants[i].meals.search(mealType) > -1) {
            list.push(data.restaurants[i]);
        }
    }
    return list;
}

function getFundByName(restaurantName) {
    let fund = {};
    for (let i = 0; i < data.length; i += 1) {
        if (data.productName === restaurantName) {
            restaurant = data[i];
        }
    }
    return fund;
}

function getAttractionsByDistance(maxDistance) {
    const list = [];

    for (let i = 0; i < data.attractions.length; i += 1) {
        if (parseInt(data.attractions[i].distance, 10) <= maxDistance) {
            list.push(data.attractions[i]);
        }
    }
    return list;
}


function randomArrayElement(array) {
    let i = 0;
    i = Math.floor(Math.random() * array.length);
    return (array[i]);
}

function supportsDisplay() {

    return this.event.context &&
        this.event.context.System &&
        this.event.context.System.device &&
        this.event.context.System.device.supportedInterfaces &&
        this.event.context.System.device.supportedInterfaces.Display;

}

const messages = require('./handlers/speechUtil');
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
        console.log("DATA INTERCEPTOR");
        if (!sessionAttributes.hasOwnProperty('fetchedFunds')) {
            console.log('setting directive')
            const attributes = handlerInput.attributesManager.getRequestAttributes();
            const replaceEntityDirective = await fetchFundDynamicSlot();
            attributes.fundDirective = replaceEntityDirective;
            handlerInput.responseBuilder.addDirective(replaceEntityDirective);
            sessionAttributes.fetchedFunds = true;
        }

    },
};

// 4. Export =====================================================================================

const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchHandler,
        AlexaNewSessionHandler,
        SearchByFundIntent,
        WhatsMyFundIntentHandler,
       /* AboutHandler,
        CoffeeHandler,
        BreakfastHandler,
        LunchHandler,
        DinnerHandler,
        YesHandler,
        AttractionHandler,
        GoOutHandler, */
        HelpHandler,
        StopHandler,
        FallbackHandler,
        SessionEndedHandler
    )
    .addRequestInterceptors(MessagesInterceptor, InitDataLoaderInterceptor)
    //.addResponseInterceptors( )
    .addErrorHandlers(ErrorHandler)
    .lambda();
