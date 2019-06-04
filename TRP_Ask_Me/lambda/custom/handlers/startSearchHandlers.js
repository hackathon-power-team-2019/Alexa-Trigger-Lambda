const SPEECH = require('./speechUtil');
const Alexa = require("alexa-sdk"); // import the library
const states = require('./ConstStates');

// const makePlainText = Alexa.utils.TextUtils.makePlainText;
// const makeRichText = Alexa.utils.TextUtils.makeRichText;
// const makeImage = Alexa.utils.ImageUtils.makeImage;

module.exports = Alexa.CreateStateHandler(states.SEARCHMODE, {
    "AMAZON.YesIntent": function () {
        this.response.speak(SPEECH.NEW_SEARCH_MESSAGE).listen(SPEECH.NEW_SEARCH_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.NoIntent": function () {
        this.response.speak(SPEECH.SHUTDOWN_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.RepeatIntent": function () {
        let output;
        if (this.attributes.lastSearch) {
            output = this.attributes.lastSearch.lastSpeech;
            console.log("repeating last speech");
        }
        else {
            output = SPEECH.getGenericHelpMessage(data);
            console.log("no last speech availble. outputting standard help message.");
        }
        this.emit(":ask", output, output);
    },
    "SearchByFundIntent": function () {
        searchByFundIntentHandler.call(this);
    },
    "SearchByInfoTypeIntent": function () {
        searchByInfoTypeIntentHandler.call(this);
    },
    "TellMeThisIntent": function () {
        this.handler.state = states.DESCRIPTION;
        this.emitWithState("TellMeThisIntent");
    },
    "TellMeMoreIntent": function () {
        this.handler.state = states.DESCRIPTION;
        this.emitWithState("TellMeMoreIntent");
    },
    "AMAZON.HelpIntent": function () {
        this.response.speak(SPEECH.getGenericHelpMessage(data)).listen(SPEECH.getGenericHelpMessage(data));
        this.emit(':responseReady');
    },
    "AMAZON.StopIntent": function () {
        this.response.speak(SPEECH.EXIT_SKILL_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.CancelIntent": function () {
        this.response.speak(SPEECH.EXIT_SKILL_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = states.SEARCHMODE;
        var output = "Ok, starting over. " + SPEECH.getGenericHelpMessage(data);
        this.response.speak(output).listen(output);
        this.emit(':responseReady');
    },
    "getSubscribedFunds": function() {
        this.handler.state = states.ACTION;
        this.emitWithState("getSubscribedFunds");
    },
    "SessionEndedRequest": function () {
        this.emit("AMAZON.StopIntent");
    },
    "Unhandled": function () {
        console.log("Unhandled intent in startSearchHandlers");
        this.response.speak(SPEECH.SEARCH_STATE_HELP_MESSAGE).listen(SPEECH.SEARCH_STATE_HELP_MESSAGE);
        this.emit(':responseReady');
    }
});

