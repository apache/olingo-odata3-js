/// <reference path="common/djstest.js" />
/// <reference path="../src/odata.js" />
/// <reference path="common/ODataReadOracle.js" />

(function (window, undefined) {
    OData.defaultHandler.accept = "application/atomsvc+xml;q=0.9, application/json;odata=verbose;q=0.8, application/json;odata=fullmetadata;q=0.7, application/json;q=0.5, */*;q=0.1";
    var unexpectedErrorHandler = function (err) {
        djstest.assert(false, "Unexpected call to error handler with error: " + djstest.toString(err));
        djstest.done();
    };

    var verifyRequest = function (request, done) {
        if (request.method == "POST") {
            if (request.headers && request.headers["X-HTTP-Method"] == "MERGE") {
                verifyMerge(request, done);
            }
            else {
                verifyPost(request, done);
            }
        }
        else if (request.method == "PUT") {
            verifyPut(request, done);
        }
    };

    var verifyPost = function (request, done) {
        var httpOperation = request.method + " " + request.requestUri;
        djstest.log(httpOperation);
        OData.request(request, function (data, response) {
            djstest.log("Status code:" + response.statusCode);
            djstest.assertAreEqual(response.statusCode, httpStatusCode.created, "Verify response code: " + httpOperation);
            djstest.log("Uri:" + request.requestUri);
            ODataReadOracle.readEntry(data.__metadata.uri, function (expectedData) {
                djstest.assertAreEqualDeep(response.data, expectedData, "Verify new entry against response: " + httpOperation);
                done();
            }, request.headers.Accept);
        }, unexpectedErrorHandler);
    };

    var verifyPut = function (request, done) {
        var httpOperation = request.method + " " + request.requestUri;
        djstest.log(httpOperation);
        OData.request(request, function (data, response) {
            djstest.log("Status code:" + response.statusCode);
            djstest.assertAreEqual(response.statusCode, httpStatusCode.noContent, "Verify response code: " + httpOperation);
            djstest.log("Uri:" + request.requestUri);
            ODataReadOracle.readEntry(request.requestUri, function (actualData) {
                djstest.assertAreEqualDeep(subset(actualData, request.data), request.data, "Verify updated entry: " + httpOperation);
                done();
            }, request.headers.Accept);
        }, unexpectedErrorHandler);
    }

    var verifyMerge = function (request, done) {
        var httpOperation = request.method + " " + request.requestUri;
        djstest.log(httpOperation);
        ODataReadOracle.readEntry(request.requestUri, function (originalData) {
            OData.request(request, function (data, response) {
                djstest.log("Status code:" + response.statusCode);
                djstest.assertAreEqual(response.statusCode, httpStatusCode.noContent, "Verify response code");
                djstest.log("Uri:" + request.requestUri);
                ODataReadOracle.readEntry(request.requestUri, function (actualData) {
                    // Merge the original data with the updated data to get the expected data
                    var expectedData = $.extend(true, {}, originalData, request.data);
                    djstest.assertAreEqualDeep(actualData, expectedData, "Verify merged data");
                    done();
                }, request.headers["Content-Type"]);
            }, unexpectedErrorHandler);
        }, request.headers["Content-Type"]);
    }

    // Returns a subset of object with the same set of properties (recursive) as the subsetObject
    var subset = function (object, subsetObject) {
        if (typeof (object) == "object" && typeof (subsetObject) == "object") {
            var result = {};
            for (subsetProp in subsetObject) {
                result[subsetProp] = subset(object[subsetProp], subsetObject[subsetProp]);
            }
            return result;
        }
        else {
            return object;
        }
    };

    var foodData = {
        "__metadata": {
            type: "DataJS.Tests.V1.Food"
        },
        FoodID: 42,
        Name: "olive oil",
        UnitPrice: 3.14,
        ServingSize: "1",
        MeasurementUnit: "",
        ProteinGrams: 5,
        FatGrams: 9,
        CarbohydrateGrams: 2,
        CaloriesPerServing: "6",
        IsAvailable: true,
        ExpirationDate: new Date("2011/05/03 12:00:00 PM"),
        ItemGUID: "27272727-2727-2727-2727-272727272727",
        Weight: 10,
        AvailableUnits: 1,
        Packaging: {
            Type: "Can",
            Color: null,
            NumberPerPackage: 1,
            RequiresRefridgeration: false,
            PackageDimensions: {
                Length: "4",
                Height: 3,
                Width: "2",
                Volume: 1
            },
            ShipDate: new Date("2011/01/01 12:00:00 PM")
        }
    };

    var testServices = {
        V1: "./endpoints/FoodStoreDataService.svc",
        V2: "./endpoints/FoodStoreDataServiceV2.svc",
        V3: "./endpoints/FoodStoreDataServiceV3.svc"
    };

    var testData = {
        V1: foodData,
        V2: $.extend(true, {}, foodData, {
            __metadata: {
                type: "DataJS.Tests.V2.Food"
            }
        }),
        V3: $.extend(true, {}, foodData, {
            __metadata: {
                type: "DataJS.Tests.V3.Food"
            },
            AlternativeNames: { results: ["name1", "name2"] },
            Providers: {
                __metadata: { type: "Collection()" },
                results: [
                    {
                        Name: "Provider",
                        Aliases: { results: ["alias1"] },
                        Details: {
                            Telephone: "555-555-555",
                            PreferredCode: 999
                        }
                    },
                    {
                        Name: "Provider2",
                        Aliases: { results: [] },
                        Details: null
                    }
                ]
            }
        })
    };

    var mimeTypes = [undefined, "application/json;odata=verbose", "application/atom+xml"];

    var httpStatusCode = {
        created: 201,
        noContent: 204,
        notFound: 404
    };

    $.each(testServices, function (serviceName, service) {
        var newFood = testData[serviceName];
        var testFoodType = newFood.__metadata.type;

        var foodsFeed = service + "/Foods";
        var categoriesFeed = service + "/Categories";

        module("Functional", {
            setup: function () {
                djstest.log("Resetting data");
                djstest.wait(function (done) {
                    $.post(service + "/ResetData", done);
                });
            }
        });

        $.each(mimeTypes, function (_, mimeType) {
            // Provide coverage for both undefined and specific DSVs
            // Need to avoid undefined DSV for ATOM+V2 because we are not using metadata awareness, so a specific DSV is required
            // For all other cases DSV = undefined is a valid scenario
            var dataServiceVersions;

            if (serviceName === "V1") {
                dataServiceVersions = [undefined, "1.0"];
            }
            if (serviceName === "V2") {
                dataServiceVersions = (mimeType === "application/json;odata=verbose" ? [undefined, "1.0", "2.0"] : ["2.0"]);
            }
            if (serviceName === "V3") {
                dataServiceVersions = (mimeType === "application/json;odata=verbose" || !mimeType ? ["3.0"] : [undefined, "1.0", "2.0", "3.0"]);
            }

            $.each(dataServiceVersions, function (_, dataServiceVersion) {
                var headers;
                if (mimeType || dataServiceVersion) {
                    headers = {
                        "Content-Type": mimeType,
                        Accept: mimeType,
                        DataServiceVersion: dataServiceVersion
                    };
                }

                djstest.addTest(function addEntityTest(headers) {
                    var request = {
                        requestUri: categoriesFeed,
                        method: "POST",
                        headers: headers,
                        data: {
                            CategoryID: 42,
                            Name: "New Category"
                        }
                    };

                    djstest.assertsExpected(2);
                    verifyRequest(request, djstest.done);
                }, "Add new entity to " + serviceName + " service using mimeType = " + mimeType + " and DSV = " + dataServiceVersion, headers);

                djstest.addTest(function addEntityWithUTF16CharTest(headers) {
                    var request = {
                        requestUri: categoriesFeed,
                        method: "POST",
                        headers: headers,
                        data: {
                            CategoryID: 42,
                            Name: "\u00f6 New Category \u00f1"
                        }
                    };

                    djstest.assertsExpected(2);
                    verifyRequest(request, djstest.done);
                }, "Add new entity with UTF-16 character to " + serviceName + " service using mimeType = " + mimeType + " and DSV = " + dataServiceVersion, headers);

                djstest.addTest(function addLinkedEntityTest(headers) {
                    var request = {
                        requestUri: categoriesFeed + "(0)/Foods",
                        method: "POST",
                        headers: headers,
                        data: newFood
                    };

                    djstest.assertsExpected(2);
                    verifyRequest(request, djstest.done);
                }, "Add new linked entity to " + serviceName + " service using mimeType = " + mimeType + " and DSV = " + dataServiceVersion, headers);

                djstest.addTest(function addEntityWithInlineFeedTest(headers) {
                    var request = {
                        requestUri: categoriesFeed,
                        method: "POST",
                        headers: headers,
                        data: {
                            CategoryID: 42,
                            Name: "Olive Products",
                            Foods: [newFood]
                        }
                    };

                    djstest.assertsExpected(3);
                    verifyRequest(request, function () {
                        ODataReadOracle.readEntry(foodsFeed + "(" + newFood.FoodID + ")", function (actualData) {
                            djstest.assertAreEqual(actualData.Name, newFood.Name, "Verify inline entities were added");
                            djstest.done();
                        }, headers ? headers.Accept : undefined);
                    });
                }, "Add new entity with inline feed to " + serviceName + " service using mimeType = " + mimeType + " and DSV = " + dataServiceVersion, headers);

                djstest.addTest(function addEntityWithInlineEntryTest(headers) {
                    var request = {
                        requestUri: foodsFeed,
                        method: "POST",
                        headers: headers,
                        data: $.extend({}, newFood, {
                            Category: {
                                "__metadata": { uri: "" },
                                CategoryID: 42,
                                Name: "Olive Products"
                            }
                        })
                    };

                    djstest.assertsExpected(3);
                    verifyRequest(request, function () {
                        ODataReadOracle.readEntry(categoriesFeed + "(" + request.data.Category.CategoryID + ")", function (actualData) {
                            djstest.assertAreEqual(actualData.Name, request.data.Category.Name, "Verify inline entities were added");
                            djstest.done();
                        }, headers ? headers.Accept : undefined);
                    });
                }, "Add new entity with inline entry to " + serviceName + " service using mimeType = " + mimeType + " and DSV = " + dataServiceVersion, headers);

                djstest.addTest(function updateEntityTest(headers) {
                    var request = {
                        requestUri: categoriesFeed + "(0)",
                        method: "PUT",
                        headers: headers,
                        data: {
                            CategoryID: 0,
                            Name: "Updated Category"
                        }
                    };

                    djstest.assertsExpected(2);
                    verifyRequest(request, djstest.done);
                }, "Update entity to " + serviceName + " service using mimeType = " + mimeType + " and DSV = " + dataServiceVersion, headers);

                if (serviceName === "V3") {
                    djstest.addTest(function updateEntityTest(headers) {
                        var request = {
                            requestUri: foodsFeed + "(0)",
                            method: "POST",
                            headers: $.extend({}, headers, { "X-HTTP-Method": "MERGE" }),
                            data: {
                                __metadata: { type: "DataJS.Tests.V3.Food" },
                                AlternativeNames: {
                                    results: ["one", "two"]
                                }
                            }
                        };

                        djstest.assertsExpected(2);
                        verifyRequest(request, djstest.done);
                    }, "Update collection property to " + serviceName + " service using mimeType = " + mimeType + " and DSV = " + dataServiceVersion, headers);
                }

                if (mimeType !== "application/atom+xml") {
                    djstest.addTest(function updatePrimitivePropertyTest(headers) {
                        var request = {
                            requestUri: categoriesFeed + "(0)/Name",
                            method: "PUT",
                            headers: headers,
                            data: { Name: "Updated Category" }
                        };

                        djstest.assertsExpected(2);
                        verifyRequest(request, djstest.done);
                    }, "Update primitive property to " + serviceName + " service using mimeType = " + mimeType + " and DSV = " + dataServiceVersion, headers);
                }

                djstest.addTest(function updateLinkedEntityTest(headers) {
                    var request = {
                        requestUri: categoriesFeed + "(0)/Foods(0)",
                        method: "PUT",
                        headers: headers,
                        data: {
                            "__metadata": { type: testFoodType },
                            Name: "Updated Food"
                        }
                    };

                    djstest.assertsExpected(2);
                    verifyRequest(request, djstest.done);
                }, "Update linked entity to " + serviceName + " service using mimeType = " + mimeType + " and DSV = " + dataServiceVersion, headers);

                djstest.addTest(function mergeEntityTest(headers) {
                    var request = {
                        requestUri: categoriesFeed + "(0)",
                        method: "POST",
                        headers: $.extend({}, headers, { "X-HTTP-Method": "MERGE" }),
                        data: { Name: "Merged Category" }
                    };

                    djstest.assertsExpected(2);
                    verifyRequest(request, djstest.done);
                }, "Merge entity to " + serviceName + " service using mimeType = " + mimeType + " and DSV = " + dataServiceVersion, headers);

                djstest.addTest(function mergeLinkedEntityTest(headers) {
                    var request = {
                        requestUri: categoriesFeed + "(0)/Foods(0)",
                        method: "POST",
                        headers: $.extend({}, headers, { "X-HTTP-Method": "MERGE" }),
                        data: {
                            "__metadata": { type: testFoodType },
                            Name: "Merged Food"
                        }
                    };

                    djstest.assertsExpected(2);
                    verifyRequest(request, djstest.done);
                }, "Merge linked entity to " + serviceName + " service using mimeType = " + mimeType + " and DSV = " + dataServiceVersion, headers);

                djstest.addTest(function deleteEntityTest(headers) {
                    var endpoint = categoriesFeed + "(0)";
                    djstest.assertsExpected(2);
                    OData.request({
                        requestUri: endpoint,
                        method: "DELETE",
                        headers: headers
                    }, function (data, response) {
                        djstest.assertAreEqual(response.statusCode, httpStatusCode.noContent, "Verify response code");
                        $.ajax({
                            url: endpoint,
                            error: function (xhr) {
                                djstest.assertAreEqual(xhr.status, httpStatusCode.notFound, "Verify response code of attempted retrieval after delete");
                                djstest.done();
                            },
                            success: function () {
                                djstest.fail("Delete failed: querying the endpoint did not return expected response code");
                                djstest.done();
                            }
                        });
                    }, unexpectedErrorHandler);
                }, "Delete entity from " + serviceName + " service using mimeType = " + mimeType + " and DSV = " + dataServiceVersion, headers);
            });
        });
    });
})(this);