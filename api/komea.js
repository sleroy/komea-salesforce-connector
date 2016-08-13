const unirest = require('unirest');
const logger = require('winston');
const url = require('url');
const chai = require('chai');
const util = require('util');

const rest = require('./rest');
const Metric = require('./metric');

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
 * Returns the rest auth.
 */
Komea.prototype.auth = function() {
    return {
        user: this.config.login,
        pass: this.config.password,
        sendImmediately: true
    };
}

/**
 * Returns an API Url from the metric service.
 * @param relativePath the relative path to access on Komea server.
 */
Komea.prototype.metricService = function(relativePath) {
    expect(relativePath).to.not.be.undefined;
    return this.config.metric_url + relativePath;
}

/**
 * Returns an API Url from the metric service.
 * @param relativePath the relative path to access on Komea server.
 */
Komea.prototype.timeStorageService = function(relativePath) {
    expect(relativePath).to.not.be.undefined;
    return this.config.storage_url + relativePath;
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
 * Creates a new metric object.
 */
Komea.prototype.newMetric = function() {
    return new Metric();
}


/**
 * Updates a metric.
 * @param metric : takes a Metric object
 * @param action : the callback to be invoked when the rest call answer
 * @param error_cb : callback to handle errors.
 */
Komea.prototype.updateMetric = function(metric, callback) {
    const url = this.metricService("/metrics-storage/saveMetric");
    const requestHeaders = this.commonHeaders();
    expect(callback).to.not.be.undefined;

    // Get auth configuration
    var authParams = this.auth();

    rest.prepare_rest_request();
    var request = unirest
        .post(url)
        .headers(requestHeaders)
        .type("application/json")
        .auth(authParams)
        .json(metric)
        .send()
        .end(function(response) {
            rest.handle_errors(response, callback);
        });
}

/**
 * Returns the list of metrics
 */
Komea.prototype.getAllMetrics = function(callback) {
    const url = this.metricService("/metrics-request/getAllMetrics");
    const requestHeaders = this.commonHeaders();
    expect(callback).to.not.be.undefined;

    // Get auth configuration
    var authParams = this.auth();

    rest.prepare_rest_request();
    var request = unirest
        .get(url)
        .headers(requestHeaders)
        .type("application/json")
        .auth(authParams)
        .send()
        .end(function(response) {
            rest.handle_errors(response, callback);
        });
}
