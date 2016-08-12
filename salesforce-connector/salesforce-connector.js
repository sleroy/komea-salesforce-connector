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
    .option('-p, --password <password>', 'Provides the account password')
    .option('-k, --token <token>', 'Provides the token to sign in salesforce')
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

if (!program.password) {
    throw new Error('--password is required');
}

function connection(login, password, token, action) {
    logger.info("Connection to Salesforce\n\tUser : %s\n\tToken %s\n\tPassword %s", login, token, password)
    var conn = new jsforce.Connection();
    conn.login(login, password+token, function(err, res) {
        if (err) {
            return console.error(err);
        }
        console.log("Connection succeed");

        action(conn);
    });
}

if (program.test) {
    connection(program.username, program.password, program.token, function(conn) {});
} else if (program.report) {
    logger.info("  - Print a report with salesforce \nlogin %s\ntoken %s", program.username, program.token);

    connection(program.username, program.password, program.token, function(conn) {

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
    connection(program.username, program.password, program.token, function(conn) {
        conn.query('SELECT Id, Name FROM Report', function(err, res) {
            if (err) {
                return console.error(err);
            }
            logger.debug(JSON.stringify(res));
            logger.info("Liste des rapports sur le compte Salesforce");
            logger.info("--------------------------------------------");
            for (var i=0, ni = res.records.length; i < ni ; ++i) {
                var record = res.records[i];
                logger.debug("record :" + JSON.stringify(record));
                logger.info("%s : Rapport %s", record.Id, record.Name);
            }
        });
    });

}
