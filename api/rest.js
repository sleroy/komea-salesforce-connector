const unirest = require('unirest');
const logger = require('winston');
const url = require('url');
const chai = require('chai');
const util = require('util');
const expect = chai.expect;


// Generic method to handle REST errors.
exports.handle_errors = function(response, action, error_cb) {
    expect(action).to.not.be.undefined;
    //expect(error_cb).to.not.be.undefined;
    logger.debug("Response %j", response);
    if (!response.ok) {
        logger.error("Error happened during the execution of a request");
        logger.error("Error message " + response.error);
        if (error_cb != undefined) {
          error_cb(response);
        } else {
          logger.debug("No error treatment provided.");
        }
    } else {
        action(response.body, response);
    }
}

/**
 * This function do some work to prepare a REST request.
 */
exports.prepare_rest_request = function () {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'; // Ignore SSL problems
}
