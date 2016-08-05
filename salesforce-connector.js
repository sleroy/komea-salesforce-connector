#!/usr/bin/env node

/**
 * Module dependencies.
 */
'use strict';
const program = require('commander');
const logger = require('winston');
const jsforce = require('jsforce');


program
    .version('1.0.0')
    .option('-u, --username <login>', 'Provides the login to auth on salesforce : ex sl...@gmail.com')
    .option('-k, --token <token>', 'Provides the token to loggerth on salesforce')
    .option('-t, --test', 'Test the connection with salesforce')
    .option('-r, --report <id>', 'Prints a report')
    .option('-l, --report-list', 'Prints the list of reports')
    .parse(process.argv);

console.log('You have chose the action :');
if (!program.username) {
    throw new Error('--login is required');
}
if (!program.token) {
    throw new Error('--token is required');
}

function connection(login, token, action) {
    logger.info("Connection to Salesforce")
    var conn = new jsforce.Connection();
    conn.login(login, token, function(err, res) {
        if (err) {
            return console.error(err);
        }
        console.log("Connection succeed");

        action(conn);
    });
}

if (program.test) {
    logger.info("  - Testing connection with salesforce \nlogin %s\ntoken %s", program.username, program.token);
    connection(program.username, program.token, function(conn) {});
} else if (program.report) {
    logger.info("  - Print a report with salesforce \nlogin %s\ntoken %s", program.username, program.token);

    connection(program.username, program.token, function(conn) {

        // Printing reports
        conn.analytics.reports(function(err, reports) {
            if (err) {
                return console.error(err);
            }
            console.log("reports length: " + reports.length);
            for (var i = 0; i < reports.length; i++) {
                console.log(reports[i].id);
                console.log(reports[i].name);
            }
        });
        // get report reference
        var reportId = program.report.id;
        var report = conn.analytics.report(reportId);

        // execute report synchronously
        report.execute(function(err, result) {
            if (err) {
                return console.error("Cannot obtain the report " + err);
            }
            console.log(result.reportMetadata);
            console.log(result.factMap);
            // ...
        });

    });

} else if (program.reportList) {
    connection(program.username, program.token, function(conn) {
        conn.query('SELECT Id, Name FROM Report', function(err, res) {
            if (err) {
                return console.error(err);
            }
            console.log(JSON.stringify(res));
            for (prop in res) {
             console.log("Resultat " + prop);
            }
        });
    });

}
