const unirest = require('unirest');
const logger = require('winston');
const url = require('url');
const chai = require('chai');
const util = require('util');
const expect = chai.expect;


// Generic method to handle REST errors.
exports.handle_errors = function(response, callback) {
    expect(callback).to.not.be.undefined;
    //expect(error_cb).to.not.be.undefined;

    if (!response.ok) {
        logger.error("Error happened during the execution of a request");
        logger.error("Error message " + response.error);
        logger.error("Response Body----");
        logger.error("Response %j", response.body);

        callback(response.error, null);
        throw new Error("Error message " + response.error);


    } else {
        callback(null, response.body);
    }
}

/**
 * This function do some work to prepare a REST request.
 */
exports.prepare_rest_request = function() {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'; // Ignore SSL problems
}
