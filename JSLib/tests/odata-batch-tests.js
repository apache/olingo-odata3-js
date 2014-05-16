/// <reference path="../src/odata-net.js" />
/// <reference path="../src/odata.js" />
/// <reference path="common/djstest.js" />
/// <reference path="common/mockHttpClient.js" />

// odata-batch-tests.js

(function (window, undefined) {
    // DATAJS INTERNAL START
    var defaultAcceptString = "application/atomsvc+xml;q=0.8, application/json;odata=fullmetadata;q=0.7, application/json;q=0.5, */*;q=0.1";

    var testPayload = {
        __metadata: {
            uri: "http://services.odata.org/OData/OData.svc/entry id",
            id_extensions: [],
            type: "the type",
            type_extensions: [],
            properties: {
                Untyped: {
                    type: null,
                    extensions: []
                },
                Typed: {
                    type: "Edm.Int32",
                    extensions: []
                }
            }
        },
        Untyped: "untyped value",
        Typed: 100
    };

    var atomPayload = OData.atomSerializer(OData.atomHandler, testPayload, { dataServiceVersion: "2.0" });
    var jsonPayload = OData.jsonSerializer(OData.jsonHandler, testPayload, { dataServiceVersion: "1.0" });

    djstest.addTest(function writeRequestTest() {
        var request = {
            headers: { "Content-Type": "plain/text; charset=utf-8", Accept: "*/*", DataServiceVersion: "2.0" },
            requestUri: "http://temp.org",
            method: "GET",
            body: "test request"
        };
        var expected = "GET http://temp.org HTTP/1.1\r\n" +
                       "Content-Type: plain/text; charset=utf-8\r\n" +
                       "Accept: */*\r\n" +
                       "DataServiceVersion: 2.0\r\n" +
                       "\r\n" +
                       "test request";

        var actual = OData.writeRequest(request);
        djstest.assertAreEqual(actual, expected, "WriteRequest serializes a request properly");
        djstest.done();
    });

    djstest.addTest(function serializeSimpleBatchTest() {

        var request = {
            requestUri: "http://temp.org",
            method: "POST",
            data: { __batchRequests: [
                { requestUri: "http://feed(1)", headers: {} },
                { requestUri: "http://feed(2)", headers: { "Accept": "application/json;odata=verbose" }, method: "GET" }
            ]
            }
        };

        var template = "\r\n--<batchBoundary>\r\n" +
                       "Content-Type: application/http\r\n" +
                       "Content-Transfer-Encoding: binary\r\n" +
                       "\r\n" +
                       "GET http://feed(1) HTTP/1.1\r\n" +
                       "Accept: " + defaultAcceptString + "\r\n" +
                       "MaxDataServiceVersion: 3.0\r\n" +
                       "\r\n" +
                       "\r\n--<batchBoundary>\r\n" +
                       "Content-Type: application/http\r\n" +
                       "Content-Transfer-Encoding: binary\r\n" +
                       "\r\n" +
                       "GET http://feed(2) HTTP/1.1\r\n" +
                       "Accept: application/json;odata=verbose\r\n" +
                       "MaxDataServiceVersion: 3.0\r\n" +
                       "\r\n" +
                       "\r\n--<batchBoundary>--\r\n";

        MockHttpClient.clear().addRequestVerifier(request.requestUri, function (request) {
            var cType = OData.contentType(request.headers["Content-Type"]);
            var boundary = cType.properties["boundary"];
            var expected = template.replace(/<batchBoundary>/g, boundary);

            djstest.assert(boundary, "Request content type has its boundary set");
            djstest.assertAreEqual(request.body, expected, "Request body is serialized properly");
            djstest.done();
        });

        OData.request(request, null, null, OData.batchHandler, MockHttpClient);
    });

    djstest.addTest(function serializeComplexBatchTest() {

        var request = {
            requestUri: "http://temp.org",
            method: "POST",
            data: { __batchRequests: [
                { requestUri: "http://feed(1)", headers: {} },
                { requestUri: "http://feed(2)", headers: { "Accept": "application/json;odata=verbose" }, method: "GET" },
                { __changeRequests: [
                        { requestUri: "http://feed(1)", headers: {}, method: "POST", data: testPayload },
                        { requestUri: "http://feed(2)", headers: { "Content-Type": "application/atom+xml", DataServiceVersion: "2.0" }, method: "PUT", data: testPayload }
                        ]
                },
                { requestUri: "http://feed(1)", headers: {} }
            ]
            }
        };

        var template = "\r\n--<batchBoundary>\r\n" +
                       "Content-Type: application/http\r\n" +
                       "Content-Transfer-Encoding: binary\r\n" +
                       "\r\n" +
                       "GET http://feed(1) HTTP/1.1\r\n" +
                       "Accept: " + defaultAcceptString + "\r\n" +
                       "MaxDataServiceVersion: 3.0\r\n" +
                       "\r\n" +
                       "\r\n--<batchBoundary>\r\n" +
                       "Content-Type: application/http\r\n" +
                       "Content-Transfer-Encoding: binary\r\n" +
                       "\r\n" +
                       "GET http://feed(2) HTTP/1.1\r\n" +
                       "Accept: application/json;odata=verbose\r\n" +
                       "MaxDataServiceVersion: 3.0\r\n" +
                       "\r\n" +
                       "\r\n--<batchBoundary>\r\n" +
                       "Content-Type: multipart/mixed; boundary=<changesetBoundary>\r\n" +
                       "\r\n--<changesetBoundary>\r\n" +
                       "Content-Type: application/http\r\n" +
                       "Content-Transfer-Encoding: binary\r\n" +
                       "\r\n" +
                       "POST http://feed(1) HTTP/1.1\r\n" +
                       "Accept: " + defaultAcceptString + "\r\n" +
                       "DataServiceVersion: 1.0\r\n" +
                       "Content-Type: application/json\r\n" +
                       "MaxDataServiceVersion: 3.0\r\n" +
                       "\r\n" +
                       jsonPayload +
                       "\r\n--<changesetBoundary>\r\n" +
                       "Content-Type: application/http\r\n" +
                       "Content-Transfer-Encoding: binary\r\n" +
                       "\r\n" +
                       "PUT http://feed(2) HTTP/1.1\r\n" +
                       "Content-Type: application/atom+xml\r\n" +
                       "DataServiceVersion: 2.0\r\n" +
                       "Accept: " + defaultAcceptString + "\r\n" +
                       "MaxDataServiceVersion: 3.0\r\n" +
                       "\r\n" +
                       atomPayload +
                       "\r\n--<changesetBoundary>--\r\n" +
                       "\r\n--<batchBoundary>\r\n" +
                       "Content-Type: application/http\r\n" +
                       "Content-Transfer-Encoding: binary\r\n" +
                       "\r\n" +
                       "GET http://feed(1) HTTP/1.1\r\n" +
                       "Accept: " + defaultAcceptString + "\r\n" +
                       "MaxDataServiceVersion: 3.0\r\n" +
                       "\r\n" +
                       "\r\n--<batchBoundary>--\r\n";

        MockHttpClient.clear().addRequestVerifier(request.requestUri, function (request) {
            // Get the boundaries from the request.
            var start = request.body.indexOf("multipart/mixed");
            var end = request.body.indexOf("\r\n", start);

            var csetBoundary = OData.contentType(request.body.substring(start, end)).properties["boundary"];
            var batchBoundary = OData.contentType(request.headers["Content-Type"]).properties["boundary"];

            var expected = template.replace(/<batchBoundary>/g, batchBoundary);
            expected = expected.replace(/<changesetBoundary>/g, csetBoundary);

            djstest.assert(batchBoundary, "Request content type has its boundary set");
            djstest.assert(csetBoundary, "Changeset content type has its boundary set");
            djstest.assertAreEqual(request.body, expected, "Request body is serialized properly");
            djstest.done();
        });

        OData.request(request, null, null, OData.batchHandler, MockHttpClient);
    });

    djstest.addTest(function serializeChangeSetTest() {
        var request = {
            requestUri: "http://temp.org",
            method: "POST",
            data: {
                __batchRequests: [
                    { __changeRequests: [
                        { requestUri: "http://feed(1)", headers: {}, method: "POST", data: testPayload },
                        { requestUri: "http://feed(2)", headers: { "Content-Type": "application/atom+xml", DataServiceVersion: "2.0" }, method: "PUT", data: testPayload }
                        ]
                    }
            ]
            }
        };

        var template = "\r\n--<batchBoundary>\r\n" +
                       "Content-Type: multipart/mixed; boundary=<changesetBoundary>\r\n" +
                       "\r\n--<changesetBoundary>\r\n" +
                       "Content-Type: application/http\r\n" +
                       "Content-Transfer-Encoding: binary\r\n" +
                       "\r\n" +
                       "POST http://feed(1) HTTP/1.1\r\n" +
                       "Accept: " + defaultAcceptString + "\r\n" +
                       "DataServiceVersion: 1.0\r\n" +
                       "Content-Type: application/json\r\n" +
                       "MaxDataServiceVersion: 3.0\r\n" +
                       "\r\n" +
                       jsonPayload +
                       "\r\n--<changesetBoundary>\r\n" +
                       "Content-Type: application/http\r\n" +
                       "Content-Transfer-Encoding: binary\r\n" +
                       "\r\n" +
                       "PUT http://feed(2) HTTP/1.1\r\n" +
                       "Content-Type: application/atom+xml\r\n" +
                       "DataServiceVersion: 2.0\r\n" +
                       "Accept: " + defaultAcceptString + "\r\n" +
                       "MaxDataServiceVersion: 3.0\r\n" +
                       "\r\n" +
                       atomPayload +
                       "\r\n--<changesetBoundary>--\r\n" +
                       "\r\n--<batchBoundary>--\r\n";

        MockHttpClient.clear().addRequestVerifier(request.requestUri, function (request) {
            // Get the boundaries from the request.
            var start = request.body.indexOf("multipart/mixed");
            var end = request.body.indexOf("\r\n", start);

            var csetBoundary = OData.contentType(request.body.substring(start, end)).properties["boundary"];
            var batchBoundary = OData.contentType(request.headers["Content-Type"]).properties["boundary"];

            var expected = template.replace(/<batchBoundary>/g, batchBoundary);
            expected = expected.replace(/<changesetBoundary>/g, csetBoundary);

            djstest.assert(batchBoundary, "Request content type has its boundary set");
            djstest.assert(csetBoundary, "Changeset content type has its boundary set");
            djstest.assertAreEqual(request.body, expected, "Request body is serialized properly");
            djstest.done();
        });

        OData.request(request, null, null, OData.batchHandler, MockHttpClient);
    });

    djstest.addTest(function serializeNestedChangeSetsTest() {
        var request = {
            requestUri: "http://temp.org",
            method: "POST",
            data: testPayload
        };

        djstest.expectException(function () {
            OData.request(request, null, null, OData.batchHandler);
        });

        djstest.done();
    });

    djstest.addTest(function serializeNonBatchObjectTest() {
        var request = {
            requestUri: "http://temp.org",
            method: "POST",
            data: {
                __batchRequests: [
                    { __changeRequests: [
                        { __changeRequests: [
                            { requestUri: "http://feed(2)", headers: { "Content-Type": "application/atom+xml", DataServiceVersion: "2.0" }, method: "PUT", data: testPayload }
                        ]
                        }
                    ]
                    }
            ]
            }
        };

        djstest.expectException(function () {
            OData.request(request, null, null, OData.batchHandler);
        });

        djstest.done();
    });

    djstest.addTest(function readSimpleBatchTest() {
        var response = {
            statusCode: 202,
            statusText: "Accepted",
            headers: {
                "Content-Type": "multipart/mixed; boundary=batchresponse_9402a3ab-260f-4fa4-af01-0b30db397c8d"
            },
            body: "--batchresponse_9402a3ab-260f-4fa4-af01-0b30db397c8d\r\n\
Content-Type: application/http\r\n\
Content-Transfer-Encoding: binary\r\n\
\r\n\
HTTP/1.1 200 OK\r\n\
Cache-Control: no-cache\r\n\
DataServiceVersion: 1.0;\r\n\
Content-Type: application/atom+xml;charset=utf-8\r\n\
\r\n\
<?xml version='1.0' encoding='utf-8' standalone='yes'?>\r\n\
<entry xml:base='http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/' xmlns:d='http://schemas.microsoft.com/ado/2007/08/dataservices' xmlns:m='http://schemas.microsoft.com/ado/2007/08/dataservices/metadata' xmlns='http://www.w3.org/2005/Atom'>\r\n\
  <id>http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(1)</id>\r\n\
  <title type='text'></title>\r\n\
  <updated>2011-01-11T08:41:17Z</updated>\r\n\
  <author>\r\n\
    <name />\r\n\
  </author>\r\n\
  <link rel='edit' title='Category' href='Categories(1)' />\r\n\
  <link rel='http://schemas.microsoft.com/ado/2007/08/dataservices/related/Foods' type='application/atom+xml;type=feed' title='Foods' href='Categories(1)/Foods' />\r\n\
  <category term='DataJS.Tests.Category' scheme='http://schemas.microsoft.com/ado/2007/08/dataservices/scheme' />\r\n\
  <content type='application/xml'>\r\n\
    <m:properties>\r\n\
      <d:CategoryID m:type='Edm.Int32'>1</d:CategoryID>\r\n\
      <d:Name>Condiments</d:Name>\r\n\
    </m:properties>\r\n\
  </content>\r\n\
</entry>\r\n\
--batchresponse_9402a3ab-260f-4fa4-af01-0b30db397c8d\r\n\
Content-Type: application/http\r\n\
Content-Transfer-Encoding: binary\r\n\
\r\n\
HTTP/1.1 200 OK\r\n\
Cache-Control: no-cache\r\n\
DataServiceVersion: 1.0;\r\n\
Content-Type: application/json;odata=verbose;charset=utf-8\r\n\
\r\n\
{\r\n\
\"d\" : {\r\n\
\"__metadata\": {\r\n\
\"uri\": \"http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(2)\", \"type\": \"DataJS.Tests.Category\"\r\n\
}, \"CategoryID\": 1, \"Name\": \"Condiments\", \"Foods\": {\r\n\
\"__deferred\": {\r\n\
\"uri\": \"http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(2)/Foods\"\r\n\
}\r\n\
}\r\n\
}\r\n\
}\r\n\
--batchresponse_9402a3ab-260f-4fa4-af01-0b30db397c8d--\r\n\
"
        };

        MockHttpClient.clear().addResponse("http://testuri.org", response);
        OData.read("http://testuri.org", function (data, response) {
            djstest.assert(data.__batchResponses, "data.__batchResponses is defined");
            djstest.assertAreEqual(data.__batchResponses[0].data.__metadata.uri, "http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(1)", "part 1 of the response was read");
            djstest.assertAreEqual(data.__batchResponses[1].data.__metadata.uri, "http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(2)", "part 2 of the response was read");
            djstest.done();
        }, null, OData.batchHandler, MockHttpClient);
    });

    djstest.addTest(function readBatchWithChangesetTest() {
        var response = {
            statusCode: 202,
            statusText: "Accepted",
            headers: {
                "Content-Type": "multipart/mixed; boundary=batchresponse_fb681875-73dc-4e62-9898-a0af89021341"
            },
            body: "--batchresponse_fb681875-73dc-4e62-9898-a0af89021341\r\n\
Content-Type: application/http\r\n\
Content-Transfer-Encoding: binary\r\n\
\r\n\
HTTP/1.1 200 OK\r\n\
Cache-Control: no-cache\r\n\
DataServiceVersion: 1.0;\r\n\
Content-Type: application/atom+xml;charset=utf-8\r\n\
\r\n\
<?xml version=\"1.0\" encoding=\"utf-8\" standalone=\"yes\"?>\r\n\
<entry xml:base=\"http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/\" xmlns:d=\"http://schemas.microsoft.com/ado/2007/08/dataservices\" xmlns:m=\"http://schemas.microsoft.com/ado/2007/08/dataservices/metadata\" xmlns=\"http://www.w3.org/2005/Atom\">\r\n\
  <id>http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(1)</id>\r\n\
  <title type=\"text\"></title>\r\n\
  <updated>2011-01-12T02:17:28Z</updated>\r\n\
  <author>\r\n\
    <name />\r\n\
  </author>\r\n\
  <link rel=\"edit\" title=\"Category\" href=\"Categories(1)\" />\r\n\
  <link rel=\"http://schemas.microsoft.com/ado/2007/08/dataservices/related/Foods\" type=\"application/atom+xml;type=feed\" title=\"Foods\" href=\"Categories(1)/Foods\" />\r\n\
  <category term=\"DataJS.Tests.Category\" scheme=\"http://schemas.microsoft.com/ado/2007/08/dataservices/scheme\" />\r\n\
  <content type=\"application/xml\">\r\n\
    <m:properties>\r\n\
      <d:CategoryID m:type=\"Edm.Int32\">1</d:CategoryID>\r\n\
      <d:Name>Condiments</d:Name>\r\n\
    </m:properties>\r\n\
  </content>\r\n\
</entry>\r\n\
--batchresponse_fb681875-73dc-4e62-9898-a0af89021341\r\n\
Content-Type: multipart/mixed; boundary=changesetresponse_f1fc1219-9c08-4b01-8465-3a1c73086449\r\n\
\r\n\
--changesetresponse_f1fc1219-9c08-4b01-8465-3a1c73086449\r\n\
Content-Type: application/http\r\n\
Content-Transfer-Encoding: binary\r\n\
\r\n\
HTTP/1.1 204 No Content\r\n\
Cache-Control: no-cache\r\n\
DataServiceVersion: 1.0;\r\n\
\r\n\
\r\n\
--changesetresponse_f1fc1219-9c08-4b01-8465-3a1c73086449\r\n\
Content-Type: application/http\r\n\
Content-Transfer-Encoding: binary\r\n\
\r\n\
HTTP/1.1 201 Created\r\n\
Cache-Control: no-cache\r\n\
DataServiceVersion: 1.0;\r\n\
Content-Type: application/atom+xml;charset=utf-8\r\n\
Location: http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(42)\r\n\
\r\n\
<?xml version=\"1.0\" encoding=\"utf-8\" standalone=\"yes\"?>\r\n\
<entry xml:base=\"http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/\" xmlns:d=\"http://schemas.microsoft.com/ado/2007/08/dataservices\" xmlns:m=\"http://schemas.microsoft.com/ado/2007/08/dataservices/metadata\" xmlns=\"http://www.w3.org/2005/Atom\">\r\n\
  <id>http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(42)</id>\r\n\
  <title type=\"text\"></title>\r\n\
  <updated>2011-01-12T02:17:28Z</updated>\r\n\
  <author>\r\n\
    <name />\r\n\
  </author>\r\n\
  <link rel=\"edit\" title=\"Category\" href=\"Categories(42)\" />\r\n\
  <link rel=\"http://schemas.microsoft.com/ado/2007/08/dataservices/related/Foods\" type=\"application/atom+xml;type=feed\" title=\"Foods\" href=\"Categories(42)/Foods\" />\r\n\
  <category term=\"DataJS.Tests.Category\" scheme=\"http://schemas.microsoft.com/ado/2007/08/dataservices/scheme\" />\r\n\
  <content type=\"application/xml\">\r\n\
    <m:properties>\r\n\
      <d:CategoryID m:type=\"Edm.Int32\">42</d:CategoryID>\r\n\
      <d:Name>New Category</d:Name>\r\n\
    </m:properties>\r\n\
  </content>\r\n\
</entry>\r\n\
--changesetresponse_f1fc1219-9c08-4b01-8465-3a1c73086449--\r\n\
--batchresponse_fb681875-73dc-4e62-9898-a0af89021341\r\n\
Content-Type: application/http\r\n\
Content-Transfer-Encoding: binary\r\n\
\r\n\
HTTP/1.1 200 OK\r\n\
Cache-Control: no-cache\r\n\
DataServiceVersion: 1.0;\r\n\
Content-Type: application/json;odata=verbose;charset=utf-8\r\n\
\r\n\
{\r\n\
\"d\" : {\r\n\
\"__metadata\": {\r\n\
\"uri\": \"http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(2)\", \"type\": \"DataJS.Tests.Category\"\r\n\
}, \"CategoryID\": 1, \"Name\": \"Condiments\", \"Foods\": {\r\n\
\"__deferred\": {\r\n\
\"uri\": \"http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(2)/Foods\"\r\n\
}\r\n\
}\r\n\
}\r\n\
}\r\n\
--batchresponse_fb681875-73dc-4e62-9898-a0af89021341--\r\n\
"
        };

        MockHttpClient.clear().addResponse("http://testuri.org", response);
        OData.read("http://testuri.org", function (data, response) {

            var batchResponses = data.__batchResponses;
            djstest.assert(batchResponses, "data contains the batch responses");

            var changesetResponses = batchResponses[1].__changeResponses;
            djstest.assert(changesetResponses, "data contains the change set responses");

            djstest.assertAreEqual(batchResponses[0].data.__metadata.uri, "http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(1)", "part 1 of the response was read");
            djstest.assertAreEqual(changesetResponses[0].data, undefined, "No data defined for no content only response in part 1 of the changset");
            djstest.assertAreEqual(changesetResponses[1].data.__metadata.uri, "http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(42)", "part 2 of the changeset response was read");
            djstest.assertAreEqual(batchResponses[2].data.__metadata.uri, "http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(2)", "part 3 of the response was read");
            djstest.done();
        }, null, OData.batchHandler, MockHttpClient);
    });

    djstest.addTest(function readBatchWithErrorPartTest() {
        var response = {
            statusCode: 202,
            statusText: "Accepted",
            headers: {
                "Content-Type": "multipart/mixed; boundary=batchresponse_9402a3ab-260f-4fa4-af01-0b30db397c8d"
            },
            body: "--batchresponse_9402a3ab-260f-4fa4-af01-0b30db397c8d\r\n\
Content-Type: application/http\r\n\
Content-Transfer-Encoding: binary\r\n\
\r\n\
HTTP/1.1 200 OK\r\n\
Cache-Control: no-cache\r\n\
DataServiceVersion: 1.0;\r\n\
Content-Type: application/atom+xml;charset=utf-8\r\n\
\r\n\
<?xml version='1.0' encoding='utf-8' standalone='yes'?>\r\n\
<entry xml:base='http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/' xmlns:d='http://schemas.microsoft.com/ado/2007/08/dataservices' xmlns:m='http://schemas.microsoft.com/ado/2007/08/dataservices/metadata' xmlns='http://www.w3.org/2005/Atom'>\r\n\
  <id>http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(1)</id>\r\n\
  <title type='text'></title>\r\n\
  <updated>2011-01-11T08:41:17Z</updated>\r\n\
  <author>\r\n\
    <name />\r\n\
  </author>\r\n\
  <link rel='edit' title='Category' href='Categories(1)' />\r\n\
  <link rel='http://schemas.microsoft.com/ado/2007/08/dataservices/related/Foods' type='application/atom+xml;type=feed' title='Foods' href='Categories(1)/Foods' />\r\n\
  <category term='DataJS.Tests.Category' scheme='http://schemas.microsoft.com/ado/2007/08/dataservices/scheme' />\r\n\
  <content type='application/xml'>\r\n\
    <m:properties>\r\n\
      <d:CategoryID m:type='Edm.Int32'>1</d:CategoryID>\r\n\
      <d:Name>Condiments</d:Name>\r\n\
    </m:properties>\r\n\
  </content>\r\n\
</entry>\r\n\
--batchresponse_9402a3ab-260f-4fa4-af01-0b30db397c8d\r\n\
Content-Type: application/http\r\n\
Content-Transfer-Encoding: binary\r\n\
\r\n\
HTTP/1.1 400 Bad Request\r\n\
DataServiceVersion: 1.0;\r\n\
Content-Type: application/xml\r\n\
\r\n\
<?xml version=\"1.0\" encoding=\"utf-8\" standalone=\"yes\"?>\r\n\
<error xmlns=\"http://schemas.microsoft.com/ado/2007/08/dataservices/metadata\">\r\n\
  <code></code>\r\n\
  <message xml:lang=\"en-US\">Error processing request stream.</message>\r\n\
</error>\r\n\
--batchresponse_9402a3ab-260f-4fa4-af01-0b30db397c8d--\r\n\
"
        };

        MockHttpClient.clear().addResponse("http://testuri.org", response);
        OData.read("http://testuri.org", function (data, response) {
            var batchResponses = data.__batchResponses;
            djstest.assert(batchResponses, "data.__batchResponses is defined");
            djstest.assertAreEqual(batchResponses.length, 2, "batch contains two responses");
            djstest.assertAreEqual(batchResponses[0].data.__metadata.uri, "http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(1)", "part 1 of the response was read");
            djstest.assert(batchResponses[1].response, "part 2 of the response was read");
            djstest.done();
        }, null, OData.batchHandler, MockHttpClient);
    });


    djstest.addTest(function readMalformedMultipartResponseThrowsException() {
        var response = {
            statusCode: 202,
            statusText: "Accepted",
            headers: {
                "Content-Type": "multipart/mixed; boundary=batchresponse_fb681875-73dc-4e62-9898-a0af89021341"
            },
            body: "--batchresponse_fb681875-73dc-4e62-9898-a0af89021341\r\n\
Content-Type: application/http\r\n\
Content-Transfer-Encoding: binary\r\n\
\r\n\
HTTP/1.1 200 OK\r\n\
Cache-Control: no-cache\r\n\
DataServiceVersion: 1.0;\r\n\
Content-Type: application/atom+xml;charset=utf-8\r\n\
\r\n\
<?xml version=\"1.0\" encoding=\"utf-8\" standalone=\"yes\"?>\r\n\
<entry xml:base=\"http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/\" xmlns:d=\"http://schemas.microsoft.com/ado/2007/08/dataservices\" xmlns:m=\"http://schemas.microsoft.com/ado/2007/08/dataservices/metadata\" xmlns=\"http://www.w3.org/2005/Atom\">\r\n\
  <id>http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(1)</id>\r\n\
  <title type=\"text\"></title>\r\n\
  <updated>2011-01-12T02:17:28Z</updated>\r\n\
  <author>\r\n\
    <name />\r\n\
  </author>\r\n\
  <link rel=\"edit\" title=\"Category\" href=\"Categories(1)\" />\r\n\
  <link rel=\"http://schemas.microsoft.com/ado/2007/08/dataservices/related/Foods\" type=\"application/atom+xml;type=feed\" title=\"Foods\" href=\"Categories(1)/Foods\" />\r\n\
  <category term=\"DataJS.Tests.Category\" scheme=\"http://schemas.microsoft.com/ado/2007/08/dataservices/scheme\" />\r\n\
  <content type=\"application/xml\">\r\n\
    <m:properties>\r\n\
      <d:CategoryID m:type=\"Edm.Int32\">1</d:CategoryID>\r\n\
      <d:Name>Condiments</d:Name>\r\n\
    </m:properties>\r\n\
  </content>\r\n\
</entry>\r\n\
--batchresponse_fb681875-73dc-4e62-9898-a0af89021341\r\n\
Content-Type: multipart/mixed; boundary=changesetresponse_16098575-c5db-405e-8142-61f012360f0c\r\n\
\r\n\
<?xml version=\"1.0\" encoding=\"utf-8\" standalone=\"yes\"?>\r\n\
<error xmlns=\"http://schemas.microsoft.com/ado/2007/08/dataservices/metadata\">\r\n\
  <code></code>\r\n\
  <message xml:lang=\"en-US\">GET operation cannot be specified in a change set. Only PUT, POST and DELETE operations can be specified in a change set.</message>\r\n\
</error>\r\n\
--batchresponse_fb681875-73dc-4e62-9898-a0af89021341--\r\n\
"
        };

        MockHttpClient.clear().addResponse("http://testuri.org", response);
        OData.read("http://testuri.org", function (data, response) {
            var batchResponses = data.__batchResponses;
            djstest.assert(batchResponses, "data.__batchResponses is defined");
            djstest.assertAreEqual(batchResponses.length, 2, "batch contains two responses");
            djstest.assertAreEqual(batchResponses[0].data.__metadata.uri, "http://localhost:8989/tests/endpoints/FoodStoreDataService.svc/Categories(1)", "part 1 of the response was read");

            var error = batchResponses[1].__changeResponses[0];
            djstest.assert(error.response.body.indexOf("GET operation cannot be specified in a change set") > -1, "Response contains expected message");
            djstest.done();
        }, null, OData.batchHandler, MockHttpClient);
        djstest.done();
    });

    djstest.addTest(function batchRequestContextIsPushedToThePartsHandlersTest() {
        var testHandler = {
            read: function (response, context) {
                djstest.assert(context.recognizeDates, "Recognize dates was set properly on the part request context");
            },
            write: function (request, context) {
                djstest.assert(context.recognizeDates, "Recognize dates was set properly on the part request context");
            }
        };

        var batch = {
            headers: {},
            __batchRequests: [
                { requestUri: "http://someUri" },
                { __changeRequests: [
                     { requestUri: "http://someUri", method: "POST", data: { p1: 500} }
                  ]
                }
            ]
        };

        var request = { requestUri: "http://someuri", headers: {}, data: batch };
        var response = {
            statusCode: 202,
            statusText: "Accepted",
            headers: {
                "Content-Type": "multipart/mixed; boundary=batchresponse_fb681875-73dc-4e62-9898-a0af89021341"
            },
            body: '--batchresponse_fb681875-73dc-4e62-9898-a0af89021341\r\n' +
                  'Content-Type: application/http\r\n' +
                  'Content-Transfer-Encoding: binary\r\n' +
                  '\r\n' +
                  'HTTP/1.1 200 OK\r\n' +
                  'Cache-Control: no-cache\r\n' +
                  'DataServiceVersion: 1.0;\r\n' +
                  'Content-Type: application/json\r\n' +
                  '\r\n' +
                  '{ "p1": 500 }\r\n' +
                  '\r\n' +
                  '--batchresponse_fb681875-73dc-4e62-9898-a0af89021341--\r\n'
        };

        var oldPartHandler = OData.batchHandler.partHandler;

        OData.batchHandler.partHandler = testHandler;

        OData.batchHandler.write(request, { recognizeDates: true });
        OData.batchHandler.read(response, { recognizeDates: true });

        OData.batchHandler.partHandler = oldPartHandler;

        djstest.done();
    });


    // DATAJS INTERNAL END
})(this);
