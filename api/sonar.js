const unirest = require('unirest');
const logger = require('winston');
const url = require('url');
const chai = require('chai');
const util = require('util');
const expect = chai.expect;

const rest = require('./rest');


/**
 * This function do some work to prepare a REST request.
 */
function prepare_rest_request() {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'; // Ignore SSL problems
}

/**
 * Factory method to create a new Sonar client.
 * @param config : the Sonar configuration.
 */
exports.newSonarClient = function(config) {
    return new Sonar(config);

}

/**
 * Constructor to build the Sonar client.
 * @param sonarConfig the sonar configuration
 */
function Sonar(sonarConfig) {
    this.config = sonarConfig;
}

/**
 * Returns the Sonar URL.
 * @param relativePath the relative path to access on Sonar server.
 */
Sonar.prototype.sonarPath = function(relativePath) {
    expect(relativePath).to.not.be.undefined;
    const protocol = this.config.https ? 'https' : 'http';
    const portStr = (this.config.port != undefined ? (":" + this.config.port) : "");
    const sonarHost = protocol + '://' + this.config.host + portStr + relativePath;
    logger.debug("Sonar host %s", sonarHost);
    return sonarHost;
}

/**
 * Provides the default common headers.
 */
Sonar.prototype.commonHeaders = function() {
    return commonHeaders = {
        'Content-type': 'application/json'
    };
}

/**
 * Attempt to validate the authentication
 */
Sonar.prototype.validate_authentication = function(action, error_cb) {
    const url = this.sonarPath('/api/authentication/validate');
    const requestHeaders = this.commonHeaders();

    rest.prepare_rest_request();
    this.authenticate(function() {
        var request = unirest
            .get(url)
            .headers(requestHeaders)
            .type("application/json")
            .send()
            .end(function(response) {
                logger.debug("Sonar:authentication done");
                rest.handle_errors(response, action, error_cb);
            });
    });
}


/**
 * Attempt to validate the authentication. No answer is provided.
 */
Sonar.prototype.fast_authenticate = function(action) {
    const sonarPath = this.sonarPath('');
    const sonarConf = this.config;
    this.authenticate(action, function()  {
        throw new Error(util.format("Could not be authenticated on %s with configuration : %j " , sonarPath,  sonarConf));
    });
}

/**
 * Try to authenticate on Sonar
 * @param action : the callback to be invoked when the rest call answer
 */
Sonar.prototype.authenticate = function(action, error_cb) {
    const url = this.sonarPath("/api/authentication/login");
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
            logger.debug("Sonar:authentication response received.");
            rest.handle_errors(response, action, error_cb);
        });
}


/**
 * List the projects inside Sonar
 * @param action : the callback to be invoked when the rest call answer
 */
Sonar.prototype.list_projects = function(action, error_cb) {
    const url = this.sonarPath("/api/projects/index");
    const requestHeaders = this.commonHeaders();
    expect(action).to.not.be.undefined;

    rest.prepare_rest_request();
    var request = unirest
        .get(url)
        .headers(requestHeaders)
        .type("application/json")
        .send()
        .end(function(response) {
            logger.debug("Sonar:projectList obtained.");
            rest.handle_errors(response, action, error_cb);
        });
}


/**
 * List the projects inside Sonar
 * @param action : the callback to be invoked when the rest call answer
 */
Sonar.prototype.list_metrics = function(action, error_cb) {
    const url = this.sonarPath("/api/metrics/search");
    const requestHeaders = this.commonHeaders();
    expect(action).to.not.be.undefined;

    rest.prepare_rest_request();
    var request = unirest
        .get(url)
        .headers(requestHeaders)
        .type("application/json")
        .send()
        .end(function(response) {
            logger.debug("Sonar:metricList obtained.");
            rest.handle_errors(response, action, error_cb);
        });
}
