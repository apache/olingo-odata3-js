// Copyright (c) Microsoft Open Technologies, Inc.  All rights reserved.
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
// files (the "Software"), to deal  in the Software without restriction, including without limitation the rights  to use, copy,
// modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR  IMPLIED, INCLUDING BUT NOT LIMITED TO THE
// WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// TestSynchronizer Client
// Use to log assert pass/fails and notify mstest a test has completed execution

(function (window, undefined) {
    var testRunId = "";
    var serviceRoot = "./common/TestLogger.svc/";
    var recording = null;
    var recordingLength = 0;
    var maxStringLength = 8192;
    var maxPostLength = 2097152;

    var callTestSynchronizer = function (methodName, parameterUrl) {
        /// <summary>Invokes a function on the test synchronizer.</summary>
        /// <param name="partialUrl" type="String" optional="true">URL to work with.</param>
        /// <returns type="String">A response from the server, possibly null.</returns>
        /// <remarks>
        /// If the recording variable is assigned, then the call is logged
        /// but nothing is invoked.
        /// </remarks>

        var partialUrl;
        if (testRunId) {
            partialUrl = methodName + "?testRunId=" + testRunId + "&" + parameterUrl;
        }
        else {
            partialUrl = methodName + "?" + parameterUrl;
        }

        var url = serviceRoot + partialUrl;

        if (recording) {
            if (url.length > maxStringLength) {
                url = url.substr(0, maxStringLength);
            }

            recordingLength += url.length;
            if (recordingLength > maxPostLength) {
                submitRecording();
                recording = [];
                recordingLength = url.length;
            }

            recording.push(url);
            return null;
        }

        var xhr;
        if (window.XMLHttpRequest) {
            xhr = new window.XMLHttpRequest();
        } else {
            xhr = new ActiveXObject("Msxml2.XMLHTTP.6.0");
        }

        xhr.open("GET", url, false);
        xhr.send();
        return xhr.responseText;
    };

    var getLogPrefix = function (result) {
        /// <summary>Returns the log prefix for a given result</summary>
        /// <param name="result" type="Boolean">Whether the result is pass or fail. If null, the log line is assumed to be diagnostic</param>
        return "[" + getShortDate() + "] " + (result === true ? "[PASS] " : (result === false ? "[FAIL] " : ""));
    };

    var getShortDate = function () {
        /// <summary>Returns the current date and time formatted as "yyyy-mm-dd hh:mm:ss.nnn".</summary>
        var padToLength = function (number, length) {
            var result = number + "";
            var lengthDiff = length - result.length;
            for (var i = 0; i < lengthDiff; i++) {
                result = "0" + result;
            }

            return result;
        }

        var date = new Date();
        var day = padToLength(date.getDate(), 2);
        var month = padToLength(date.getMonth() + 1, 2);
        var year = date.getFullYear();

        var hours = padToLength(date.getHours(), 2);
        var minutes = padToLength(date.getMinutes(), 2);
        var seconds = padToLength(date.getSeconds(), 2);
        var milliseconds = padToLength(date.getMilliseconds(), 3);

        return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds + "." + milliseconds;
    };

    var submitRecording = function () {
        var body = { urls: recording };
        postToUrl("LogBatch", body);
    };

    var postToUrl = function (methodName, body) {
        /// <summary>POSTs body to the designated methodName.</summary>
        var xhr;
        if (window.XMLHttpRequest) {
            xhr = new window.XMLHttpRequest();
        } else {
            xhr = new ActiveXObject("Msxml2.XMLHTTP.6.0");
        }

        var url = serviceRoot + methodName;
        xhr.open("POST", url, false);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(window.JSON.stringify(body));
        if (xhr.status < 200 || xhr.status > 299) {
            throw { message: "Unable to POST to url.\r\n" + xhr.responseText };
        }

        return xhr.responseText;
    }

    function LogAssert(result, message, name, expected, actual) {
        var parameterUrl = "pass=" + result + "&message=" + encodeURIComponent(message) + "&name=" + encodeURIComponent(name);

        if (!result) {
            parameterUrl += "&actual=" + encodeURIComponent(actual) + "&expected=" + encodeURIComponent(expected);
        }

        callTestSynchronizer("LogAssert", parameterUrl);
    }

    function LogTestStart(name) {
        callTestSynchronizer("LogTestStart", "name=" + encodeURIComponent(name) + "&startTime=" + encodeURIComponent(getShortDate()));
    }

    function LogTestDone(name, failures, total) {
        callTestSynchronizer("LogTestDone", "name=" + encodeURIComponent(name) + "&failures=" + failures + "&total=" + total + "&endTime=" + encodeURIComponent(getShortDate()));
    }

    function TestCompleted(failures, total) {
        return callTestSynchronizer("TestCompleted", "failures=" + failures + "&total=" + total);
    }

    var extractTestRunId = function () {
        /// <summary>Extracts the testRunId value from the window query string.</summary>
        /// <returns type="String">testRunId, possibly empty.</returns>
        var i, len;
        var uri = window.location.search;
        if (uri) {
            var parameters = uri.split("&");
            for (i = 0, len = parameters.length; i < len; i++) {
                var index = parameters[i].indexOf("testRunId=");
                if (index >= 0) {
                    return parameters[i].substring(index + "testRunId=".length);
                }
            }
        }

        return "";
    };

    var init = function (qunit) {
        /// <summary>Initializes the test logger synchronizer.</summary>
        /// <param name="qunit">Unit testing to hook into.</param>
        /// <remarks>If there is no testRunId present, the QUnit functions are left as they are.</remarks>
        var logToConsole = function (context) {
            if (window.console && window.console.log) {
                window.console.log(context.result + ' :: ' + context.message);
            }
        };

        testRunId = extractTestRunId();
        if (!testRunId) {
            qunit.log = logToConsole;
        } else {
            recording = [];
            qunit.log = function (context) {
                logToConsole(context);

                var name = qunit.config.current.testName;
                if (!(context.actual && context.expected)) {
                    context.actual = context.result;
                    context.expected = true;
                }
                LogAssert(context.result, getLogPrefix(context.result) + context.message, name, window.JSON.stringify(context.expected), window.JSON.stringify(context.actual));
            };

            qunit.testStart = function (context) {
                LogTestStart(context.name);
            };

            qunit.testDone = function (context) {
                LogTestDone(context.name, context.failed, context.total);
            }

            qunit.done = function (context) {
                submitRecording();
                recording = null;

                var nextUrl = TestCompleted(context.failed, context.total);
                nextUrl = JSON.parse(nextUrl).d;
                if (nextUrl) {
                    window.location.href = nextUrl;
                    // MISSING CODEPLEX CODE STARTS
                } else if (window.jscoverage_report) {
                    // Generate code coverage reports if it is enabled
                    // See http://siliconforks.com/jscoverage/manual.html for more information
                    jscoverage_report();
                    // MISSING CODEPLEX CODE STOPS
                }
            }
        }
    };

    window.TestSynchronizer = {
        init: init
    };
})(window);
