
data = [{productName: "Global Allocation Fund"}];


module.exports = (function() {
    let exports = {};

    const skillName = "T Rowe Price";

    //This is the welcome message for when a user starts the skill without a specific intent.
    exports.WELCOME_MESSAGE = "Hello, I am Trusty Alexa from " + skillName + "."; //+ getGenericHelpMessage(data);

    //This is the message a user will hear when they ask Alexa for help in your skill.
    exports.HELP_MESSAGE = "I can help you find and subscribe to T. Rowe Price Mutual Funds and Articles.";

    //This is the message a user will hear when they begin a new search
    exports.NEW_SEARCH_MESSAGE = getGenericHelpMessage(data);

    //This is the message a user will hear when they ask Alexa for help while in the SEARCH state
    exports.SEARCH_STATE_HELP_MESSAGE = getGenericHelpMessage(data);

    exports.MULTIPLE_RESULTS_STATE_HELP_MESSAGE = "Sorry, please say the full name or ticker of the fund you'd like to learn more about";

    // This is the message use when the decides to end the search
    exports.SHUTDOWN_MESSAGE = "Goodbye from Trusty. ";

    //This is the message a user will hear when they try to cancel or stop the skill.
    exports.EXIT_SKILL_MESSAGE = "<amazon:effect name='whispered'><voice name='Justin'>We go beyond the numbers.</voice></amazon:effect> Goodbye.";
    exports.STOP_MESSAGE = "<amazon:effect name='whispered'><voice name='Justin'>We go beyond the numbers.</voice></amazon:effect> Goodbye.";



    function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function getRandomFund(arrayOfStrings) {
        return arrayOfStrings[getRandom(0, data.length - 1)].productName;
    }

    function getRandomName(arrayOfStrings) {
        let randomNumber = getRandom(0, data.length - 1);
        return arrayOfStrings[randomNumber].productName;
    }

    function generateNextPromptMessage(mode) {
        let infoTypes = ["price", "investment strategy", "net asset value", "morningstar rating", "portfolio manager"];
        let prompt;

        if (mode === "current") {
            // if the mode is current, we should give more informaiton about the current contact
            prompt = ". You ask about the " + infoTypes[getRandom(0, infoTypes.length - 1)];
        }
        //if the mode is general, we should provide general help information
        else if (mode === "general") {
            prompt = ". " + getGenericHelpMessage(data);
        }
        return prompt;
    };
    exports.generateNextPromptMessage = generateNextPromptMessage;

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
    };
    exports.isSlotValid = isSlotValid;

    function getGenericHelpMessage(inputData) {
        if (arguments.length === 0) {
            inputData = data;
        }
        let sentences = ["ask - what is " + getRandomName(inputData), "say - find an mutual fund " + getRandomFund(inputData)];
        return "You can " + sentences[getRandom(0, sentences.length - 1)];
    }
    exports.getGenericHelpMessage = getGenericHelpMessage;

    return exports;
})();


// const languageStrings = {
//     'en': {
//         translation: {
//             SKILL_NAME: 'Trusty Alexa',
//             WELCOME_MESSAGE: 'Welcome to %s. You can ask a question like, what\'s blue chip growth fund? ... Now, what can I help you with?',
//             WELCOME_REPROMPT: 'For instructions on what you can say, please say help me.',
//             DISPLAY_CARD_TITLE: '%s for %s.',
//             HELP_MESSAGE: 'You can ask questions such as, what\'s the ticker for %s, or, you can say exit...Now, what can I help you with?',
//             HELP_REPROMPT: 'You can say things like, what\'s the recipe for a %s, or you can say exit...Now, what can I help you with?',
//             STOP_MESSAGE: 'We go beyond the numbers. Goodbye!',
//             RECIPE_REPEAT_MESSAGE: 'Try saying repeat.',
//             RECIPE_NOT_FOUND_WITH_ITEM_NAME: 'I\'m sorry, I currently do not know the fund information for %s. ',
//             RECIPE_NOT_FOUND_WITHOUT_ITEM_NAME: 'I\'m sorry, I currently do not know that recipe. ',
//             RECIPE_NOT_FOUND_REPROMPT: 'What else can I help with?',
//         }
//     },
// };
