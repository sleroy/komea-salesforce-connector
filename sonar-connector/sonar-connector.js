#!/usr/bin/env node

'use strict';
const program = require('commander');
const logger = require('winston');
const jsforce = require('jsforce');
const async = require('async');

// Software libs
const config = require('config');
const komealib = require('../api/komea.js');
const sonarlib = require('../api/sonar.js');


if (!config.has('sonar')) {
    throw new Error("Informations to connect to the Sonar server must be defined into the configuration file");  //...
}

if (!config.has('komea')) {
    throw new Error("Informations to connect to the Komea server must be defined into the configuration file");  //...
}

//...
const sonarConfig = config.get('sonar');
const komeaConfig = config.get('komea');


program
    .option('-t, --test', 'Test the connection with sonar')
    .option('-l, --project-list', 'Prints the list of reports')
    .option('-m, --metric-list', 'Prints the list of metrics')
    .option('-p, --push', 'Push the measures to Komea')
    .option('-u, --update-metrics', 'Updates the metrics in Komea')
    .parse(process.argv);


if (program.test) {
    logger.info("Testing the connection with Sonar...")
    const sonarClient = sonarlib.newSonarClient(sonarConfig);
    sonarClient.validate_authentication(function() {
        logger.info("Connection successful");
    });
}

if (program.projectList) {
    const sonarClient = sonarlib.newSonarClient(sonarConfig);

    sonarClient.fast_authenticate(function() {
        const projectList = sonarClient.list_projects(function(data, response)  {
            logger.info("Listing the Sonar projects...")
            logger.info("-----------------------------------");
            if (response.error != undefined) {
                for (let i = 0, ni = data.length; i < ni ; ++i) {
                    logger.info("Project %d->%s (%s)", data[i].id, data[i].nm, data[i].k);
                }
            }
            logger.info("-----------------------------------");
        });
    });
}


if (program.metricList) {
    const sonarClient = sonarlib.newSonarClient(sonarConfig);

    sonarClient.fast_authenticate(function() {
        const projectList = sonarClient.list_metrics(function(data, response)  {
            logger.info("Listing the Sonar metrics...");
            logger.info("-----------------------------------");
            if (response.error != undefined) {
                const metrics = data.metrics;
                for (let i = 0, ni = metrics.length; i < ni ; ++i) {
                    //logger.info("%j", metrics[i]);
                    logger.info("Metric %s (%s)", metrics[i].name, metrics[i].key);
                }
            }
            logger.info("-----------------------------------");
        });
    });
}

if (program.updateMetrics) {
    const sonarClient = sonarlib.newSonarClient(sonarConfig);
    const komeaClient = komealib.newKomeaClient(komeaConfig);

    sonarClient.fast_authenticate(function() {
        const projectList = sonarClient.list_metrics(function(data, response)  {
            logger.info("Updating Komea metrics");
            logger.info("-----------------------------------");
            if (response.error != undefined) {
                const metrics = data.metrics;
                for (let i = 0, ni = metrics.length; i < ni ; ++i) {
                    //logger.info("%j", metrics[i]);
                    logger.info("Updating metric -> %s (%s)...", metrics[i].name, metrics[i].key);

                    let metric = komeaClient.newMetric();
                    // metrics[i]
                    komeaClient.updateMetric(metric);
                }
            }
            logger.info("-----------------------------------");
        });
    });
}
