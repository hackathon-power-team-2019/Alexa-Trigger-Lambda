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

module.exports = SubscribeToFund;