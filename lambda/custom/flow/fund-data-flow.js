const https = require('https');

/**
 * 
 */
const GetFundDataHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'GetFundDataIntent');
  },
  handle(handlerInput) {
    const speechResponse = `Which fund would you like to hear about?`;

    return handlerInput.responseBuilder
      .speak(speechResponse)
      .reprompt(speechResponse)
      .getResponse();
  },
};

const AnswerHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'GetFundDataIntent');
  },
  handle(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const answer = handlerInput.requestEnvelope.request.intent.slots.answer.value;
    const response = getFundDate(answer);

    return handlerInput.responseBuilder
      .speak(response)
      .reprompt(response)
      .getResponse();
  },
};

function getFundDate(answer) {
  const url = `https://9gumif3sjk.execute-api.us-east-1.amazonaws.com/PROD?name=${answer}`;

  return https.get(url, (resp) => {
    let data = '';

    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      console.log(JSON.parse(data).explanation);
    });

  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
}