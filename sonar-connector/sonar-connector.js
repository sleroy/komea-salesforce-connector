#!/usr/bin/env node

'use strict';
const program = require('commander');
const logger = require('winston');
const jsforce = require('jsforce');

const config = require('config');
const komea = require('../api/komea.js');
const sonar = require('../api/sonar.js');


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
    .option('-p, --push', 'Push the metrics to Komea')
    .parse(process.argv);

console.log('You have chose the action :');
