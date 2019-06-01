
module.exports = function() {

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

    function getGenericHelpMessage(data) {
        let sentences = ["ask - what is " + getRandomName(data), "say - find an mutual fundFinder " + getRandomFund(data)];
        return "You can " + sentences[getRandom(0, sentences.length - 1)];
    }
    exports.getGenericHelpMessage = getGenericHelpMessage;
    exports.SHUTDOWN_MESSAGE = "Goodbye from Trusty.";
    //This is the message a user will hear when they try to cancel or stop the skill.
    exports.EXIT_SKILL_MESSAGE = "We go beyond the numbers. Goodbye.";

    return exports;
};
