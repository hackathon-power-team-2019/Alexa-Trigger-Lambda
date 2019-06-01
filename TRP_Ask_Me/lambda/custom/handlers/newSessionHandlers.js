const skillName = "T Rowe Price";

//This is the welcome message for when a user starts the skill without a specific intent.
const WELCOME_MESSAGE = "Hello, I am Trusty Alexa from " + skillName + ". \n I go by Trusty for short. \n\nYou can start by asking me about a Mutual Fund. "; //+ getGenericHelpMessage(data);

//This is the message a user will hear when they ask Alexa for help in your skill.
const HELP_MESSAGE = "I can help you find and subscribe to T. Rowe Price Mutual Funds.";

const Alexa = require("alexa-sdk"); // import the library
const SPEECH = require('./handlers/speechUtil');
const states = require('./handlers/ConstStates');
const makeRichText = Alexa.utils.TextUtils.makeRichText;
const makeImage = Alexa.utils.ImageUtils.makeImage;
const imageURL = 'https://static.seekingalpha.com/uploads/2018/10/31/60842-15410397885898802_origin.png';

const newSessionHandlers = {
    "LaunchRequest": function() {
        this.handler.state = states.SEARCHMODE;
        this.response.speak(WELCOME_MESSAGE).listen(SPEECH.getGenericHelpMessage(data));
        const builder = new Alexa.templateBuilders.BodyTemplate2Builder();
        const template = builder.setTitle(WELCOME_MESSAGE)
            .setImage(makeImage(imageURL))
            .setTextContent(makeRichText('' + description + ''), null, null)
            .build();

        this.response.renderTemplate(template);
        this.emit(':responseReady');
    },
    "SearchByFundIntent": function () {
        console.log("SEARCH INTENT");
        this.handler.state = states.SEARCHMODE;
        this.emitWithState("SearchByFundIntent");
    },
    "TellMeMoreIntent": function () {
        this.handler.state = states.SEARCHMODE;
        this.response.speak(WELCOME_MESSAGE).listen(SPEECH.getGenericHelpMessage(data));
        this.emit(':responseReady');
    },
    "TellMeThisIntent": function () {
        this.handler.state = states.SEARCHMODE;
        this.emitWithState("SearchByFundIntent");
    },
    "SearchByInfoTypeIntent": function () {
        this.handler.state = states.SEARCHMODE;
        this.emitWithState("SearchByInfoTypeIntent");
    },
    "getSubscribedFunds": function() {
        this.handler.state = states.ACTION;
        this.emitWithState("getSubscribedFunds");
    },
    "AMAZON.YesIntent": function () {
        this.response.speak(getGenericHelpMessage(data)).listen(getGenericHelpMessage(data));
        this.emit(':responseReady');
    },
    "AMAZON.NoIntent": function () {
        this.response.speak(SHUTDOWN_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.RepeatIntent": function () {
        this.response.speak(HELP_MESSAGE).listen(getGenericHelpMessage(data));
        this.emit(':responseReady');
    },
    "AMAZON.StopIntent": function () {
        this.response.speak(EXIT_SKILL_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.CancelIntent": function () {
        this.response.speak(EXIT_SKILL_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = states.SEARCHMODE;
        var output = "Ok, starting over. " + getGenericHelpMessage(data);
        this.response.speak(output).listen(output);
        this.emit(':responseReady');
    },
    "AMAZON.HelpIntent": function () {
        this.response.speak(HELP_MESSAGE + getGenericHelpMessage(data)).listen(getGenericHelpMessage(data));
        this.emit(':responseReady');
    },
    "SessionEndedRequest": function () {
        this.emit("AMAZON.StopIntent");
    },
    "Unhandled": function () {
        this.handler.state = states.SEARCHMODE;
        this.emitWithState("SearchByFundIntent");
    }
};

module.exports = newSessionHandlers;