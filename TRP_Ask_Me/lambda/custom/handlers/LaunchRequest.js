const LaunchRequest = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {

        return handlerInput.responseBuilder.speak(messages.WELCOME)
            .reprompt(messages.WHAT_DO_YOU_WANT)
            .getResponse();
    }
};


module.exports = LaunchRequest;