/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk/index');
const FundDataFlow = require('./flow/fund-data-flow')

/**
 * Entrypoint handler for the Alexa skill
 */
const StartTRoweSkillHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'TRoweFunds');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(WELCOME + PROMPT + PROMPT_OPTIONS)
      .reprompt(PROMPT + PROMPT_OPTIONS)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, an error occurred.')
      .reprompt('Sorry, an error occurred.')
      .getResponse();
  },
};

const SKILL_NAME = 'T. Rowe Price';
const HELP_MESSAGE = 'You can say ' + PROMPT_OPTIONS + ', or, you can say exit... What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';
const WELCOME = `Welcome to T. Rowe Price Alexa skill.`;
const PROMPT = `You can do any of of the following.`;
const PROMPT_OPTIONS = [
  'Ask about a T. Rowe Price fund',
  'Inquire about the performance of your subscribed funds',
  'Learn about an investment oppurtunity'
]

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    StartTRoweSkillHandler,
    FundDataFlow.GetFundDataHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
