/// <reference path="../src/odata-net.js" />
/// <reference path="../src/odata.js" />
/// <reference path="../common/djstestfx.js" />

// odata-tests.js

(function (window, undefined) {

    var makeDateTimeOffset = function (date, offset) {
        var result = new Date(date.valueOf());
        if (offset) {
            // The offset is reversed to get back the UTC date, which is
            // what the API will eventually have.
            var direction = (offset.substring(0, 1) === "+") ? -1 : +1;

            var offsetHours = parseInt(offset.substring(1), 10);
            var offsetMinutes = parseInt(offset.substring(offset.indexOf(":") + 1), 10);

            var hours = result.getUTCHours() + direction * offsetHours;
            var minutes = result.getUTCMinutes() + direction * offsetMinutes;

            result.setUTCHours(hours, minutes);
            result.__edmType = "Edm.DateTimeOffset";
            result.__offset = offset;
        }
        if (!isNaN(result)) {
            return result;
        }
        else {
            return undefined;
        }
    };

    djstest.addTest(function jsonReadActionsAndFunctionsTest() {
        var feed = {
            __metadata: {
                actions: {
                    "http://service.org": [
                        { title: "Feed Action1", target: "http://service.org/feedAction1" },
                        { title: "Feed Action2", target: "http://service.org/feedAction2" }
                    ],
                    "http://service2.org": [
                        { title: "Feed Action3", target: "http://service2.org/feedAction3" }
                    ]
                },
                functions: {
                    "http://service.org": [
                        { title: "Feed Function1", target: "http://service.org/feedFunction1" },
                        { title: "Feed Function2", target: "http://service.org/feedFunction2" }
                    ],
                    "http://service2.org": [
                        { title: "Feed Function3", target: "http://service2.org/feedFunction3" }
                    ]
                }
            },
            results: [
                {
                    __metadata: {
                        actions: {
                            "http://service.org": [
                        { title: "Entry Action1", target: "http://service.org/entryAction1" },
                        { title: "Entry Action2", target: "http://service.org/entryAction2" }
                    ],
                            "http://service2.org": [
                        { title: "Entry Action3", target: "http://service2.org/entryAction3" }
                    ]
                        },
                        functions: {
                            "http://service.org": [
                        { title: "Entry Function1", target: "http://service.org/entryFunction1" },
                        { title: "Entry Function2", target: "http://service.org/entryFunction2" }
                    ],
                            "http://service2.org": [
                        { title: "Entry Function3", target: "http://service2.org/entryFunction3" }
                    ]
                        }
                    }
                },
                {
                    __metadata: {}
                }
            ]
        };

        var expected = {
            __metadata: {
                actions: [
                    { metadata: "http://service.org", title: "Feed Action1", target: "http://service.org/feedAction1" },
                    { metadata: "http://service.org", title: "Feed Action2", target: "http://service.org/feedAction2" },
                    { metadata: "http://service2.org", title: "Feed Action3", target: "http://service2.org/feedAction3" }
                ],
                functions: [
                    { metadata: "http://service.org", title: "Feed Function1", target: "http://service.org/feedFunction1" },
                    { metadata: "http://service.org", title: "Feed Function2", target: "http://service.org/feedFunction2" },
                    { metadata: "http://service2.org", title: "Feed Function3", target: "http://service2.org/feedFunction3" }
                ]
            },
            results: [
                {
                    __metadata: {
                        actions: [
                            { metadata: "http://service.org", title: "Entry Action1", target: "http://service.org/entryAction1" },
                            { metadata: "http://service.org", title: "Entry Action2", target: "http://service.org/entryAction2" },
                            { metadata: "http://service2.org", title: "Entry Action3", target: "http://service2.org/entryAction3" }
                        ],
                        functions: [
                            { metadata: "http://service.org", title: "Entry Function1", target: "http://service.org/entryFunction1" },
                            { metadata: "http://service.org", title: "Entry Function2", target: "http://service.org/entryFunction2" },
                            { metadata: "http://service2.org", title: "Entry Function3", target: "http://service2.org/entryFunction3" }
                        ]
                    }
                },
                {
                    __metadata: {}
                }
            ]
        };

        var response = { headers: { "Content-Type": "application/json", DataServiceVersion: "3.0" }, body: JSON.stringify({ d: feed }) };
        OData.jsonHandler.read(response, {});

        djstest.assertAreEqualDeep(response.data, expected);
        djstest.done();
    });

    djstest.addTest(function readJsonLinksTest() {
        var tests = [
            {
                i: "{\"d\":[{\"uri\":\"http://services.odata.org/OData/OData.svc/Products(1)\"},{\"uri\":\"http://services.odata.org/OData/OData.svc/Products(2)\"},{\"uri\":\"\"}]}",
                e: { results: [
                        { uri: "http://services.odata.org/OData/OData.svc/Products(1)" },
                        { uri: "http://services.odata.org/OData/OData.svc/Products(2)" },
                        { uri: ""}]
                },
                dataServiceVersion: "1.0"
            },
            {
                i: "{\"d\":{\"uri\":\"http://services.odata.org/OData/OData.svc/Products(2)\"}}",
                e: { uri: "http://services.odata.org/OData/OData.svc/Products(2)" },
                dataServiceVersion: "1.0"
            },
            {
                i: "{\"d\":{\"results\":[{\"uri\":\"http://services.odata.org/OData/OData.svc/Products(1)\"},{\"uri\":\"http://services.odata.org/OData/OData.svc/Products(2)\"},{\"uri\":\"\"}]}}",
                e: { results: [
                        { uri: "http://services.odata.org/OData/OData.svc/Products(1)" },
                        { uri: "http://services.odata.org/OData/OData.svc/Products(2)" },
                        { uri: ""}]
                },
                dataServiceVersion: "2.0"
            },
            {
                i: "{\"d\":{\"results\":[{\"uri\":\"http://services.odata.org/OData/OData.svc/Products(1)\"},{\"uri\":\"http://services.odata.org/OData/OData.svc/Products(2)\"}], \"__count\":2}}",
                e: { results: [
                        { uri: "http://services.odata.org/OData/OData.svc/Products(1)" },
                        { uri: "http://services.odata.org/OData/OData.svc/Products(2)" }
                        ],
                    __count: 2
                },
                dataServiceVersion: "2.0"
            },
            {
                i: "{\"d\":{\"results\":[]}}",
                e: { results: [] },
                dataServiceVersion: "2.0"
            },
            {
                i: "{\"d\":{\"results\":[{\"uri\":\"http://services.odata.org/OData/OData.svc/Products(2)\"}]}}",
                e: { results: [{ uri: "http://services.odata.org/OData/OData.svc/Products(2)"}] },
                dataServiceVersion: "2.0"
            },
            {
                i: "{\"d\":{\"results\":[{\"uri\":\"\"}]}}",
                e: { results: [{ uri: ""}] },
                dataServiceVersion: "2.0"
            }
           ];

        var i, len;
        for (i = 0, len = tests.length; i < len; i++) {
            OData.read("foo", function success(data) {
                djstest.assertAreEqualDeep(data, tests[i].e, "Deserialized links object match");
            },
               function error(err) {
                   djstest.fail(err.message);
               },
               OData.defaultHttpHandler,
               {
                   request: function (request, success) {
                       success({ headers: { "Content-Type": "application/json", DataServiceVersion: tests[i].dataServiceVersion }, body: tests[i].i });
                   }
               });
        }

        djstest.done();
    });

    djstest.addTest(function writeJsonLinksTest() {
        var tests = [
        {
            i: { uri: "" },
            e: "{\"uri\":\"\"}"
        },
        {
            i: { uri: null },
            e: "{\"uri\":null}"
        },
        {
            i: { uri: undefined },
            e: "{}"
        },
        {
            i: { uri: "http://services.odata.org/OData/OData.svc/Products(2)" },
            e: "{\"uri\":\"http://services.odata.org/OData/OData.svc/Products(2)\"}"
        }
        ];

        var i, len;
        for (i = 0, len = tests.length; i < len; i++) {
            OData.request({ headers: { "Content-Type": "application/json", DataServiceVersion: tests[i].dataServiceVersion }, data: tests[i].i },
               function success(data) { }, function error(err) { djstest.fail(err.message); },
               OData.defaultHttpHandler,
               {
                   request: function (request, success) {
                       djstest.assertAreEqual(request.body, tests[i].e, "Serialize links object correctly");
                   }
               });
        }

        djstest.done();
    });

    // DATAJS INTERNAL START
    djstest.addTest(function normalizeServiceDocumentTest() {
        var data = {
            EntitySets: ["one", "two", "three"]
        };

        var expected = {
            workspaces: [{
                collections: [
                { title: "one", href: "http://base.org/one" },
                { title: "two", href: "http://base.org/two" },
                { title: "three", href: "http://base.org/three" }
                ]
            }
            ]
        };

        var actual = OData.normalizeServiceDocument(data, "http://base.org");
        djstest.assertAreEqualDeep(actual, expected, "normalizeServiceDocuement didn't return the expected service document object");
        djstest.done();
    });

    djstest.addTest(function isArrayTest() {
        djstest.assert(datajs.isArray([]));
        djstest.assert(datajs.isArray([1, 2]));
        djstest.assert(!datajs.isArray({}));
        djstest.assert(!datajs.isArray("1,2,3,4"));
        djstest.assert(!datajs.isArray());
        djstest.assert(!datajs.isArray(null));
        djstest.done();
    });

    djstest.addTest(function jsonHandler_jsonNormalizeDataTest() {
        var tests = [
            { input: { EntitySets: ["one"] }, expected: { workspaces: [{ collections: [{ title: "one", href: "http://base.org/one"}]}]} },
            { input: { otherProperty: 3 }, expected: { otherProperty: 3} },
            { input: "text", expected: "text" },
            { input: null, expected: null },
            { input: undefined, expected: undefined }
           ];

        var i, len;
        for (i = 0, len = tests.length; i < len; i++) {
            var actual = OData.jsonNormalizeData(tests[i].input, "http://base.org");
            djstest.assertAreEqualDeep(actual, tests[i].expected, "test " + i + "didn't return the expected data");
        }
        djstest.done();
    });

    djstest.addTest(function jsonHandler_jsonUpdateDataFromVersion() {
        var tests = [
          { data: [], dataVersion: "1.0", expected: { results: []} },
          { data: { results: [] }, dataVersion: "2.0", expected: { results: []} },
          { data: { results: [], property: "value" }, dataVersion: "3.0", expected: { results: [], property: "value"} },
          { data: null, dataVersion: "1.0", expected: null },
          { data: undefined, dataVersion: "1.0", expected: undefined }
       ];

        var i, len;
        for (i = 0, len = tests.length; i < len; i++) {
            var actual = OData.jsonUpdateDataFromVersion(tests[i].data, tests[i].dataVersion);
            djstest.assertAreEqualDeep(actual, tests[i].expected, "test " + i + "didn't return the expected data");
        }
        djstest.done();
    });

    djstest.addTest(function jsonParserTest() {
        var tests = [
            { data: { d: [] }, context: { response: { requestUri: "http://base.org" }, dataServiceVersion: "1.0" }, expected: { results: []} },
            { data: { d: {} }, context: { response: { requestUri: "http://base.org" }, dataServiceVersion: "2.0" }, expected: {} },
            { data: { d: "someValue" }, context: { response: { requestUri: "http://base.org" }, dataServiceVersion: "3.0" }, expected: "someValue" },
            { data: { d: { EntitySets: ["one"]} }, context: { response: { requestUri: "http://base.org" }, dataServiceVersion: "2.0" }, expected: { workspaces: [{ collections: [{ title: "one", href: "http://base.org/one"}]}]} }
        ];

        var i, len;
        for (i = 0, len = tests.length; i < len; i++) {
            var text = window.JSON.stringify(tests[i].data);
            var actual = OData.jsonParser(OData.jsonHandler, text, tests[i].context);
            djstest.assertAreEqualDeep(actual, tests[i].expected, "test " + i + "didn't return the expected data");
        }
        djstest.done();
    });

    djstest.addTest(function jsonSerializerTest() {
        var tests = [
            { data: {}, context: { dataServiceVersion: "1.0" }, expected: {} },
            { data: {}, context: { dataServiceVersion: "2.0" }, expected: {} }
        ];

        var i, len;
        for (i = 0, len = tests.length; i < len; i++) {
            var actual = OData.jsonSerializer(OData.jsonHandler, tests[i].data, tests[i].context);
            var expected = window.JSON.stringify(tests[i].expected);
            djstest.assertAreEqualDeep(actual, expected, "test " + i + "didn't return the expected data");
        }
        djstest.done();
    });

    djstest.addTest(function jsonDateTimeParserTest() {

        var schema = {
            namespace: "Ns",
            entityType: [
            { name: "FooType", property: [{ name: "foo", type: "Edm.DateTime" }, { name: "fooOffset", type: "Edm.DateTimeOffset" }, { bar: "name"}] }
            ],
            complexType: [
            { name: "WooType", property: [{ name: "woo", type: "Edm.DateTime" }, { bar: "name"}] }
            ]
        };

        var tests = [
            {
                data: { d: [{ "foo": "/Date(1234)/"}] },
                recognizeDates: false,
                context: { response: { requestUri: "http://base.org" }, dataServiceVersion: "1.0" },
                expected: { results: [{ "foo": "/Date(1234)/"}] }
            },
            {
                data: { d: [{ "foo": "/Date(1234)/", "fooOffset": "/Date(1234+90)/", "bar": "Some text value"}] },
                recognizeDates: true,
                context: { response: { requestUri: "http://base.org" }, dataServiceVersion: "1.0" },
                expected: { results: [{ "foo": new Date(1234), "fooOffset": makeDateTimeOffset(new Date(1234), "+01:30"), bar: "Some text value"}] }
            },
            {
                data: { d: [{ "foo": "/Date(1234)/", "fooOffset": "/Date(1234+90)/", "bar": "Some text value"}] },
                recognizeDates: true,
                context: { response: { requestUri: "http://base.org" }, dataServiceVersion: "1.0" },
                expected: { results: [{ "foo": new Date(1234), "fooOffset": makeDateTimeOffset(new Date(1234), "+01:30"), bar: "Some text value"}] }
            },
            {
                data: { d: [{ "foo": "/Date(1234)/", "fooOffset": "/Date(1234+90)/", "bar": "Some text value"}] },
                recognizeDates: true,
                context: { response: { requestUri: "http://base.org" }, dataServiceVersion: "1.0" },
                expected: { results: [{ "foo": new Date(1234), "fooOffset": makeDateTimeOffset(new Date(1234), "+01:30"), bar: "Some text value"}] }
            },
            {
                data: { d: [{ "foo": "/Date(1234)/", "fooOffset": "/Date(1234+90)/", "bar": "Some text value"}] },
                recognizeDates: true,
                context: { response: { requestUri: "http://base.org" }, dataServiceVersion: "1.0" },
                expected: { results: [{ "foo": new Date(1234), "fooOffset": makeDateTimeOffset(new Date(1234), "+01:30"), bar: "Some text value"}] }
            },
            {
                data: { d: [{ "foo": "/Date(1234)/", "fooOffset": "/Date(1234+90)/", "bar": "Some text value", __metadata: { type: "Ns.FooType"}}] },
                recognizeDates: false,
                context: { response: { requestUri: "http://base.org" }, dataServiceVersion: "1.0", metadata: schema },
                expected: { results: [{ "foo": new Date(1234), "fooOffset": makeDateTimeOffset(new Date(1234), "+01:30"), bar: "Some text value", __metadata: { type: "Ns.FooType"}}] }
            },
            {
                data: { d: [{ "foo": "/Date(1234)/", "fooOffset": "/Date(1234+90)/", "bar": "Some text value", __metadata: { type: "Ns.FooType"}}] },
                recognizeDates: true,
                context: { response: { requestUri: "http://base.org" }, dataServiceVersion: "1.0", metadata: schema },
                expected: { results: [{ "foo": new Date(1234), "fooOffset": makeDateTimeOffset(new Date(1234), "+01:30"), bar: "Some text value", __metadata: { type: "Ns.FooType"}}] }
            },
            {
                data: { d: [{ "woo": "/Date(1234)/", "bar": "Some text value", __metadata: { type: "Ns.WooType"}}] },
                recognizeDates: false,
                context: { response: { requestUri: "http://base.org" }, dataServiceVersion: "1.0", metadata: schema },
                expected: { results: [{ "woo": new Date(1234), bar: "Some text value", __metadata: { type: "Ns.WooType"}}] }
            },
            {
                data: { d: [{ "foo": "/Date(1234)/", "complex": { "woo": "/Date(5678)/", __metadata: { type: "Ns.WooType"} }, "bar": "Some text value", __metadata: { type: "Ns.FooType"}}] },
                recognizeDates: false,
                context: { response: { requestUri: "http://base.org" }, dataServiceVersion: "1.0", metadata: schema },
                expected: { results: [{ "foo": new Date(1234), "complex": { "woo": new Date(5678), __metadata: { type: "Ns.WooType"} }, bar: "Some text value", __metadata: { type: "Ns.FooType"}}] }
            },
            {
                data: { d: [{ "woo": "/Date(8640000000000001)/", "bar": "Some text value", __metadata: { type: "Ns.WooType"}}] },
                recognizeDates: false,
                context: { response: { requestUri: "http://base.org" }, dataServiceVersion: "1.0", metadata: schema }
            },
            {
                data: { d: [{ "woo": "Date(8640000000000000)", "bar": "Some text value", __metadata: { type: "Ns.WooType"}}] },
                recognizeDates: false,
                context: { response: { requestUri: "http://base.org" }, dataServiceVersion: "1.0", metadata: schema }
            }
        ];

        var originalRecognizeDates = OData.jsonHandler.recognizeDates;
        try {
            var i, len;
            for (i = 0, len = tests.length; i < len; i++) {
                OData.jsonHandler.recognizeDates = tests[i].recognizeDates;
                var actual;
                try {
                    var text = window.JSON.stringify(tests[i].data);
                    actual = OData.jsonParser(OData.jsonHandler, text, tests[i].context);
                }
                catch (err) {
                    actual = undefined;
                }

                djstest.assertAreEqualDeep(actual, tests[i].expected, "test " + i + " didn't return the expected data with recognizeDates set to " + tests[i].recognizeDates);
            }
        } finally {
            OData.jsonHandler.recognizeDates = originalRecognizeDates;
            djstest.done();
        }
    });

    djstest.addTest(function jsonDateTimeSerializerTest() {
        var testDate = new Date(1234);
        var testDateOffset = makeDateTimeOffset(testDate, "+01:30");

        var tests = [
             { data: { "foo": testDate, "fooOffset": testDateOffset, "bar": "Some other text" }, expected: { "foo": "1970-01-01T00:00:01.234", "fooOffset": "1970-01-01T00:00:01.234+01:30", "bar": "Some other text"} },
             { data: { "foo": testDate, "woo": { "woo": testDate, "bar": "Some other text" }, "fooOffset": testDateOffset }, expected: { "foo": "1970-01-01T00:00:01.234", "woo": { "woo": "1970-01-01T00:00:01.234", "bar": "Some other text" }, "fooOffset": "1970-01-01T00:00:01.234+01:30"} },
             { data: { "bar": "Some text", "woo": { "bar": "Some other text" }, num: 12345 }, expected: { "bar": "Some text", "woo": { "bar": "Some other text" }, num: 12345} }
        ];

        var i, len;
        for (i = 0, len = tests.length; i < len; i++) {
            var actual = OData.jsonSerializer(OData.jsonHandler, tests[i].data, {});
            var expected = window.JSON.stringify(tests[i].expected);
            djstest.assertAreEqual(actual, expected, "Object was serialized properly");
        }
        djstest.done();
    });

    djstest.addTest(function formatJsonDateStringTest() {
        var tests = [
            { i: "/Date(806716220000)/", e: "1995-07-25T23:50:20" }, // Tue, 25 Jul 1995 23:50:20 UTC
            {i: "/Date(806716220000+150)/", e: "1995-07-25T23:50:20+02:30" }, // Tue, 25 Jul 1995 23:50:20 UTC + 2:30
            {i: "/Date(806716220000-150)/", e: "1995-07-25T23:50:20-02:30" }, // Tue, 25 Jul 1995 23:50:20 UTC - 2:30
            {i: "/Date(-62135596800000)/", e: "0001-01-01T00:00:00" }, // Mon, 1 Jan 1 00:00:00 UTC
            {i: "/Date(-62135596800000+150)/", e: "0001-01-01T00:00:00+02:30" }, // Mon, 1 Jan 1 00:00:00 UTC + 2:30
            {i: "/Date(-62135596800000-150)/", e: "0001-01-01T00:00:00-02:30" }, // Mon, 1 Jan 1 00:00:00 UTC - 2:30 
            {i: "/Date(2542411552520000)/", e: "82535-10-25T15:15:20" }, // Tue, 25 Oct 82535 15:15:20 UTC
            {i: "/Date(2542411552520000+150)/", e: "82535-10-25T15:15:20+02:30" }, // Tue, 25 Oct 82535 15:15:20 UTC + 2:30
            {i: "/Date(2542411552520000-150)/", e: "82535-10-25T15:15:20-02:30" }, // Tue, 25 Oct 82535 15:15:20 UTC - 2:30
            {i: "/Date(0)/", e: "1970-01-01T00:00:00" }, // Thu, 1 Jan 1970 00:00:00 UTC
            {i: "/Date(0+150)/", e: "1970-01-01T00:00:00+02:30" }, // Thu, 1 Jan 1970 00:00:00 UTC + 2:30
            {i: "/Date(0-150)/", e: "1970-01-01T00:00:00-02:30" }, // Thu, 1 Jan 1970 00:00:00 UTC - 2:30
            {i: "/Date(-2199056400000)/", e: "1900-04-25T23:00:00" }, // Wed, 25 Apr 1900 23:00:00 UTC
            {i: "/Date(-2199056400000+870)/", e: "1900-04-25T23:00:00+14:30" }, // Wed, 25 Apr 1900 23:00:00 UTC + 14:30
            {i: "/Date(-2199056400000-870)/", e: "1900-04-25T23:00:00-14:30" }, // Wed, 25 Apr 1900 23:00:00 UTC - 14:30
            {i: "/Date(-79513578000000)/", e: "-0551-04-25T23:00:00" }, // Thu, 25 Apr 551 B.C. 23:00:00 UTC
            {i: "/Date(-79513578000000+870)/", e: "-0551-04-25T23:00:00+14:30" }, // Thu, 25 Apr 551 B.C. 23:00:00 UTC + 14:30
            {i: "/Date(-79513578000000-870)/", e: "-0551-04-25T23:00:00-14:30" }, // Thu, 25 Apr 551 B.C. 23:00:00 UTC - 14:30
            {i: "/Date(-715914000000)/", e: "1947-04-25T23:00:00" }, // Fri, 25 Apr 1947 23:00:00 UTC
            {i: "/Date(-715914000000+870)/", e: "1947-04-25T23:00:00+14:30" }, // Fri, 25 Apr 1947 23:00:00 UTC + 14:30
            {i: "/Date(-715914000000-870)/", e: "1947-04-25T23:00:00-14:30" }, // Fri, 25 Apr 1947 23:00:00 UTC - 14:30
            {i: "/Date(951789600000)/", e: "2000-02-29T02:00:00" }, // Tue, 29 Feb 2000 02:00:00 UTC
            {i: "/Date(951789600000+1)/", e: "2000-02-29T02:00:00+00:01" }, // Tue, 29 Feb 2000 02:00:00 UTC + 00:01
            {i: "/Date(951789600000-1)/", e: "2000-02-29T02:00:00-00:01"}  // Tue, 29 Feb 2000 02:00:00 UTC - 00:01
          ];

        for (var i = 0; i < tests.length; i++) {
            var test = tests[i];
            var dateValue = OData.parseJsonDateString(test.i);
            var textValue = OData.formatDateTimeOffset(dateValue);
            djstest.assertAreEqual(textValue, test.e, "Roundtripping " + test.i + " through " + dateValue.toUTCString());
        }

        djstest.done();
    });

    djstest.addTest(function parseDateTimeJsonStringTest() {
        var tests = [
            { d: "/Date(-62135596800000)/", e: new Date(-62135596800000) }, // Mon, 1 Jan 1 00:00:00 GMT
            {d: "/Date(806716220000)/", e: new Date("25 Jul 1995 23:50:20 GMT") },
            { d: "/Date(2542411552520000)/", e: new Date("25 Oct 82535 15:15:20 GMT") },
            { d: "/Date(0)/", e: new Date("1 Jan 1970 00:00:00 GMT") },
            { d: "/Date(-2199056400000)/", e: new Date("25 Apr 1900 23:00:00 GMT") },
            { d: "/Date(-79513578000000)/", e: new Date(-79513578000000) }, // Thu, 25 Apr 551 B.C. 23:00:00 UTC 
            {d: "/Date(-715914000000)/", e: new Date("25 Apr 1947 23:00:00 GMT") },
            { d: "/Date(951789600000)/", e: new Date("29 Feb 2000 02:00:00 GMT") },

        // Invalid inputs
            {d: "/Date(3.589E+15)/" },
            { d: "/Date(ABCDEF)/" },
            { d: "Date(1234)" },
            { d: "Date(1234" },
            { d: "Date(1234" },
            { d: "/Date(8640000000000001)/" },  // Sat, 13 Sep 275760 00:00:00 UTC + 1 ms
            {d: "/Date(-8640000000000001)/" }, // Tue, 20 Apr 271822 B.C. 00:00:00 UTC - 1 ms
            {d: "not a date value" },
            { d: 12345 },
            { d: "" },
            { d: null },
            { d: undefined }
          ];

        for (var i = 0; i < tests.length; i++) {
            var test = tests[i];
            var dateValue = OData.parseJsonDateString(test.d);

            djstest.assertAreEqualDeep(dateValue, test.e, "Json date string " + test.d + " was parsed properly");
        }

        djstest.done();
    });

    djstest.addTest(function parseDateTimeOffsetJsonStringTest() {
        var tests = [
            { d: "/Date(806716220000+150)/", e: makeDateTimeOffset(new Date("Tue, 25 Jul 1995 23:50:20 UTC"), "+02:30") },
            { d: "/Date(806716220000-150)/", e: makeDateTimeOffset(new Date("Tue, 25 Jul 1995 23:50:20 UTC"), "-02:30") },

            { d: "/Date(-62135596800000+150)/", e: makeDateTimeOffset(new Date(-62135596800000), "+02:30") }, // Mon, 1 Jan 1 00:00:00 UTC
            {d: "/Date(-62135596800000-150)/", e: makeDateTimeOffset(new Date(-62135596800000), "-02:30") }, // Mon, 1 Jan 1 00:00:00 UTC

            {d: "/Date(2542411552520000+150)/", e: makeDateTimeOffset(new Date("Tue, 25 Oct 82535 15:15:20 UTC"), "+02:30") },
            { d: "/Date(2542411552520000-150)/", e: makeDateTimeOffset(new Date("Tue, 25 Oct 82535 15:15:20 UTC"), "-02:30") },

            { d: "/Date(0+150)/", e: makeDateTimeOffset(new Date("Thu, 1 Jan 1970 00:00:00 UTC"), "+02:30") },
            { d: "/Date(0-150)/", e: makeDateTimeOffset(new Date("Thu, 1 Jan 1970 00:00:00 UTC"), "-02:30") },

            { d: "/Date(-2199056400000+870)/", e: makeDateTimeOffset(new Date("Wed, 25 Apr 1900 23:00:00 UTC"), "+14:30") },
            { d: "/Date(-2199056400000-870)/", e: makeDateTimeOffset(new Date("Wed, 25 Apr 1900 23:00:00 UTC"), "-14:30") },

            { d: "/Date(-79513578000000+870)/", e: makeDateTimeOffset(new Date(-79513578000000), "+14:30") }, // Thu, 25 Apr 551 B.C. 23:00:00 UTC
            {d: "/Date(-79513578000000-870)/", e: makeDateTimeOffset(new Date(-79513578000000), "-14:30") }, // Thu, 25 Apr 551 B.C. 23:00:00 UTC

            {d: "/Date(-715914000000+870)/", e: makeDateTimeOffset(new Date("Fri, 25 Apr 1947 23:00:00 UTC"), "+14:30") },
            { d: "/Date(-715914000000-870)/", e: makeDateTimeOffset(new Date("Fri, 25 Apr 1947 23:00:00 UTC"), "-14:30") },

            { d: "/Date(951782400000+1)/", e: makeDateTimeOffset(new Date("Tue, 29 Feb 2000 00:00:00 UTC"), "+00:01") },
            { d: "/Date(951868799000-1)/", e: makeDateTimeOffset(new Date("Tue, 29 Feb 2000 23:59:59 UTC"), "-00:01") },

        // Invalid inputs
            {d: "/Date(3.589E+15+90)/" },
            { d: "/Date(ABCDEF-90)/" },
            { d: "/Date(1234++90)/" },
            { d: "/Date(1234--90)/" },
            { d: "/Date(1234+-90)/" },
            { d: "/Date(1234-+90)/" },
            { d: "/Date(1234)-90/" },
            { d: "/Date(1234-abcd)/" },
            { d: "/Date(8640000000000001-01)/" },  // Sat, 13 Sep 275760 00:00:00 UTC + 1 ms
            {d: "/Date(-8640000000000001+01)/" }, // Tue, 20 Apr 271822 B.C. 00:00:00 UTC - 1 ms
            {d: "/Date(8640000000000000-01)/", e: makeDateTimeOffset(new Date(8640000000000000), "-00:01") },  // Sat, 13 Sep 275760 00:00:00 UTC (valid on Safari)
            {d: "/Date(-8640000000000000+01)/", e: makeDateTimeOffset(new Date(-8640000000000000), "+00:01")} // Tue, 20 Apr 271822 B.C. 00:00:00 UTC (valid on Safari)
          ];

        for (var i = 0; i < tests.length; i++) {
            var test = tests[i];
            var dateValue = OData.parseJsonDateString(test.d);

            djstest.assertAreEqualDeep(dateValue, test.e, "Json date string " + test.d + " was parsed properly");
        }

        djstest.done();
    });


    djstest.addTest(function parseDurationTest() {
        var tests = [
            { i: "P", e: { ms: 0, __edmType: "Edm.Time"} },
            { i: "PT", e: { ms: 0, __edmType: "Edm.Time"} },
            { i: "P5D", e: { ms: 432000000, __edmType: "Edm.Time"} },
            { i: "PT1H", e: { ms: 3600000, __edmType: "Edm.Time"} },
            { i: "PT1M", e: { ms: 60000, __edmType: "Edm.Time"} },
            { i: "PT1S", e: { ms: 1000, __edmType: "Edm.Time"} },
            { i: "PT1.001S", e: { ms: 1001, __edmType: "Edm.Time"} },
            { i: "P0DT0H0M1.0000015S", e: { ms: 1000, ns: 15, __edmType: "Edm.Time"} },
            { i: "P0DT0H0M1.0010001S", e: { ms: 1001, ns: 1, __edmType: "Edm.Time"} },
            { i: "P05DT12H30M5S", e: { ms: 477005000, __edmType: "Edm.Time"} },
            { i: "P0Y0M05DT12H30M5S", e: { ms: 477005000, __edmType: "Edm.Time"} },
            { i: "P0DT0H0M1.001S", e: { ms: 1001, __edmType: "Edm.Time"} },
            { i: "P0DT0H0M0S", e: { ms: 0, __edmType: "Edm.Time"} },
            { i: "P0DT0H0M1.00000015S", exception: true, message: "Cannot parse duration value to given precision." },
            { i: "P1Y1M5D", exception: true, message: "Unsupported duration value." },
            { i: "P1Y5D", exception: true, message: "Unsupported duration value." },
            { i: "P1M5D", exception: true, message: "Unsupported duration value." },
            { i: "", exception: true, message: "Invalid duration value." },
            { i: null, exception: true, message: "Invalid duration value." },
            { i: undefined, exception: true, message: "Invalid duration value." }
        ];

        var i, len;
        for (i = 0, len = tests.length; i < len; i++) {
            var test = tests[i];
            try {
                var actual = OData.parseDuration(test.i);
                djstest.assertAreEqualDeep(actual, test.e, "values match");
            } catch (e) {
                if (test.exception) {
                    djstest.assertAreEqual(e.message, test.message, "exception is the expected one");
                } else {
                    djstest.fail("unexpected exception: " + e.message);
                }
            }
        }
        djstest.done();
    });

    djstest.addTest(function formatDurationTest() {
        var tests = [
        { i: { ms: 432000000, __edmType: "Edm.Time" }, e: "P05DT00H00M00S" },
        { i: { ms: 3600000, __edmType: "Edm.Time" }, e: "P00DT01H00M00S" },
        { i: { ms: 60000, __edmType: "Edm.Time" }, e: "P00DT00H01M00S" },
        { i: { ms: 1000, __edmType: "Edm.Time" }, e: "P00DT00H00M01S" },
        { i: { ms: 1000, ns: 0, __edmType: "Edm.Time" }, e: "P00DT00H00M01S" },
        { i: { ms: 1000, ns: 15, __edmType: "Edm.Time" }, e: "P00DT00H00M01.0000015S" },
        { i: { ms: 1001, ns: 1, __edmType: "Edm.Time" }, e: "P00DT00H00M01.0010001S" },
        { i: { ms: 1001, ns: 0, __edmType: "Edm.Time" }, e: "P00DT00H00M01.001S" },
        { i: { ms: 1001, __edmType: "Edm.Time" }, e: "P00DT00H00M01.001S" },
        { i: { ms: 477005000, __edmType: "Edm.Time" }, e: "P05DT12H30M05S" },
        { i: { ms: 0, __edmType: "Edm.Time" }, e: "P00DT00H00M00S" }
        ];

        var i, len;
        for (i = 0, len = tests.length; i < len; i++) {
            var test = tests[i];
            var actual = OData.formatDuration(test.i);
            djstest.assertAreEqual(actual, test.e, "values match");
        }
        djstest.done();
    });
    // DATAJS INTERNAL END
})(this);
