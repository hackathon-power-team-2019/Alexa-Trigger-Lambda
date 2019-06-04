const Alexa = require("alexa-sdk"); // import the library
const SPEECH = require('./speechUtil');
const states = require('./ConstStates');
const makeRichText = Alexa.utils.TextUtils.makeRichText;
const makeImage = Alexa.utils.ImageUtils.makeImage;
const imageURL = 'https://static.seekingalpha.com/uploads/2018/10/31/60842-15410397885898802_origin.png';

const backgroundURL  = 'https://www.troweprice.com/content/dam/tpd/Images/C6YX9WAX6_TPD_Homepage%20Background%20Image_1987px%20x%201200px_180905.jpg';
const backgroundURL2 = 'https://www.troweprice.com/content/dam/tpd/Images/C6YX9WAX6_IDE_Looking%20beyond%20the%20numbers%20image%20631x242pxGRAY%20SCALE_v2.jpg';

const newSessionHandlers = {
    "LaunchRequest": function() {

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
        this.handler.state = states.SEARCHMODE;
        this.response.listen(SPEECH.getGenericHelpMessage(data));
        this.emit(':responseReady');
    },
    'NewSession': function () {
        if(Object.keys(this.attributes).length === 0) { // Check if it's the first time the skill has been invoked
            this.attributes['endedSessionCount'] = 0;
            this.attributes['savedFunds'] = [];
        }
        this.handler.state = states.SEARCHMODE;
        this.response.speak(SPEECH.WELCOME_MESSAGE);

        this.emit(':responseReady');
    },
    'SessionEndedRequest': function () {
        console.log('session ended!');
        this.attributes['endedSessionCount'] += 1;
        this.emit(':saveState', true); // Be sure to call :saveState to persist your session attributes into local DynamoDB

        this.emit("AMAZON.StopIntent");
    },
    "SearchByFundIntent": function () {
        console.log("SEARCH INTENT");
        this.handler.state = states.SEARCHMODE;
        this.emitWithState("SearchByFundIntent");
    },
    "TellMeMoreIntent": function () {
        this.handler.state = states.SEARCHMODE;
        this.response.speak(SPEECH.WELCOME_MESSAGE).listen(SPEECH.getGenericHelpMessage(data));
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
        this.response.speak(SPEECH.getGenericHelpMessage(data)).listen(SPEECH.getGenericHelpMessage(data));
        this.emit(':responseReady');
    },
    "AMAZON.NoIntent": function () {
        this.response.speak(SPEECH.SHUTDOWN_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.RepeatIntent": function () {
        this.response.speak(SPEECH.HELP_MESSAGE).listen(SPEECH.getGenericHelpMessage(data));
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
    "AMAZON.HelpIntent": function () {
        this.response.speak(SPEECH.HELP_MESSAGE + SPEECH.getGenericHelpMessage(data)).listen(SPEECH.getGenericHelpMessage(data));
        this.emit(':responseReady');
    },
    "Unhandled": function () {
        this.handler.state = states.SEARCHMODE;
        this.emitWithState("SearchByFundIntent");
    }
};

function supportsDisplay() {

    return this.event.context &&
        this.event.context.System &&
        this.event.context.System.device &&
        this.event.context.System.device.supportedInterfaces &&
        this.event.context.System.device.supportedInterfaces.Display;

}


module.exports = newSessionHandlers;
