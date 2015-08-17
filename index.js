(function() {

    if (typeof jasmine == 'undefined') {
        throw new Error("jasmine library does not exist in global namespace!");
    }

    function elapsed(startTime, endTime) {
        return (endTime - startTime)/1000;
    }

    function ISODateString(d) {
        function pad(n) { return n < 10 ? '0'+n : n; }

        return d.getFullYear() + '-' +
            pad(d.getMonth()+1) + '-' +
            pad(d.getDate()) + 'T' +
            pad(d.getHours()) + ':' +
            pad(d.getMinutes()) + ':' +
            pad(d.getSeconds());
    }

    function trim(str) {
        return str.replace(/^\s+/, "" ).replace(/\s+$/, "" );
    }

    function escapeInvalidXmlChars(str) {
        return str.replace(/</g, "&lt;")
            .replace(/\>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/\'/g, "&apos;")
            .replace(/\&/g, "&amp;");
    }

    /**
     * Generates JUnit XML for the given spec run.
     * Allows the test results to be used in java based CI
     * systems like CruiseControl and Hudson.
     * @param {string} [savePath] where to save the files
     * @param {string} [filePrefix] is the string value that is prepended to the
     *                 xml output file;
     */
    var PrettyJUnitXmlReporter = function(savePath,filePrefix) {
        this.savePath = savePath || '';
        this.consolidate = true;
        this.consolidateAll = false;
        this.useDotNotation = true;
        this.filePrefix = filePrefix || '';
    };
    PrettyJUnitXmlReporter.started_at = null; // will be updated when test runner start
    PrettyJUnitXmlReporter.finished_at = null; // will be updated after all files have been written

    PrettyJUnitXmlReporter.prototype = {
        reportRunnerStarting: function() {
            // When run test, make it known on PrettyJUnitXmlReporter
            PrettyJUnitXmlReporter.started_at = (new Date()).getTime();
        },

        reportSpecStarting: function(spec) {
            spec.startTime = new Date();

            if (!spec.suite.startTime) {
                spec.suite.startTime = spec.startTime;
            }
        },

        reportSpecResults: function(spec) {
            var results = spec.results();
            spec.didFail = !results.passed();
            spec.duration = elapsed(spec.startTime, new Date());
            spec.output = '<testcase classname="' + this.getFullName(spec.suite) +
                '" name="' + escapeInvalidXmlChars(spec.description) + '" time="' + spec.duration + '">';
            if(results.skipped) {
                spec.output = spec.output + "<skipped />";
            }

            var failure = "";
            var failures = 0;
            var resultItems = results.getItems();
            for (var i = 0; i < resultItems.length; i++) {
                var result = resultItems[i];

                if (result.type == 'expect' && result.passed && !result.passed()) {
                    failures += 1;
                    failure += '<failure type="' + result.type + '" message="' + trim(escapeInvalidXmlChars(result.message)) + '">';
                    failure += escapeInvalidXmlChars(result.trace.stack || result.message);
                    failure += "</failure>";
                }
            }
            if (failure) {
                spec.output += failure;
            }
            spec.output += "</testcase>";
        },

        reportSuiteResults: function(suite) {
            var results = suite.results();
            var specs = suite.specs();
            var specOutput = "";
            // for JUnit results, let's only include directly failed tests (not nested suites')
            var failedCount = 0;

            suite.status = results.passed() ? 'Passed.' : 'Failed.';
            if (results.totalCount === 0) { // todo: change this to check results.skipped
                suite.status = 'Skipped.';
            }

            // if a suite has no (active?) specs, reportSpecStarting is never called
            // and thus the suite has no startTime -- account for that here
            suite.startTime = suite.startTime || new Date();
            suite.duration = elapsed(suite.startTime, new Date());

            for (var i = 0; i < specs.length; i++) {
                failedCount += specs[i].didFail ? 1 : 0;
                specOutput += "\n  " + specs[i].output;
            }
            suite.output = '\n<testsuite name="' + this.getFullName(suite) +
                '" errors="0" tests="' + specs.length + '" failures="' + failedCount +
                '" time="' + suite.duration + '" timestamp="' + ISODateString(suite.startTime) + '">';
            suite.output += specOutput;
            suite.output += "\n</testsuite>";
        },

        reportRunnerResults: function(runner) {
            var fileName;
            var path = require('path');
            if (this.consolidateAll) {
                fileName = this.filePrefix + '.xml';
                var output = '<?xml version="1.0" encoding="UTF-8" ?>\n<?xml-stylesheet type="text/xml" href="' + path.resolve(__dirname,'prettyjunit.xsl') + '"?>';
                output += "\n<testsuites>";
            }
            var suites = runner.suites();
            for (var i = 0; i < suites.length; i++) {
                var suite = suites[i];
                fileName = this.consolidateAll ? fileName : this.filePrefix + this.getFullName(suite, true) + '.xml';
                if (!this.consolidateAll) {
                    var output = '<?xml version="1.0" encoding="UTF-8" ?>\n<?xml-stylesheet type="text/xml" href="' + path.resolve(__dirname,'prettyjunit.xsl') + '"?>';
                }
                // if we are consolidating, only write out top-level suites
                if ((this.consolidate || this.consolidateAll) && suite.parentSuite) {
                    continue;
                }
                else if (this.consolidate || this.consolidateAll) {
                    if (!this.consolidateAll) {
                        output += "\n<testsuites>";
                    }
                    output += this.getNestedOutput(suite);
                    if (!this.consolidateAll) {
                        output += "\n</testsuites>";
                        this.writeFile(this.savePath, fileName, output);
                    }
                }
                else {
                    output += suite.output;
                    this.writeFile(this.savePath, fileName, output);
                }
            }
            if (this.consolidateAll) {
                output += "\n</testsuites>";
                this.writeFile(this.savePath, fileName, output);
            }
            // When all done, make it known on PrettyJUnitXmlReporter
            PrettyJUnitXmlReporter.finished_at = (new Date()).getTime();
        },

        getNestedOutput: function(suite) {
            var output = suite.output;
            for (var i = 0; i < suite.suites().length; i++) {
                output += this.getNestedOutput(suite.suites()[i]);
            }
            return output;
        },

        writeFile: function(path, filename, text) {
            var errors = [];

            function getQualifiedFilename(separator) {
                if (separator && path && path.substr(-1) !== separator && filename.substr(0) !== separator) {
                    return path + separator + filename;
                }
                return path + filename;
            }

            function nodeWrite(path, filename, text) {
                var fs = require("fs");
                var nodejs_path = require("path");
                var filepath = nodejs_path.join(path, filename);
                var fd = fs.openSync(filepath, "w");
                fs.writeSync(fd, text, 0);
                fs.closeSync(fd);
            }


            // Attempt writing with each possible environment.
            // Track errors in case no write succeeds            
            try {
                nodeWrite(path, filename, text);
                return;
            } catch (g) {
                errors.push('  NodeJS attempt: ' + g.message);
            }

            // If made it here, no write succeeded.  Let user know.
            this.log("Warning: writing junit report failed for '" + path + "', '" +
                filename + "'. Reasons:\n" +
                errors.join("\n"));
        },


        getFullName: function(suite, isFilename) {
            var fullName;
            if (this.useDotNotation) {
                fullName = suite.description;
                for (var parentSuite = suite.parentSuite; parentSuite; parentSuite = parentSuite.parentSuite) {
                    fullName = parentSuite.description + '.' + fullName;
                }
            }
            else {
                fullName = suite.getFullName();
            }

            // Either remove or escape invalid XML characters
            if (isFilename) {
                return fullName.replace(/[^\w]/g, "");
            }
            return escapeInvalidXmlChars(fullName);
        },

        log: function(str) {
            var console = jasmine.getGlobal().console;

            if (console && console.log) {
                console.log(str);
            }
        }
    };

    // export public
    jasmine.PrettyJUnitXmlReporter = PrettyJUnitXmlReporter;
})();