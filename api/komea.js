const unirest = require('unirest');
const logger = require('winston');
const url = require('url');
const chai = require('chai');
const util = require('util');
const rest = require('./rest');

const expect = chai.expect;


/**
 * Factory method to create a new Komea client.
 * @param config : the Komea configuration.
 */
exports.newKomeaClient = function(config) {
    return new Komea(config);

}

/**
 * Constructor to build the Komea client.
 * @param komeaConfig the komea configuration
 */
function Komea(komeaConfig) {
    this.config = komeaConfig;
}

/**
 * Returns the Komea URL.
 * @param relativePath the relative path to access on Komea server.
 */
Komea.prototype.komeaPath = function(relativePath) {
    expect(relativePath).to.not.be.undefined;
    const protocol = this.config.https ? 'https' : 'http';
    const portStr = (this.config.port != undefined ? (":" + this.config.port) : "");
    const komeaHost = protocol + '://' + this.config.host + portStr + relativePath;
    logger.debug("Komea host %s", komeaHost);
    return komeaHost;
}

/**
 * Provides the default common headers.
 */
Komea.prototype.commonHeaders = function() {
    return commonHeaders = {
        'Content-type': 'application/json'
    };
}


/**
 * Attempt to validate the authentication. No answer is provided.
 */
Komea.prototype.fast_authenticate = function(action) {
    const komeaPath = this.komeaPath('');
    const komeaConf = this.config;
    this.authenticate(action, function()  {
        throw new Error(util.format("Could not be authenticated on %s with configuration : %j " , komeaPath,  komeaConf));
    });
}

/**
 * Try to authenticate on Komea Dashboard
 * @param action : the callback to be invoked when the rest call answer
 * @param error_cb : callback to handle errors.
 */
Komea.prototype.authenticate = function(action, error_cb) {
    const url = this.komeaPath("/api/authentication/login");
    const requestHeaders = this.commonHeaders();
    expect(action).to.not.be.undefined;


    rest.prepare_rest_request();
    var request = unirest
        .post(url)
        .headers(requestHeaders)
        .type("application/json")
        .query(
          {
            "login":  this.config.login,
            "password": this.config.password
          })
        .send()
        .end(function(response) {
            logger.debug("Komea:authentication response received.");
            handle_errors(response, action, error_cb);
        });
}

/**
 * Creates a new metric object.
 */
Komea.prototype.newMetric = function(action, error_cb) {
}


/**
 * Updates a metric.
 * @param action : the callback to be invoked when the rest call answer
 * @param error_cb : callback to handle errors.
 */
Komea.prototype.updateMetric = function(action, error_cb) {
}
