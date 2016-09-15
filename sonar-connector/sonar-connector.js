#!/usr/bin/env node

'use strict';
const program = require('commander');
const logger = require('winston');
const jsforce = require('jsforce');
const async = require('async');
const l = require('lodash');

// Software libs
const config = require('config');
const komealib = require('../api/komea.js');
const sonarlib = require('../api/sonar.js');
const organization = require("../config/sonar-organisation.json");


if (!config.has('sonar')) {
    throw new Error("Informations to connect to the Sonar server must be defined into the configuration file"); //...
}

if (!config.has('komea')) {
    throw new Error("Informations to connect to the Komea server must be defined into the configuration file"); //...
}


program
    .option('-t, --test', 'Test the connection with sonar')
    .option('-l, --project-list', 'Prints the list of reports')
    .option('-m, --metric-list', 'Prints the list of metrics')
    .option('-d, --delete-metrics', 'Delete the metrics provided by the connector')
    .option('-p, --push', 'Push the measures to Komea')
    .option('-u, --update-metrics', 'Updates the metrics in Komea')
    .option('-o, --update-organization', 'Updates the organization in Komea')
    .option('-c, --generate-csv', 'Generates a CSV for the metrics')
    .parse(process.argv);


//...
const sonarConfig = config.get('sonar');
const komeaConfig = config.get('komea');

const sonarClient = sonarlib.newSonarClient(sonarConfig);
const komeaClient = komealib.newKomeaClient(komeaConfig);


if (program.test) {
    logger.info("Testing the connection with Sonar...")
    sonarClient.validate_authentication(function() {
        logger.info("Connection successful");
    });
}

if (program.updateOrganization) {
    logger.info("Updating the organization.");
    komeaClient.updateEntityTypes(organization.entityTypes, function(err, res) {
        if (err) {
            logger.error("Could not update the entity type %s", entityType.name);
        } else {
            logger.info("Creation of the Sonar entities");
            sonarClient.fast_authenticate(function() {
                const projectList = sonarClient.list_projects(function(err, data)  {
                    if (err == undefined) {
                        async.forEach(data, function(project, next) {
                            logger.info("Project %d->%s (%s)", project.id, project.nm, project.k);
                            var entity = {
                                "active": true,
                                "description": project.nm,
                                "key": project.k,
                                "name": project.nm,
                                "otherAttributes": {},
                                "type": "sonar-project"
                            };
                            komeaClient.updateEntity(entity, function(err, res) {
                                if (err)  {
                                    logger.error("Could not add the entity.");
                                } else {
                                    logger.info("Project %s added/updated", project.nm);
                                }
                            });
                        });
                    } else {
                        logger.error("Cannot obtain the project list");
                    }
                });
            });
        }
    });
}

if (program.projectList) {
    sonarClient.fast_authenticate(function() {
        const projectList = sonarClient.list_projects(function(err, data)  {
            logger.info("Listing the Sonar projects...")
            logger.info("-----------------------------------");
            if (response.error != undefined) {
                for (let i = 0, ni = data.length; i < ni; ++i) {
                    logger.info("Project %d->%s (%s)", data[i].id, data[i].nm, data[i].k);
                }
            }
            logger.info("-----------------------------------");
        });
    });
}

/**
 *  Deletes a list of metrics.
 */
if (program.deleteMetrics) {
    logger.info("Deleting metrics...");
    sonarClient.fast_authenticate(function() {
        sonarClient.list_metrics(function(err, results)  {
            let metricKeys = l.map(results.metrics, sonarClient.getMetricKey);
            logger.info("metric Keys %j", metricKeys);
            komeaClient.deleteMetrics(metricKeys, function(err, res) {
                if (err) logger.error("Could not delete the metrics");
                else {
                    logger.info("Metrics deleted.");
                }
            });
        });
    });

}

if (program.metricList) {
    sonarClient.fast_authenticate(function() {
        const projectList = sonarClient.list_metrics(function(err, data)  {
            logger.info("Listing the Sonar metrics...");
            logger.info("-----------------------------------");
            const metrics = data.metrics;
            for (let i = 0, ni = metrics.length; i < ni; ++i) {
                //logger.info("%j", metrics[i]);
                logger.info("Metric %s (%s)", metrics[i].name, metrics[i].key);
            }

            logger.info("-----------------------------------");
        });
    });
}

