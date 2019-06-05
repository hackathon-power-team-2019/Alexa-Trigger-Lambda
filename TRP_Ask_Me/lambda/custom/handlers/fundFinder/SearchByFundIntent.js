const searchByFundIntent = {
    canHandle(handlerInput) {

    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const fundTerms = request.intent.slots.fundTerms.value;

        const slotValid = SPEECH.isSlotValid(request, 'fundTerms');
        if (!slotValid) {
            console.log("Fund Terms slot is not valid");
            return ;
        }




    }

};

//  lhuangbyrd@gmail.com

function searchByFundIntentHandler() {
    const slots = this.event.request.intent.slots;
    const fundTerms = isSlotValid(this.event.request, "fundTerms");

    if (fundTerms) {
        let searchQuery = slots.fundTerms.value;
        console.log("will begin search with  " + slots.fundTerms.value + " in productName");
        //var searchResults = searchDatabase(data, searchQuery, "productName");

        let searchResultsPromise = searchAemFundDatabase(searchQuery);
        searchResultsPromise.then( (searchResults) => {
            //saving lastSearch results to the current session
            let lastSearch = this.attributes.lastSearch = searchResults;
            let output;

            //saving last intent to session attributes
            this.attributes.lastSearch.lastIntent = "SearchByFundIntent";


            if (searchResults.count > 1) { //multiple results found
                console.log("Search completed by fundFinder. Multiple fundFinder results were found");
                let listOfFundsFound = loopThroughArrayOfObjects(lastSearch.results);
                output = generateSearchResultsMessage(searchQuery, searchResults.results) + listOfFundsFound + ". Which would you like to learn more about?";
                this.handler.state = states.MULTIPLE_RESULTS; // change state to MULTIPLE_RESULTS
                this.attributes.lastSearch.lastSpeech = output;
                this.response.speak(output).listen(output);
                const template = loopThroughArrayOfFunds(searchResults.results);
                this.response.renderTemplate(template);
            } else if (searchResults.count === 1) { //one result found
                console.log("one match found");
                this.handler.state = states.DESCRIPTION; // change state to description
                output = generateSearchResultsMessage(searchQuery, searchResults.results);
                this.attributes.lastSearch.lastSpeech = output;
                // this.emit(":ask", generateSearchResultsMessage(searchQuery,searchResults.results));
                this.response.speak(output).listen(output);
                const builder = new Alexa.templateBuilders.BodyTemplate2Builder();
                const template = builder.setTitle(searchResults.results[0].productName)
                    .setTextContent(makeRichText('Morning Star Rating : ' + searchResults.results[0].morningStarRating + '\n' + 'Price : '
                        + searchResults.results[0].price + '\n' + 'Total Net Assets : ' + searchResults.results[0].totalNetOfAssets + '\n'
                        + 'CUSIP : ' + searchResults.results[0].cusip + '\n' + 'Ticker : ' + searchResults.results[0].totalNetOfAssets + '\n'
                        + 'Share Class : ' + searchResults.results[0].shareClass + '\n' + 'Asset Class : ' + searchResults.results[0].assetClass + '\n'
                        + 'Core Category : ' + searchResults.results[0].coreCategory + '\n' + 'Portfolio Manager : ' + searchResults.results[0].portfolioManager + '\n'
                        + 'Investment Objective : ' + searchResults.results[0].investmentObjective
                        + '\n' + output + ''), null, null)
                    .build();
                this.response.renderTemplate(template);
            }
            else {//no match found
                console.log("no match found");
                console.log("searchQuery was  = " + searchQuery);
                console.log("searchResults.results was  = " + searchResults);
                output = generateSearchResultsMessage(searchQuery, searchResults.results);
                this.attributes.lastSearch.lastSpeech = output;
                // this.emit(":ask", generateSearchResultsMessage(searchQuery,searchResults.results));
                this.response.speak(output).listen(output);

            }
        });


    }
    else {
        console.log("no searchable slot was provided");
        console.log("searchQuery was  = " + searchQuery);
        console.log("searchResults.results was  = " + searchResults);

        this.response.speak(generateSearchResultsMessage(searchQuery, false)).listen(generateSearchResultsMessage(searchQuery, false));
    }

    this.emit(':responseReady');

}

module.exports = searchByFundIntentHandler;
