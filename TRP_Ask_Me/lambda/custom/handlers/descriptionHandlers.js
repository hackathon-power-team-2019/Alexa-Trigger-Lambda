// =====================================================================================================
// ------------------------------------  Helper Functions  -----------------------------------
// =====================================================================================================
// For more helper functions, visit the Alexa cookbook at https://github.com/alexa/alexa-cookbook
//======================================================================================================
function titleCase(str) {
    return str.replace(str[0], str[0].toUpperCase());
}

function generateCard(product) {
    let cardTitle = "Product Info for " + titleCase(product.productName);
    let cardBody = "Price: " + product.price + " \n" + "Fund Manager: " + product.portfolioManager + " \n";
    /*let imageObj = {
        smallImageUrl: "https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/team-lookup/avatars/" + person.firstName + "._TTH_.jpg",
        largeImageUrl: "https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/team-lookup/avatars/" + person.firstName + "._TTH_.jpg",
    }; */
    return {
        "title": cardTitle,
        "body": cardBody,
        //"image": imageObj
    };
}

// =====================================================================================================
// ------------------------------------  Description Handlers  -----------------------------------
// =====================================================================================================
let descriptionHandlers = Alexa.CreateStateHandler(states.DESCRIPTION, {
    "TellMeMoreIntent": function () {
        let product;
        let speechOutput;
        let repromptSpeech;
        let cardContent;

        if (this.attributes.lastSearch) {
            product = this.attributes.lastSearch.results[0];
            cardContent = generateCard(product); //calling the helper function to generate the card content that will be sent to the Alexa app.
            speechOutput = generateTellMeMoreMessage(product);
            repromptSpeech = "Would you like to find another evangelist? Say yes or no";

            console.log("the contact you're trying to find more info about is " + product.productName);
            this.handler.state = states.SEARCHMODE;
            this.attributes.lastSearch.lastSpeech = speechOutput;
            this.response.cardRenderer(cardContent.title, cardContent.body, cardContent.image);
            this.response.speak(speechOutput).listen(repromptSpeech);
        }
        else {
            speechOutput = SPEECH.getGenericHelpMessage(data);
            repromptSpeech = SPEECH.getGenericHelpMessage(data);
            this.handler.state = states.SEARCHMODE;
            this.response.speak(speechOutput).listen(repromptSpeech);
        }

        this.emit(':responseReady');
    },
    "TellMeThisIntent": function () {
        let slots = this.event.request.intent.slots;
        let product = this.attributes.lastSearch.results[0];
        let infoType = isSlotValid(this.event.request, "infoType");
        let speechOutput;
        let repromptSpeech;
        let cardContent;

        console.log(isInfoTypeValid("github"));

        if (this.attributes.lastSearch && isInfoTypeValid(infoType)) {
            product = this.attributes.lastSearch.results[0];
            cardContent = generateCard(product);
            speechOutput = generateSpecificInfoMessage(slots, product);
            repromptSpeech = "Would you like to find another evangelist? Say yes or no";
            this.handler.state = states.SEARCHMODE;
            this.attributes.lastSearch.lastSpeech = speechOutput;
            this.response.cardRenderer(cardContent.title, cardContent.body, cardContent.image);
            this.response.speak(speechOutput).listen(repromptSpeech);
        } else {
            //not a valid slot. no card needs to be set up. respond with simply a voice response.
            speechOutput = generateSearchHelpMessage(product.productCode);
            repromptSpeech = "Ask me something useful";
            // repromptSpeech = "You can ask me - what's " + genderize("his-her", product.gender) + " twitter, or give me " + genderize("his-her", person.gender) + " git-hub username";
            this.attributes.lastSearch.lastSpeech = speechOutput;
            this.handler.state = states.SEARCHMODE;
            this.response.speak(speechOutput).listen(repromptSpeech);
        }
        this.emit(':responseReady');
    },
    "SearchByFundIntent": function () {
        searchByFundIntentHandler.call(this);
    },
    "AMAZON.HelpIntent": function () {
        var person = this.attributes.lastSearch.results[0];
        this.response.speak(generateNextPromptMessage(person, "current")).listen(generateNextPromptMessage(person, "current"));
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
    "AMAZON.NoIntent": function () {
        this.response.speak(SHUTDOWN_MESSAGE);
        this.emit(':responseReady');
    },
    "AMAZON.YesIntent": function () {
        this.emit("TellMeMoreIntent");
    },
    "AMAZON.RepeatIntent": function () {
        this.response.speak(this.attributes.lastSearch.lastSpeech).listen(this.attributes.lastSearch.lastSpeech);
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
        let person = this.attributes.lastSearch.results[0];
        console.log("Unhandled intent in DESCRIPTION state handler");
        this.response.speak("Sorry, I don't know that" + generateNextPromptMessage(person, "general"))
            .listen("Sorry, I don't know that" + generateNextPromptMessage(person, "general"));
        this.emit(':responseReady');
    }
});

module.exports = descriptionHandlers;