if (program.updateMetrics) {
    /**
     * Converts the Sonar value type into Komea type.
     */
    function sonarMetricConversion(type) {
        if (type == "WORK_DUR") {
            return 'TIME_DAYS';
        } else if (type == "MILLISEC") {
            return 'TIME_MILLISECONDS';
        } else if (type == "RATING") {
            return 'INT';
        } else {
            return type;
        }
    }

    /** Converts a Sonar Metric into Komea Metric */
    function buildKomeaMetric(sonarMetric) {
        let metric = komeaClient.newMetric();
        metric.name = sonarMetric.name;
        metric.key = 'sonar-' + sonarMetric.key;
        metric.description = sonarMetric.description;
        metric.lastValue();
        metric.formula = ""; // No Formula
        metric.oncePerDay();
        metric.missingValueStrategy = "NULL_VALUE";
        metric.type = "SonarQube";
        metric.units = "Undefined";
        metric.valueDirection = sonarMetric.direction;
        metric.valueType = sonarMetricConversion(sonarMetric.type);
        return metric;
    }

    sonarClient.fast_authenticate(function() {
        logger.info("Obtaining metrics...");
        const projectList = sonarClient.list_metrics(function(err, data)  {
            logger.info("Updating Komea metrics");
            logger.info("-----------------------------------");
            let metrics = data.metrics;

            // Filter metrics
            logger.info("Filtering metrics...");
            let filteredMetrics = l.filter(metrics, function(sonarMetric) {
                if ('DATA' == sonarMetric.type ||  'DISTRIB' == sonarMetric.type ||  'LEVEL' == sonarMetric.type ||  'STRING' == sonarMetric.type) {
                    logger.warn("Ignoring metric %s since she returns %s", sonarMetric.name, sonarMetric.type);
                    return false;
                } else {
                    return true;
                }
            });
            logger.info("List of metrics %j", filteredMetrics);
            async.forEach(filteredMetrics, function(sonarMetric, next) {
                const metric = buildKomeaMetric(sonarMetric);

                komeaClient.updateMetric(metric, function(err, data) {
                    if (err) {
                        logger.error("Metric update %s has a problem", metric.name);
                        logger.error("Problem with the metric  %j", metric);
                        next(err);
                    } else {
                        logger.info("----> [OK] UPDATED %s", metric.name);
                        next();
                    }
                });
            });

            logger.info("-----------------------------------");
        });
    });
}

if (program.push) {
    sonarClient.fast_authenticate(function() {
        logger.info("Pushing the measures to Komea...");
        sonarClient.list_projects(function(projectErr, projectData)  {
            logger.info("Sonar: list projects received");
            if (projectErr) {
                logger.error("Could not obtain the project list.");
                next(err);
                return;
            }
            sonarClient.list_metrics(function(metricErr, metricData)  {
                logger.info("Sonar: list metrics received.");
                if (metricErr) {
                    next(metricErr);
                    ermetricErrrermetricErrr
                    return;
                }



                logger.info("Updating Komea metrics");
                logger.info("-----------------------------------");
                let metrics = metricData.metrics;
                logger.info("Filtering metrics.");
                // Filter metrics
                let filteredMetrics = l.filter(metrics, function(sonarMetric) {
                    if ('DATA' == sonarMetric.type ||  'DISTRIB' == sonarMetric.type) {
                        logger.warn("Ignoring metric %s since she returns %s", sonarMetric.name, sonarMetric.type);
                        return false;
                    } else {
                        return true;
                    }
                });


                async.forEach(filteredMetrics, function(sonarMetric, next) {
                        logger.info("Obtaining measures for %s", sonarMetric.name);
                        for (let i = 0, ni = projectData.length; i < ni; ++i) {
                            let project = projectData[i];
                            sonarClient.measures_component(project.k, [sonarMetric.key], function(err, measureData) {
                                logger.info("Measures for %s received.", sonarMetric.name);
                                if (err) {
                                    logger.error("Problem with the metric  %j and project %j", sonarMetric.name, project);
                                    next(err);
                                    return;
                                } else {
                                    //logger.info("Metric data %s", JSON.stringify(measureData));
                                    let tags = {
                                        "sonar-project_key": project.k,
                                        "sonar-project_id": project.id
                                    };
                                    //logger.info("Tags %j", tags);
                                    var componentMeasure = measureData.component;
                                    logger.info("Sending measures for %s", sonarMetric.key);
                                    for (var mi = 0; mi < componentMeasure.measures.length; ++mi) {;
                                        var measure = componentMeasure.measures[mi]; // We have only one component
                                        logger.info("Sending measures %s for %s", measure.metric, sonarMetric.key);
                                        komeaClient.push_timeserie(new Date(), "sonar-" + measure.metric, tags, measure.value, function() {
                                            if (err) {
                                                logger.error("ERROR with timeserie %j", measure);
                                                next(err);
                                            } else {
                                                logger.info("----> [OK] Measure %s for project %s sent", sonarMetric.name, project.nm);
                                            }
                                        });
                                    }
                                }
                            });
                        }

                    },
                    function() {
                        next(); // Loop Finished.
                    });

                logger.info("-----------------------------------");
            });

        });
    });

}

