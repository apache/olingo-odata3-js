﻿/// <reference path="common/djstest.js" />
/// <reference path="../src/odata.js" />
/// <reference path="common/ODataReadOracle.js" />

(function (window, undefined) {
    OData.defaultHandler.accept = "application/atomsvc+xml;q=0.9, application/json;odata=verbose;q=0.8, application/json;odata=fullmetadata;q=0.7, application/json;q=0.5, */*;q=0.1";
    var unexpectedErrorHandler = function (err) {
        djstest.assert(false, "Unexpected call to error handler with error: " + djstest.toString(err));
        djstest.done();
    };

    var handlerAcceptStrings = [
        "*/*",
        "application/atom+xml",
        "application/json;odata=verbose",
        undefined
      ];

    var httpStatusCode = {
        notFound: 404,
        badRequest: 400,
        unsupportedMediaType: 415
    };

    var service = "./endpoints/FoodStoreDataService.svc/";
    var serviceV2 = "./endpoints/FoodStoreDataServiceV2.svc/";
    var serviceV3 = "./endpoints/FoodStoreDataServiceV3.svc/";
    var epmService = "./endpoints/EpmDataService.svc/";
    var feed = service + "Foods";
    var feedV2 = serviceV2 + "Foods";
    var feedV3 = serviceV3 + "Foods";
    var categoriesFeed = service + "Categories";
    var categoriesFeedV2 = serviceV2 + "Categories";
    var categoriesFeedV3 = serviceV3 + "Categories";

    var expectedErrorMessage = "HTTP request failed";

    module("Functional", {
        setup: function () {
            djstest.wait(function (done) {
                $.post(service + "ResetData", done);
            });
            OData.jsonHandler.recognizeDates = false;
        }
    });

    for (var i = 0; i < handlerAcceptStrings.length; i++) {

        djstest.addTest(function readFullFeedTest(handlerAccept) {
            djstest.assertsExpected(1);
            OData.read({ requestUri: feed, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        window.ODataReadOracle.readFeed(feed,
                            function (expectedData) {
                                djstest.assertAreEqualDeep(data, expectedData, "Response data not same as expected");
                                djstest.done();
                            }, handlerAccept
                        );
                    },
                    unexpectedErrorHandler
                );
        }, "Testing valid read of full feed collection with " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function readMaxAndNullValueEntryTest(handlerAccept) {
            var endPoint = feed + "(0)";
            djstest.assertsExpected(1);
            OData.read({ requestUri: endPoint, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        window.ODataReadOracle.readEntry(endPoint,
                            function (expectedData) {
                                djstest.assertAreEqualDeep(data, expectedData, "Response data not same as expected");
                                djstest.done();
                            }, handlerAccept
                        );
                    },
                    unexpectedErrorHandler
                );
        }, "Testing valid read of entry with max numbers, complex types, and null and empty strings " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function readMinAndZeroValueEntryTest(handlerAccept) {
            var endPoint = feed + "(1)";
            djstest.assertsExpected(1);
            OData.read({ requestUri: "./endpoints/FoodStoreDataService.svc/Foods(1)", headers: { Accept: handlerAccept} },
                function (data, response) {
                    window.ODataReadOracle.readEntry(endPoint,
                        function (expectedData) {
                            djstest.assertAreEqualDeep(data, expectedData, "Response data not same as expected");
                            djstest.done();
                        }, handlerAccept
                    );
                },
                unexpectedErrorHandler);
        }, "Testing valid read of minimum and zero values " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function readNullNestedComplexTypeEntryTest(handlerAccept) {
            var endPoint = feed + "(2)";
            djstest.assertsExpected(1);
            OData.read({ requestUri: endPoint, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        window.ODataReadOracle.readEntry(endPoint,
                            function (expectedData) {
                                djstest.assertAreEqualDeep(data, expectedData, "Response data not same as expected");
                                djstest.done();
                            }, handlerAccept
                        );
                    },
                    unexpectedErrorHandler
                 );
        }, "Testing valid read of null nested complex type and navigation property " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function readNullComplexTypeEntryTest(handlerAccept) {
            var endPoint = feed + "(3)";
            djstest.assertsExpected(1);
            OData.read({ requestUri: endPoint, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        window.ODataReadOracle.readEntry(endPoint,
                            function (expectedData) {
                                djstest.assertAreEqualDeep(data, expectedData, "Response data not same as expected");
                                djstest.done();
                            }, handlerAccept
                        );
                    },
                    unexpectedErrorHandler
                 );
        }, "Testing valid read of null top level complex type" + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function readNullPropertiesDerivedEntryTest(handlerAccept) {
            djstest.assertsExpected(1);
            var endPoint = feed + "(4)";
            OData.read({ requestUri: endPoint, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        window.ODataReadOracle.readEntry(endPoint,
                            function (expectedData) {
                                djstest.assertAreEqualDeep(data, expectedData, "Response data not same as expected");
                                djstest.done();
                            }, handlerAccept
                        );
                    },
                    unexpectedErrorHandler
                );
        }, "Testing valid read of derived type null properties with " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function readNextComplexTypeDerivedEntryTest(handlerAccept) {

            djstest.assertsExpected(1);
            var endPoint = feed + "(5)";
            OData.read({ requestUri: endPoint, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        window.ODataReadOracle.readEntry(endPoint,
                            function (expectedData) {
                                djstest.assertAreEqualDeep(data, expectedData, "Response data not same as expected");
                                djstest.done();
                            }, handlerAccept
                        );
                    },
                    unexpectedErrorHandler
                 );
        }, "Testing valid read of derived type with full nested complex type properties with " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function readEntryWithInlineFeedTest(handlerAccept) {
            var endpoint = categoriesFeed + "(0)?$expand=Foods";
            djstest.assertsExpected(2);
            OData.read({ requestUri: endpoint, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        window.ODataReadOracle.readEntry(endpoint,
                            function (expectedData) {
                                djstest.assertAreEqualDeep(data.Foods, expectedData.Foods, "Verify inline feed");
                                djstest.assertAreEqualDeep(data, expectedData, "Verify entry");
                                djstest.done();
                            }, handlerAccept
                        );
                    },
                    unexpectedErrorHandler
                );
        }, "Testing read of entry with inline feed with " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function readFeedWithEmptyInlineFeedTest(handlerAccept) {
            var endpoint = categoriesFeed + "?$filter=Name eq 'Empty Category'&$expand=Foods";
            djstest.assertsExpected(2);
            OData.read({ requestUri: endpoint, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        window.ODataReadOracle.readFeed(endpoint,
                            function (expectedData) {
                                djstest.assertAreEqualDeep(data.results[0].Foods, expectedData.results[0].Foods, "Verify inline feed");
                                djstest.assertAreEqualDeep(data, expectedData, "Verify feed");
                                djstest.done();
                            }, handlerAccept
                        );
                    },
                    unexpectedErrorHandler
               );
        }, "Testing read of entry with empty inline feed with " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function readEntryWithInlineEntryTest(handlerAccept) {
            var endpoint = feed + "(0)?$expand=Category";
            djstest.assertsExpected(2);
            OData.read({ requestUri: endpoint, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        window.ODataReadOracle.readEntry(endpoint,
                            function (expectedData) {
                                djstest.assertAreEqualDeep(data.Category, expectedData.Category, "Verify inline entry");
                                djstest.assertAreEqualDeep(data, expectedData, "Verify entry");
                                djstest.done();
                            }, handlerAccept
                        );
                    },
                    unexpectedErrorHandler
               );
        }, "Testing read of entry with inline entry with " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function readFeedWithNullInlineEntryTest(handlerAccept) {
            var endpoint = feed + "?$expand=Category&$filter=Category eq null";
            djstest.assertsExpected(2);
            OData.read({ requestUri: endpoint, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        window.ODataReadOracle.readFeed(endpoint,
                            function (expectedData) {
                                djstest.assertAreEqualDeep(data.results[0].Category, expectedData.results[0].Category, "Verify inline data");
                                djstest.assertAreEqualDeep(data, expectedData, "Verify feed");
                                djstest.done();
                            }, handlerAccept);
                    },
                    unexpectedErrorHandler
               );
        }, "Testing read of feed with null inline entry with " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function readFeedWithInlineCountTest(handlerAccept) {
            var endpoint = feedV2 + "?$inlinecount=allpages";
            djstest.assertsExpected(2);
            OData.read({ requestUri: endpoint, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        window.ODataReadOracle.readFeed(endpoint,
                            function (expectedData) {
                                djstest.assertAreEqual(data.__count, expectedData.__count, "Verify count in response data");
                                djstest.assertAreEqualDeep(data, expectedData, "Verify feed");
                                djstest.done();
                            }, handlerAccept
                        );
                    },
                    unexpectedErrorHandler
                );
        }, "Testing read of collection with inline count with " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function selectSinglePropertyOnEntryTest(handlerAccept) {
            var endpoint = feedV2 + "(0)?$select=Name";
            djstest.assertsExpected(1);
            OData.read({ requestUri: endpoint, headers: { Accept: handlerAccept} },
                function (data, response) {
                    window.ODataReadOracle.readEntry(endpoint,
                        function (expectedData) {
                            djstest.assertAreEqualDeep(data, expectedData, "Verify select result");
                            djstest.done();
                        }, handlerAccept
                    );
                },
                unexpectedErrorHandler);
        }, "Select single property of entry " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function selectComplexTypeOnFeedTest(handlerAccept) {
            var endpoint = feedV2 + "?$select=Packaging";
            djstest.assertsExpected(1);
            OData.read({ requestUri: endpoint, headers: { Accept: handlerAccept} },
                function (data, response) {
                    window.ODataReadOracle.readFeed(endpoint,
                        function (expectedData) {
                            djstest.assertAreEqualDeep(data, expectedData, "Verify select result");
                            djstest.done();
                        }, handlerAccept
                    );
                },
                unexpectedErrorHandler);
        }, "Select single complex type property of feed " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function selectMultiplePropertiesOnEntryTest(handlerAccept) {
            var endpoint = feedV2 + "(3)?$select=Packaging,ExpirationDate,IsAvailable";
            djstest.assertsExpected(1);
            OData.read({ requestUri: endpoint, headers: { Accept: handlerAccept} },
                function (data, response) {
                    window.ODataReadOracle.readEntry(endpoint,
                        function (expectedData) {
                            djstest.assertAreEqualDeep(data, expectedData, "Verify select result");
                            djstest.done();
                        }, handlerAccept
                    );
                },
                unexpectedErrorHandler);
        }, "Select multiple primitive properties of feed " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function readPagedCategoriesCollectionTest(handlerAccept) {
            var endpoint = categoriesFeedV2;
            djstest.assertsExpected(1);
            OData.read({ requestUri: endpoint, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        window.ODataReadOracle.readFeed(endpoint,
                            function (expectedData) {
                                djstest.assertAreEqualDeep(data, expectedData, "Verify response data");
                                djstest.done();
                            }, handlerAccept
                        );
                    }, unexpectedErrorHandler);
        }, "Testing read of paged collection with " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function readPagedCollectionWithInlineCountTest(handlerAccept) {
            var endpoint = categoriesFeedV2 + "?$inlinecount=allpages";
            djstest.assertsExpected(2);
            OData.read({ requestUri: endpoint, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        window.ODataReadOracle.readFeed(endpoint,
                            function (expectedData) {
                                djstest.assertAreEqual(data.__count, expectedData.__count, "Verify count in response data");
                                djstest.assertAreEqualDeep(data, expectedData, "Verify feed");
                                djstest.done();
                            }, handlerAccept
                        );
                    }, unexpectedErrorHandler);
        }, "Testing read of paged collection with inline count with " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function readEntryWithNamedStreams(handlerAccept) {
            var endpoint = feedV3 + "(1)?$expand=Category";
            djstest.assertsExpected(1);
            OData.read({ requestUri: endpoint, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        window.ODataReadOracle.readEntry(endpoint,
                            function (expectedData) {
                                djstest.assertAreEqualDeep(data, expectedData, "Verify entry");
                                djstest.done();
                            }, handlerAccept
                        );
                    }, unexpectedErrorHandler);
        }, "Testing read of entry with named streams " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function readEntryWithCollectionProperties(handlerAccept) {
            var endpoint = feedV3 + "(0)";
            djstest.assertsExpected(1);
            OData.read({ requestUri: endpoint, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        window.ODataReadOracle.readEntry(endpoint,
                            function (expectedData) {
                                djstest.assertAreEqualDeep(data, expectedData, "Verify entry");
                                djstest.done();
                            }, handlerAccept
                        );
                    }, unexpectedErrorHandler);
        }, "Testing read of entry with collection properties " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function invalidEntryReadTest(handlerAccept) {
            var endPoint = feed + "(16)";
            djstest.assertsExpected(2);
            OData.read({ requestUri: endPoint, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        djstest.assert(false, "We should not get here because data is not valid.");
                        djstest.done()
                    },
                    function (err) {
                        djstest.assertAreEqual(err.message, expectedErrorMessage, "Error message");
                        djstest.assertAreEqual(err.response.statusCode, httpStatusCode.notFound, "Response status code");
                        djstest.done();
                    });
        }, "Testing invalid entry read with " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function invalidFeedReadTest(handlerAccept) {
            var endPoint = feed + "Invalid";
            djstest.assertsExpected(2);
            OData.read({ requestUri: endPoint, headers: { Accept: handlerAccept} },
                    function (data, response) {
                        djstest.assert(false, "We should not get here because data is not valid.");
                        djstest.done()
                    },
                    function (err) {
                        djstest.assertAreEqual(err.message, expectedErrorMessage, "Error message");
                        djstest.assertAreEqual(err.response.statusCode, httpStatusCode.notFound, "Response status code");
                        djstest.done();
                    });
        }, "Testing invalid feed read with " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function standardErrorReadTest(handlerAccept) {
            var endPoint = feed + "?$foo=bar";
            djstest.assertsExpected(2);
            OData.read({ requestUri: endPoint, headers: { Accept: handlerAccept} },
                                    function (data, response) {
                                        djstest.assert(false, "We should not get here because data is not valid.");
                                        djstest.done()
                                    },
                                    function (err) {
                                        djstest.assertAreEqual(err.message, expectedErrorMessage, "Error message");
                                        djstest.assertAreEqual(err.response.statusCode, httpStatusCode.badRequest, "Response status code");
                                        djstest.done();
                                    });
        }, "Testing standard error read with " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function inStreamErrorReadTest(handlerAccept) {
            var endPoint = "./endpoints/ErrorDataService.svc/Entities";
            djstest.assertsExpected(1);
            OData.read({ requestUri: endPoint, headers: { Accept: handlerAccept} }, function (data, response) {
                djstest.assert(false, "Unexpected call to success handler with response: " + djstest.toString(response));
                djstest.done()
            }, function (err) {
                djstest.assert(err.response.body.indexOf("An error occurred while processing this request") > -1, "Error handler was called with the correct response body");
                djstest.done();
            });
        }, "Testing in-stream error read with " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        var user = "djsUser";
        var password = "djsPassword";

        djstest.addTest(function readFullFeedBasicAuthTest(handlerAccept) {
            var endpoint = "./endpoints/BasicAuthDataService.svc/Customers";
            djstest.assertsExpected(1);
            OData.read({ requestUri: endpoint, headers: { Accept: handlerAccept }, user: user, password: password }, function (data, response) {
                window.ODataReadOracle.readFeed({ url: endpoint, user: user, password: password }, function (expectedData) {
                    djstest.assertAreEqualDeep(data, expectedData, "Response data not same as expected");
                    djstest.done();
                }, handlerAccept);
            }, unexpectedErrorHandler);
        }, "Testing valid read of full feed collection on basic auth with " + handlerAcceptStrings[i], handlerAcceptStrings[i]);

        djstest.addTest(function readEntryBasicAuthTest(handlerAccept) {
            var endpoint = "./endpoints/BasicAuthDataService.svc/Customers(1)";
            djstest.assertsExpected(1);
            OData.read({ requestUri: endpoint, headers: { Accept: handlerAccept }, user: user, password: password }, function (data, response) {
                window.ODataReadOracle.readEntry({ url: endpoint, user: user, password: password }, function (expectedData) {
                    djstest.assertAreEqualDeep(data, expectedData, "Response data not same as expected");
                    djstest.done();
                }, handlerAccept);
            }, unexpectedErrorHandler);
        }, "Testing valid read of entry on basic auth with " + handlerAcceptStrings[i], handlerAcceptStrings[i]);
    }

    $.each([false, true], function (_, recognizeDates) {
        $.each(handlerAcceptStrings, function (_, accept) {
            djstest.addTest(function readDateTimeTest(params) {
                var endpoint = service + "SpecialDays";
                djstest.assertsExpected(1);
                OData.read({ requestUri: endpoint, headers: { Accept: params.accept }, recognizeDates: params.recognizeDates }, function (data, response) {
                    window.ODataReadOracle.readFeed(endpoint, function (expectedData) {
                        djstest.assertAreEqualDeep(data, expectedData, "Verify response data");
                        djstest.done();
                    }, params.accept, params.recognizeDates);
                }, unexpectedErrorHandler);
            }, "Testing read of dates with recognizeDates=" + recognizeDates + " and accept=" + accept, { recognizeDates: recognizeDates, accept: accept });
        });
    });

    djstest.addTest(function recognizeDatesContextTest(params) {
        var total = 2;
        var count = 0;
        djstest.assertsExpected(total);
        $.each([false, true], function (_, recognizeDates) {
            var endpoint = service + "SpecialDays";
            OData.jsonHandler.recognizeDates = recognizeDates;
            OData.read({ requestUri: endpoint, headers: { Accept: "application/json;odata=verbose"} }, function (data, response) {
                window.ODataReadOracle.readFeed(endpoint, function (expectedData) {
                    djstest.assertAreEqualDeep(data, expectedData, "Verify response data with OData.jsonHandler.recognizeDates=" + recognizeDates);
                    count++;
                    if (count >= total) {
                        djstest.done();
                    }
                }, "application/json;odata=verbose", recognizeDates);
            }, unexpectedErrorHandler);
        });
    }, "Testing global recognizeDates context");

    var validServiceDocumentAcceptHeaders = [
            "*/*",
            "application/xml",
            "application/json;odata=verbose",
            undefined
          ];

    var validMetadataAcceptHeaders = [
            "*/*",
            "application/xml",
            undefined
          ];

    var invalidServiceDocumentAcceptHeaders = [
            "application/atom+xml"
        ]

    var invalidMetadataAcceptHeaders = [
            "application/atom+xml",
            "application/json;odata=verbose",
            "application/json"
        ];

    var services = [
            service,
            epmService
        ];

    $.each(services, function (_, serviceName) {
        $.each(validServiceDocumentAcceptHeaders, function (_, validServiceDocumentAcceptHeader) {
            var parameters = { handlerAccept: validServiceDocumentAcceptHeader, serviceName: serviceName };

            djstest.addTest(function validReadServiceDocumentTest(params) {
                djstest.assertsExpected(1);
                OData.read({ requestUri: params.serviceName, headers: { Accept: params.handlerAccept} },
                        function (data, response) {
                            window.ODataReadOracle.readServiceDocument(serviceName,
                                function (expectedData) {
                                    djstest.assertAreEqualDeep(data, expectedData, "Response data not same as expected");
                                    djstest.done();
                                }, params.handlerAccept
                            );
                        },
                        unexpectedErrorHandler
                    );
            }, "Testing valid read of service document " + parameters.handlerAccept + " on service " + parameters.serviceName, parameters);
        });

        $.each(invalidServiceDocumentAcceptHeaders, function (_, invalidServiceDocumentAcceptHeader) {
            var parameters = { handlerAccept: invalidServiceDocumentAcceptHeader, serviceName: serviceName };

            djstest.addTest(function invalidReadServiceDocumentTest(params) {
                djstest.assertsExpected(2);
                OData.read({ requestUri: params.serviceName, headers: { Accept: params.handlerAccept} },
                        function success(data, response) {
                            djstest.fail("Reading service document should produce error with " + params.handlerAccept);
                            djstest.done();
                        },
                        function (err) {
                            djstest.assertAreEqual(err.message, expectedErrorMessage, "Error message");
                            djstest.assertAreEqual(err.response.statusCode, httpStatusCode.unsupportedMediaType, "Response status code");
                            djstest.done();
                        }
                    );
            }, "Testing read of service document with invalid MIME type " + parameters.invalidServiceDocumentAcceptHeader + " on service " + serviceName, parameters);
        });

        $.each(validMetadataAcceptHeaders, function (_, validMetadataAcceptHeader) {
            var parameters = { handlerAccept: validMetadataAcceptHeader, serviceName: serviceName };

            djstest.addTest(function validReadMetadataTest(params) {
                djstest.assertsExpected(1);
                var endPoint = params.serviceName + "$metadata";
                OData.read({ requestUri: endPoint, headers: { Accept: params.handlerAccept} },
                        function (data, response) {
                            window.ODataReadOracle.readMetadata(endPoint,
                                function (expectedData) {
                                    djstest.assertAreEqualDeep(data, expectedData, "Response data not same as expected");
                                    djstest.done();
                                }
                            );
                        },
                        unexpectedErrorHandler,
                        OData.metadataHandler
                    );
            }, "Testing valid read metadata " + parameters.handlerAccept + " on service " + parameters.serviceName, parameters);
        });

        $.each(invalidMetadataAcceptHeaders, function (_, invalidMetadataAcceptHeader) {
            var parameters = { handlerAccept: invalidMetadataAcceptHeader, serviceName: serviceName };
            djstest.addTest(function invlaidReadMetadataTest(params) {
                djstest.assertsExpected(2);
                var endPoint = params.serviceName + "$metadata";
                OData.read({ requestUri: endPoint, headers: { Accept: params.handlerAccept} },
                        function success(data, response) {
                            djstest.fail("Reading metadata should produce error with " + params.handlerAccept);
                            djstest.done();
                        },
                        function (err) {
                            djstest.assertAreEqual(err.message, expectedErrorMessage, "Error message");
                            djstest.assertAreEqual(err.response.statusCode, httpStatusCode.unsupportedMediaType, "Response status code");
                            djstest.done();
                        },
                        OData.metadataHandler
                    );
            }, "Testing read metadata with invalid MIME type " + parameters.handlerAccept + " on service " + parameters.serviceName, parameters);
        });
    });

    djstest.addTest(function metadataElementExtensionsTest() {
        var csdlFile = "./endpoints/CustomAnnotations.xml";
        var modifyTypeHttpClient = {};
        var originalHttpClient = OData.defaultHttpClient;

        // Modify the content-type of the response so that it is accepted by the metadataHandler.
        // By default, the content-type of CustomAnnotations.xml comes back as text/xml
        modifyTypeHttpClient.request = function (request, success, error) {
            return originalHttpClient.request(request, function (response) {
                response.headers["Content-Type"] = "application/xml";
                success(response);
            }, error);
        }

        OData.defaultHttpClient = modifyTypeHttpClient;

        OData.read({ requestUri: csdlFile, headers: { Accept: "text/xml"} },
            function (data) {
                window.ODataReadOracle.readMetadata(csdlFile,
                    function (expectedData) {
                        djstest.assertAreEqualDeep(data, expectedData, "Response data not same as expected");
                        djstest.done();
                    }
                )
            },
            unexpectedErrorHandler, OData.metadataHandler
         );
    });

    djstest.addTest(function verifyNonDefaultReadMethodCalled() {
        var endPoint = feed + "(0)";
        djstest.assertsExpected(2);
        OData.read(
                { requestUri: endPoint },
                function success(data, response) {
                    djstest.assert(true, "Test executed");
                    djstest.done();
                },
                null,
                {
                    read: function (response) {
                        djstest.assert(true, "Non-default read reached");
                        djstest.done();
                    },
                    accept: "*/*"
                }
            );
    }, "Testing nondefault read is called.");

})(this);