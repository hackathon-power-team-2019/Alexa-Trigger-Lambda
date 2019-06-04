
data = [{productName: "Global Allocation Fund"}];

module.exports = (function() {

    const skillName = "T Rowe Price";

    //This is the welcome message for when a user starts the skill without a specific intent.
    const WELCOME_MESSAGE = "Hello, I am Trusty Alexa from " + skillName + ".  I go by Trusty for short.  You can start by asking me about a Mutual Fund. "; //+ getGenericHelpMessage(data);

    //This is the message a user will hear when they ask Alexa for help in your skill.
    const HELP_MESSAGE = "I can help you find and subscribe to T. Rowe Price Mutual Funds.";

    //This is the message a user will hear when they begin a new search
    const NEW_SEARCH_MESSAGE = getGenericHelpMessage(data);

    //This is the message a user will hear when they ask Alexa for help while in the SEARCH state
    const SEARCH_STATE_HELP_MESSAGE = getGenericHelpMessage(data);

    const MULTIPLE_RESULTS_STATE_HELP_MESSAGE = "Sorry, please say the full name, CUSIP, or ticker of the fund you'd like to learn more about";

    // This is the message use when the decides to end the search
    const SHUTDOWN_MESSAGE = "Goodbye from Trusty. ";

    //This is the message a user will hear when they try to cancel or stop the skill.
    const EXIT_SKILL_MESSAGE = "We go beyond the numbers. Goodbye.";
    
    let exports = {};

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

    function generateNextPromptMessage(person, mode) {
        let infoTypes = ["price", "investment strategy", "net asset value", "morningstar rating", "portfolio manager"];
        let prompt;

        if (mode === "current") {
            // if the mode is current, we should give more informaiton about the current contact
            prompt = ". You can say - tell me more, or  tell me its " + infoTypes[getRandom(0, infoTypes.length - 1)];
        }
        //if the mode is general, we should provide general help information
        else if (mode === "general") {
            prompt = ". " + getGenericHelpMessage(data);
        }
        return prompt;
    };
    exports.generateNextPromptMessage = generateNextPromptMessage;

    function getGenericHelpMessage(inputData) {
        if (arguments.length === 0) {
            inputData = data;
        }
        let sentences = ["ask - what is " + getRandomName(inputData), "say - find an mutual fund " + getRandomFund(inputData)];
        return "You can " + sentences[getRandom(0, sentences.length - 1)];
    }
    exports.getGenericHelpMessage = getGenericHelpMessage;
    exports.SHUTDOWN_MESSAGE = "Goodbye from Trusty.";
    //This is the message a user will hear when they try to cancel or stop the skill.
    exports.EXIT_SKILL_MESSAGE = "We go beyond the numbers. Goodbye.";

    return exports;
})();