if (program.generateCsv) {

    function generateCSV(component, filteredMetrics, stream) {
        var stream0 = stream;

        async.forEach(filteredMetrics, function(sonarMetric, next) {
            //                logger.info("Obtaining measures for %s", sonarMetric.name);

            logger.info("Component to be exported %s", component);

            sonarClient.measures_component(component.key, [sonarMetric.key], function(err, measureData) {
                //logger.info("Measures for %s received.", sonarMetric.name);
                if (err) {
                    logger.error("Problem with the metric  %j and component %j", sonarMetric.name, component);
                    next(err);
                    return;
                } else {
                    //logger.info("Measure %j", JSON.stringify(measureData));
                    var componentMeasure = measureData.component;

                    for (var mi = 0; mi < componentMeasure.measures.length; ++mi) {;
                        var measure = componentMeasure.measures[mi]; // We have only one component
                        for (var key in component) {
                            stream.write(component[key] + ";");
                        }
                        stream.write( measure.metric + ";" + measure.value + "\n");

                    }
                }
            });
        }, function() {
            stream0.end();

        });

    }

    sonarClient.fast_authenticate(function() {
        sonarClient.list_metrics(function(metricErr, metricData)  {
            logger.info("Sonar: list metrics received.");
            if (metricErr) {
                next(metricErr);
                ermetricErrrermetricErrr
                return;
            }



            logger.info("Updating Komea metrics");
            logger.info("-----------------------------------");
            let metrics = metricData.metrics;
            logger.info("Filtering metrics.");
            // Filter metrics
            let filteredMetrics = l.filter(metrics, function(sonarMetric) {
                if ('DATA' == sonarMetric.type ||  'DISTRIB' == sonarMetric.type) {
                    logger.warn("Ignoring metric %s since she returns %s", sonarMetric.name, sonarMetric.type);
                    return false;
                } else {
                    return true;
                }
            });

            logger.info("Generation of the csv..");

            let project = {
                "key": sonarConfig['default-sonar-project']
            }


            var fs = require('fs');

            var stream = fs.createWriteStream("project_metrics.csv");
            stream.once('open', function(fd) {
                generateCSV(project, filteredMetrics, stream);
            });

            var curPage = 1;

            var stream2 = fs.createWriteStream("metrics.csv");
            stream2.once('open', function(fd) {

                var callback = function(err, data) {
                    logger.info("Received data %j", data);
                    if (data.components.length > 0) {

                        for (var c = 0; c < data.components.length; ++c) {
                            logger.info("Component %j", data.components[c]);
                            generateCSV(data.components[c], filteredMetrics, stream2);
                        }

                        sonarClient.list_components(
                            sonarConfig['default-sonar-project'],
                            "FIL",
                            callback,
                            curPage + 1
                        );
                    }
                };

                sonarClient.list_components(
                    sonarConfig['default-sonar-project'],
                    "FIL",
                    callback,
                    curPage
                );

            });

            logger.info("-----------------------------------");
        });

    });

}
