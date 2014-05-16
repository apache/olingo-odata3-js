/// <reference path="../src/odata-atom.js" />
/// <reference path="../src/odata-xml.js" />
/// <reference path="../src/odata-metadata.js" />
/// <reference path="../src/odata.js" />
/// <reference path="common/djstest.js" />

// odata-metadata-tests.js

(function (window, undefined) {
    djstest.addTest(function testMetadataHandler() {
        // Test cases as result / model tuples.
        var cases = [
            { i: {}, e: undefined },
            { i: { headers: { "Content-Type": "application/xml" }, body: '<edmx:Edmx Version="1.0" xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx" />' },
                e: { version: "1.0" }
            }
        ];

        var i, len;
        for (i = 0, len = cases.length; i < len; i++) {
            var response = cases[i].i;
            var testClient = { request: function (r, success, error) { success(response); } };
            window.OData.read("foo", function (data) {
                djstest.assertAreEqualDeep(data, cases[i].e, "handler result matches target");
            }, function (err) {
                djstest.fail(err.message);
            }, window.OData.metadataHandler, testClient);
        }

        djstest.done();
    });

    // DATAJS INTERNAL START
    djstest.addTest(function testScriptCase() {
        // Test cases as input/result pairs.
        var cases = [
            { i: null, e: null },
            { i: "", e: "" },
            { i: "a", e: "a" },
            { i: "A", e: "a" },
            { i: "TestCase", e: "testCase" },
            { i: "123abc", e: "123abc" },
            { i: "ITEM", e: "ITEM" }
        ];

        var i, len;
        for (i = 0, len = cases.length; i < len; i++) {
            djstest.assertAreEqual(window.OData.scriptCase(cases[i].i), cases[i].e, "processed input matches expected value");
        }

        djstest.done();
    });

    djstest.addTest(function testGetChildSchema() {
        // Test cases as input parent / input element / result tuples.
        var schema = window.OData.schema;
        var cases = [
            { ip: schema.elements.EntityType, ie: "Property", e: { isArray: true, propertyName: "property"} },
            { ip: schema.elements.EntityType, ie: "Key", e: { isArray: false, propertyName: "key"} },
            { ip: schema.elements.EntityType, ie: "Documentation", e: { isArray: true, propertyName: "documentation"} },
            { ip: schema.elements.EntitySet, ie: "Documentation", e: { isArray: true, propertyName: "documentation"} },
            { ip: schema.elements.EntitySet, ie: "SomethingElse", e: null },
            { ip: schema.elements.RowType, ie: "SomethingElse", e: null },
            { ip: schema.elements.Property, ie: "Name", e: null} // this is an attribute, not an element, thus it's no found
        ];

        var i, len;
        for (i = 0, len = cases.length; i < len; i++) {
            var result = window.OData.getChildSchema(cases[i].ip, cases[i].ie);
            djstest.assertAreEqualDeep(result, cases[i].e, "getChildSchema matches target");
        }

        djstest.done();
    });

    var testCsdl = '' +
        '<?xml version="1.0" encoding="utf-8" standalone="yes"?>\r\n' +
        '<edmx:Edmx Version="1.0" xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx">\r\n' +
        '  <edmx:DataServices xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" m:DataServiceVersion="2.0">\r\n' +
        '    <Schema Namespace="TestCatalog.Model" xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" xmlns="http://schemas.microsoft.com/ado/2008/09/edm">\r\n' +
        '      <EntityType Name="Genre">\r\n' +
        '        <Key><PropertyRef Name="Name" /></Key>\r\n' +
        '        <Property Name="Name" Type="Edm.String" Nullable="false" MaxLength="50" Unicode="false" FixedLength="false" m:FC_TargetPath="SyndicationTitle" />\r\n' +
        '        <NavigationProperty Name="Titles" Relationship="TestCatalog.Model.TitleGenres" FromRole="Genres" ToRole="Titles" />\r\n' +
        '      </EntityType>\r\n' +
        '      <EntityType Name="Language">\r\n' +
        '        <Key><PropertyRef Name="Name" /></Key>\r\n' +
        '        <Property Name="Name" Type="Edm.String" Nullable="false" MaxLength="80" Unicode="false" FixedLength="false" m:FC_TargetPath="SyndicationTitle" />\r\n' +
        '        <NavigationProperty Name="Titles" Relationship="TestCatalog.Model.TitleLanguages" FromRole="Language" ToRole="Titles" />\r\n' +
        '      </EntityType>\r\n' +
        '      <EntityType Name="Person">\r\n' +
        '        <Key><PropertyRef Name="Id" /></Key>\r\n' +
        '        <Property Name="Id" Type="Edm.Int32" Nullable="false" />\r\n' +
        '        <Property Name="Name" Type="Edm.String" Nullable="false" MaxLength="80" Unicode="true" FixedLength="false" m:FC_TargetPath="SyndicationTitle" />\r\n' +
        '        <NavigationProperty Name="Awards" Relationship="TestCatalog.Model.FK_TitleAward_Person" FromRole="People" ToRole="TitleAwards" />\r\n' +
        '        <NavigationProperty Name="TitlesActedIn" Relationship="TestCatalog.Model.TitleActors" FromRole="People" ToRole="Titles" />\r\n' +
        '        <NavigationProperty Name="TitlesDirected" Relationship="TestCatalog.Model.TitleDirectors" FromRole="People" ToRole="Titles" />\r\n' +
        '      </EntityType>\r\n' +
        '      <EntityType Name="TitleAudioFormat">\r\n' +
        '        <Key><PropertyRef Name="TitleId" /><PropertyRef Name="DeliveryFormat" /><PropertyRef Name="Language" /><PropertyRef Name="Format" /></Key>\r\n' +
        '        <Property Name="TitleId" Type="Edm.String" Nullable="false" MaxLength="30" FixedLength="false" />\r\n' +
        '        <Property Name="DeliveryFormat" Type="Edm.String" Nullable="false" MaxLength="10" Unicode="false" FixedLength="false" />\r\n' +
        '        <Property Name="Language" Type="Edm.String" Nullable="false" MaxLength="30" Unicode="false" FixedLength="false" />\r\n' +
        '        <Property Name="Format" Type="Edm.String" Nullable="false" MaxLength="30" Unicode="false" FixedLength="false" />\r\n' +
        '        <NavigationProperty Name="Title" Relationship="TestCatalog.Model.FK_TitleAudioFormat_Title" FromRole="TitleAudioFormats" ToRole="Titles" />\r\n' +
        '      </EntityType>\r\n' +
        '      <EntityType Name="TitleAward">\r\n' +
        '        <Key><PropertyRef Name="Id" /></Key>\r\n' +
        '        <Property Name="Id" Type="Edm.Guid" Nullable="false" />\r\n' +
        '        <Property Name="Type" Type="Edm.String" Nullable="false" MaxLength="30" Unicode="false" FixedLength="false" />\r\n' +
        '        <Property Name="Category" Type="Edm.String" Nullable="false" MaxLength="60" Unicode="false" FixedLength="false" />\r\n' +
        '        <Property Name="Year" Type="Edm.Int32" Nullable="true" />\r\n' +
        '        <Property Name="Won" Type="Edm.Boolean" Nullable="false" />\r\n' +
        '        <NavigationProperty Name="Title" Relationship="TestCatalog.Model.FK_TitleAward_Title" FromRole="TitleAwards" ToRole="Titles" />\r\n' +
        '        <NavigationProperty Name="Person" Relationship="TestCatalog.Model.FK_TitleAward_Person" FromRole="TitleAwards" ToRole="People" />\r\n' +
        '      </EntityType>\r\n' +
        '      <EntityType Name="Title" m:HasStream="true">\r\n' +
        '        <Key><PropertyRef Name="Id" /></Key>\r\n' +
        '        <Property Name="Id" Type="Edm.String" Nullable="false" MaxLength="30" FixedLength="false" />\r\n' +
        '        <Property Name="Synopsis" Type="Edm.String" Nullable="true" MaxLength="Max" Unicode="false" FixedLength="false" m:FC_TargetPath="SyndicationSummary" m:FC_ContentKind="html" />\r\n' +
        '        <Property Name="ShortSynopsis" Type="Edm.String" Nullable="true" MaxLength="Max" Unicode="false" FixedLength="false" />\r\n' +
        '        <Property Name="AverageRating" Type="Edm.Double" Nullable="true" />\r\n' +
        '        <Property Name="ReleaseYear" Type="Edm.Int32" Nullable="true" />\r\n' +
        '        <Property Name="Url" Type="Edm.String" Nullable="true" MaxLength="200" Unicode="false" FixedLength="false" />\r\n' +
        '        <Property Name="Runtime" Type="Edm.Int32" Nullable="true" />\r\n' +
        '        <Property Name="Rating" Type="Edm.String" Nullable="true" MaxLength="10" Unicode="false" FixedLength="false" />\r\n' +
        '        <Property Name="DateModified" Type="Edm.DateTime" Nullable="false" ConcurrencyMode="Fixed" m:FC_TargetPath="SyndicationUpdated" m:FC_KeepInContent="false" />\r\n' +
        '        <Property Name="Type" Type="Edm.String" Nullable="false" MaxLength="8" Unicode="false" FixedLength="false" />\r\n' +
        '        <Property Name="BoxArt" Type="TestCatalog.Model.BoxArt" Nullable="false" />\r\n' +
        '        <Property Name="ShortName" Type="Edm.String" Nullable="false" MaxLength="200" Unicode="false" FixedLength="false" />\r\n' +
        '        <Property Name="Name" Type="Edm.String" Nullable="false" MaxLength="200" Unicode="false" FixedLength="false" m:FC_TargetPath="SyndicationTitle" />\r\n' +
        '        <Property Name="Instant" Type="TestCatalog.Model.InstantAvailability" Nullable="false" />\r\n' +
        '        <Property Name="Dvd" Type="TestCatalog.Model.DeliveryFormatAvailability" Nullable="false" />\r\n' +
        '        <Property Name="BluRay" Type="TestCatalog.Model.DeliveryFormatAvailability" Nullable="false" />\r\n' +
        '        <Property Name="TinyUrl" Type="Edm.String" Nullable="false" MaxLength="30" />\r\n' +
        '        <Property Name="WebsiteUrl" Type="Edm.String" Nullable="true" MaxLength="200" />\r\n' +
        '        <Property Name="TestApiId" Type="Edm.String" Nullable="false" MaxLength="200" />\r\n' +
        '        <NavigationProperty Name="AudioFormats" Relationship="TestCatalog.Model.FK_TitleAudioFormat_Title" FromRole="Titles" ToRole="TitleAudioFormats" />\r\n' +
        '        <NavigationProperty Name="Awards" Relationship="TestCatalog.Model.FK_TitleAward_Title" FromRole="Titles" ToRole="TitleAwards" />\r\n' +
        '        <NavigationProperty Name="Disc" Relationship="TestCatalog.Model.FK_Title_Disc" FromRole="Titles1" ToRole="Titles" />\r\n' +
        '        <NavigationProperty Name="Movie" Relationship="TestCatalog.Model.FK_Title_Movie" FromRole="Titles1" ToRole="Titles" />\r\n' +
        '        <NavigationProperty Name="Season" Relationship="TestCatalog.Model.FK_Title_Season" FromRole="Titles1" ToRole="Titles" />\r\n' +
        '        <NavigationProperty Name="Series" Relationship="TestCatalog.Model.FK_Title_Series" FromRole="Titles1" ToRole="Titles" />\r\n' +
        '        <NavigationProperty Name="ScreenFormats" Relationship="TestCatalog.Model.FK_TitleScreenFormat_Title" FromRole="Titles" ToRole="TitleScreenFormats" />\r\n' +
        '        <NavigationProperty Name="Cast" Relationship="TestCatalog.Model.TitleActors" FromRole="Titles" ToRole="People" />\r\n' +
        '        <NavigationProperty Name="Languages" Relationship="TestCatalog.Model.TitleLanguages" FromRole="Titles" ToRole="Language" />\r\n' +
        '        <NavigationProperty Name="Directors" Relationship="TestCatalog.Model.TitleDirectors" FromRole="Titles" ToRole="People" />\r\n' +
        '        <NavigationProperty Name="Genres" Relationship="TestCatalog.Model.TitleGenres" FromRole="Titles" ToRole="Genres" />\r\n' +
        '      </EntityType>\r\n' +
        '      <ComplexType Name="BoxArt">\r\n' +
        '        <Property Name="SmallUrl" Type="Edm.String" Nullable="true" MaxLength="80" Unicode="false" FixedLength="false" />\r\n' +
        '        <Property Name="MediumUrl" Type="Edm.String" Nullable="true" MaxLength="80" Unicode="false" FixedLength="false" />\r\n' +
        '        <Property Name="LargeUrl" Type="Edm.String" Nullable="true" MaxLength="80" Unicode="false" FixedLength="false" />\r\n' +
        '        <Property Name="HighDefinitionUrl" Type="Edm.String" Nullable="true" MaxLength="80" Unicode="false" FixedLength="false" />\r\n' +
        '      </ComplexType>\r\n' +
        '      <ComplexType Name="InstantAvailability">\r\n' +
        '        <Property Name="Available" Type="Edm.Boolean" Nullable="false" />\r\n' +
        '        <Property Name="AvailableFrom" Type="Edm.DateTime" Nullable="true" />\r\n' +
        '        <Property Name="AvailableTo" Type="Edm.DateTime" Nullable="true" />\r\n' +
        '        <Property Name="HighDefinitionAvailable" Type="Edm.Boolean" Nullable="false" />\r\n' +
        '        <Property Name="Runtime" Type="Edm.Int32" Nullable="true" />\r\n' +
        '        <Property Name="Rating" Type="Edm.String" Nullable="true" MaxLength="10" Unicode="false" FixedLength="false" />\r\n' +
        '      </ComplexType>\r\n' +
        '      <ComplexType Name="DeliveryFormatAvailability">\r\n' +
        '        <Property Name="Available" Type="Edm.Boolean" Nullable="false" />\r\n' +
        '        <Property Name="AvailableFrom" Type="Edm.DateTime" Nullable="true" />\r\n' +
        '        <Property Name="AvailableTo" Type="Edm.DateTime" Nullable="true" />\r\n' +
        '        <Property Name="Runtime" Type="Edm.Int32" Nullable="true" />\r\n' +
        '        <Property Name="Rating" Type="Edm.String" Nullable="true" MaxLength="10" Unicode="false" FixedLength="false" />\r\n' +
        '      </ComplexType>\r\n' +
        '      <EntityType Name="TitleScreenFormat">\r\n' +
        '        <Key><PropertyRef Name="TitleId" /><PropertyRef Name="DeliveryFormat" /><PropertyRef Name="Format" /></Key>\r\n' +
        '        <Property Name="TitleId" Type="Edm.String" Nullable="false" MaxLength="30" FixedLength="false" />\r\n' +
        '        <Property Name="DeliveryFormat" Type="Edm.String" Nullable="false" MaxLength="10" Unicode="false" FixedLength="false" />\r\n' +
        '        <Property Name="Format" Type="Edm.String" Nullable="false" MaxLength="30" Unicode="false" FixedLength="false" />\r\n' +
        '        <NavigationProperty Name="Title" Relationship="TestCatalog.Model.FK_TitleScreenFormat_Title" FromRole="TitleScreenFormats" ToRole="Titles" />\r\n' +
        '      </EntityType>\r\n' +
        '      <Association Name="FK_TitleAudioFormat_Title">\r\n' +
        '        <End Role="Titles" Type="TestCatalog.Model.Title" Multiplicity="1" />\r\n' +
        '        <End Role="TitleAudioFormats" Type="TestCatalog.Model.TitleAudioFormat" Multiplicity="*" />\r\n' +
        '        <ReferentialConstraint>\r\n' +
        '          <Principal Role="Titles"><PropertyRef Name="Id" /></Principal>\r\n' +
        '          <Dependent Role="TitleAudioFormats"><PropertyRef Name="TitleId" /></Dependent>\r\n' +
        '        </ReferentialConstraint>\r\n' +
        '      </Association>\r\n' +
        '      <Association Name="FK_TitleAward_Title">\r\n' +
        '        <End Role="Titles" Type="TestCatalog.Model.Title" Multiplicity="1" />\r\n' +
        '        <End Role="TitleAwards" Type="TestCatalog.Model.TitleAward" Multiplicity="*" />\r\n' +
        '      </Association>\r\n' +
        '      <Association Name="FK_TitleAward_Person">\r\n' +
        '        <End Role="People" Type="TestCatalog.Model.Person" Multiplicity="0..1" />\r\n' +
        '        <End Role="TitleAwards" Type="TestCatalog.Model.TitleAward" Multiplicity="*" />\r\n' +
        '      </Association>\r\n' +
        '      <Association Name="FK_Title_Disc">\r\n' +
        '        <End Role="Titles" Type="TestCatalog.Model.Title" Multiplicity="0..1" />\r\n' +
        '        <End Role="Titles1" Type="TestCatalog.Model.Title" Multiplicity="*" />\r\n' +
        '      </Association>\r\n' +
        '      <Association Name="FK_Title_Movie">\r\n' +
        '        <End Role="Titles" Type="TestCatalog.Model.Title" Multiplicity="0..1" />\r\n' +
        '        <End Role="Titles1" Type="TestCatalog.Model.Title" Multiplicity="*" />\r\n' +
        '      </Association>\r\n' +
        '      <Association Name="FK_Title_Season">\r\n' +
        '        <End Role="Titles" Type="TestCatalog.Model.Title" Multiplicity="0..1" />\r\n' +
        '        <End Role="Titles1" Type="TestCatalog.Model.Title" Multiplicity="*" />\r\n' +
        '      </Association>\r\n' +
        '      <Association Name="FK_Title_Series">\r\n' +
        '        <End Role="Titles" Type="TestCatalog.Model.Title" Multiplicity="0..1" />\r\n' +
        '        <End Role="Titles1" Type="TestCatalog.Model.Title" Multiplicity="*" />\r\n' +
        '      </Association>\r\n' +
        '      <Association Name="FK_TitleScreenFormat_Title">\r\n' +
        '        <End Role="Titles" Type="TestCatalog.Model.Title" Multiplicity="1" />\r\n' +
        '        <End Role="TitleScreenFormats" Type="TestCatalog.Model.TitleScreenFormat" Multiplicity="*" />\r\n' +
        '        <ReferentialConstraint>\r\n' +
        '          <Principal Role="Titles"><PropertyRef Name="Id" /></Principal>\r\n' +
        '          <Dependent Role="TitleScreenFormats"><PropertyRef Name="TitleId" /></Dependent>\r\n' +
        '        </ReferentialConstraint>\r\n' +
        '      </Association>\r\n' +
        '      <Association Name="TitleActors">\r\n' +
        '        <End Role="Titles" Type="TestCatalog.Model.Title" Multiplicity="*" />\r\n' +
        '        <End Role="People" Type="TestCatalog.Model.Person" Multiplicity="*" />\r\n' +
        '      </Association>\r\n' +
        '      <Association Name="TitleLanguages">\r\n' +
        '        <End Role="Titles" Type="TestCatalog.Model.Title" Multiplicity="*" />\r\n' +
        '        <End Role="Language" Type="TestCatalog.Model.Language" Multiplicity="*" />\r\n' +
        '      </Association>\r\n' +
        '      <Association Name="TitleDirectors">\r\n' +
        '        <End Role="Titles" Type="TestCatalog.Model.Title" Multiplicity="*" />\r\n' +
        '        <End Role="People" Type="TestCatalog.Model.Person" Multiplicity="*" />\r\n' +
        '      </Association>\r\n' +
        '      <Association Name="TitleGenres">\r\n' +
        '        <End Role="Titles" Type="TestCatalog.Model.Title" Multiplicity="*" />\r\n' +
        '        <End Role="Genres" Type="TestCatalog.Model.Genre" Multiplicity="*" />\r\n' +
        '      </Association>\r\n' +
        '    </Schema>\r\n' +
        '    <Schema Namespace="Test.Catalog" xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" xmlns="http://schemas.microsoft.com/ado/2008/09/edm">\r\n' +
        '      <EntityContainer Name="TestCatalog" m:IsDefaultEntityContainer="true">\r\n' +
        '        <FunctionImport Name="Movies" EntitySet="Titles" ReturnType="Collection(TestCatalog.Model.Title)" m:HttpMethod="GET" />\r\n' +
        '        <FunctionImport Name="Series" EntitySet="Titles" ReturnType="Collection(TestCatalog.Model.Title)" m:HttpMethod="GET" />\r\n' +
        '        <FunctionImport Name="Seasons" EntitySet="Titles" ReturnType="Collection(TestCatalog.Model.Title)" m:HttpMethod="GET" />\r\n' +
        '        <FunctionImport Name="Discs" EntitySet="Titles" ReturnType="Collection(TestCatalog.Model.Title)" m:HttpMethod="GET" />\r\n' +
        '        <FunctionImport Name="Episodes" EntitySet="Titles" ReturnType="Collection(TestCatalog.Model.Title)" m:HttpMethod="GET" />\r\n' +
        '        <EntitySet Name="Genres" EntityType="TestCatalog.Model.Genre" />\r\n' +
        '        <EntitySet Name="Languages" EntityType="TestCatalog.Model.Language" />\r\n' +
        '        <EntitySet Name="People" EntityType="TestCatalog.Model.Person" />\r\n' +
        '        <EntitySet Name="TitleAudioFormats" EntityType="TestCatalog.Model.TitleAudioFormat" />\r\n' +
        '        <EntitySet Name="TitleAwards" EntityType="TestCatalog.Model.TitleAward" />\r\n' +
        '        <EntitySet Name="Titles" EntityType="TestCatalog.Model.Title" />\r\n' +
        '        <EntitySet Name="TitleScreenFormats" EntityType="TestCatalog.Model.TitleScreenFormat" />\r\n' +
        '        <AssociationSet Name="FK_TitleAudioFormat_Title" Association="TestCatalog.Model.FK_TitleAudioFormat_Title">\r\n' +
        '          <End Role="Titles" EntitySet="Titles" />\r\n' +
        '          <End Role="TitleAudioFormats" EntitySet="TitleAudioFormats" />\r\n' +
        '        </AssociationSet>\r\n' +
        '        <AssociationSet Name="FK_TitleAward_Title" Association="TestCatalog.Model.FK_TitleAward_Title">\r\n' +
        '          <End Role="Titles" EntitySet="Titles" />\r\n' +
        '          <End Role="TitleAwards" EntitySet="TitleAwards" />\r\n' +
        '        </AssociationSet>\r\n' +
        '        <AssociationSet Name="FK_TitleAward_Person" Association="TestCatalog.Model.FK_TitleAward_Person">\r\n' +
        '          <End Role="People" EntitySet="People" />\r\n' +
        '          <End Role="TitleAwards" EntitySet="TitleAwards" />\r\n' +
        '        </AssociationSet>\r\n' +
        '        <AssociationSet Name="FK_Title_Disc" Association="TestCatalog.Model.FK_Title_Disc">\r\n' +
        '          <End Role="Titles" EntitySet="Titles" />\r\n' +
        '          <End Role="Titles1" EntitySet="Titles" />\r\n' +
        '        </AssociationSet>\r\n' +
        '        <AssociationSet Name="FK_Title_Movie" Association="TestCatalog.Model.FK_Title_Movie">\r\n' +
        '          <End Role="Titles" EntitySet="Titles" />\r\n' +
        '          <End Role="Titles1" EntitySet="Titles" />\r\n' +
        '        </AssociationSet>\r\n' +
        '        <AssociationSet Name="FK_Title_Season" Association="TestCatalog.Model.FK_Title_Season">\r\n' +
        '          <End Role="Titles" EntitySet="Titles" />\r\n' +
        '          <End Role="Titles1" EntitySet="Titles" />\r\n' +
        '        </AssociationSet>\r\n' +
        '        <AssociationSet Name="FK_Title_Series" Association="TestCatalog.Model.FK_Title_Series">\r\n' +
        '          <End Role="Titles" EntitySet="Titles" />\r\n' +
        '          <End Role="Titles1" EntitySet="Titles" />\r\n' +
        '        </AssociationSet>\r\n' +
        '        <AssociationSet Name="FK_TitleScreenFormat_Title" Association="TestCatalog.Model.FK_TitleScreenFormat_Title">\r\n' +
        '          <End Role="Titles" EntitySet="Titles" />\r\n' +
        '          <End Role="TitleScreenFormats" EntitySet="TitleScreenFormats" />\r\n' +
        '        </AssociationSet>\r\n' +
        '        <AssociationSet Name="TitleActors" Association="TestCatalog.Model.TitleActors">\r\n' +
        '          <End Role="Titles" EntitySet="Titles" />\r\n' +
        '          <End Role="People" EntitySet="People" />\r\n' +
        '        </AssociationSet>\r\n' +
        '        <AssociationSet Name="TitleLanguages" Association="TestCatalog.Model.TitleLanguages">\r\n' +
        '          <End Role="Titles" EntitySet="Titles" />\r\n' +
        '          <End Role="Language" EntitySet="Languages" />\r\n' +
        '        </AssociationSet>\r\n' +
        '        <AssociationSet Name="TitleDirectors" Association="TestCatalog.Model.TitleDirectors">\r\n' +
        '          <End Role="Titles" EntitySet="Titles" />\r\n' +
        '          <End Role="People" EntitySet="People" />\r\n' +
        '        </AssociationSet>\r\n' +
        '        <AssociationSet Name="TitleGenres" Association="TestCatalog.Model.TitleGenres">\r\n' +
        '          <End Role="Titles" EntitySet="Titles" />\r\n' +
        '          <End Role="Genres" EntitySet="Genres" />\r\n' +
        '        </AssociationSet>\r\n' +
        '      </EntityContainer>\r\n' +
        '    </Schema>\r\n' +
        '  </edmx:DataServices>\r\n' +
        '</edmx:Edmx>\r\n' +
        '';

    var testMetadata = {
        "version": "1.0",
        "dataServices": {
            "dataServiceVersion": "2.0",
            "schema": [{
                "namespace": "TestCatalog.Model",
                "entityType": [{
                    "name": "Genre",
                    "key": { "propertyRef": [{ "name": "Name"}] },
                    "property": [{ "name": "Name", "type": "Edm.String", "nullable": "false", "maxLength": "50", "fixedLength": "false", "unicode": "false", "FC_TargetPath": "SyndicationTitle"}],
                    "navigationProperty": [{ "name": "Titles", "relationship": "TestCatalog.Model.TitleGenres", "toRole": "Titles", "fromRole": "Genres"}]
                }, {
                    "name": "Language",
                    "key": { "propertyRef": [{ "name": "Name"}] },
                    "property": [{ "name": "Name", "type": "Edm.String", "nullable": "false", "maxLength": "80", "fixedLength": "false", "unicode": "false", "FC_TargetPath": "SyndicationTitle"}],
                    "navigationProperty": [{ "name": "Titles", "relationship": "TestCatalog.Model.TitleLanguages", "toRole": "Titles", "fromRole": "Language"}]
                }, {
                    "name": "Person",
                    "key": { "propertyRef": [{ "name": "Id"}] },
                    "property": [
                        { "name": "Id", "type": "Edm.Int32", "nullable": "false" },
                        { "name": "Name", "type": "Edm.String", "nullable": "false", "maxLength": "80", "fixedLength": "false", "unicode": "true", "FC_TargetPath": "SyndicationTitle" }
                    ],
                    "navigationProperty": [
                        { "name": "Awards", "relationship": "TestCatalog.Model.FK_TitleAward_Person", "toRole": "TitleAwards", "fromRole": "People" },
                        { "name": "TitlesActedIn", "relationship": "TestCatalog.Model.TitleActors", "toRole": "Titles", "fromRole": "People" },
                        { "name": "TitlesDirected", "relationship": "TestCatalog.Model.TitleDirectors", "toRole": "Titles", "fromRole": "People" }
                    ]
                }, {
                    "name": "TitleAudioFormat",
                    "key": { "propertyRef": [{ "name": "TitleId" }, { "name": "DeliveryFormat" }, { "name": "Language" }, { "name": "Format"}] },
                    "property": [
                        { "name": "TitleId", "type": "Edm.String", "nullable": "false", "maxLength": "30", "fixedLength": "false" },
                        { "name": "DeliveryFormat", "type": "Edm.String", "nullable": "false", "maxLength": "10", "fixedLength": "false", "unicode": "false" },
                        { "name": "Language", "type": "Edm.String", "nullable": "false", "maxLength": "30", "fixedLength": "false", "unicode": "false" },
                        { "name": "Format", "type": "Edm.String", "nullable": "false", "maxLength": "30", "fixedLength": "false", "unicode": "false" }
                    ],
                    "navigationProperty": [{ "name": "Title", "relationship": "TestCatalog.Model.FK_TitleAudioFormat_Title", "toRole": "Titles", "fromRole": "TitleAudioFormats"}]
                }, {
                    "name": "TitleAward",
                    "key": { "propertyRef": [{ "name": "Id"}] },
                    "property": [
                        { "name": "Id", "type": "Edm.Guid", "nullable": "false" },
                        { "name": "Type", "type": "Edm.String", "nullable": "false", "maxLength": "30", "fixedLength": "false", "unicode": "false" },
                        { "name": "Category", "type": "Edm.String", "nullable": "false", "maxLength": "60", "fixedLength": "false", "unicode": "false" },
                        { "name": "Year", "type": "Edm.Int32", "nullable": "true" }, { "name": "Won", "type": "Edm.Boolean", "nullable": "false" }
                    ],
                    "navigationProperty": [
                        { "name": "Title", "relationship": "TestCatalog.Model.FK_TitleAward_Title", "toRole": "Titles", "fromRole": "TitleAwards" },
                        { "name": "Person", "relationship": "TestCatalog.Model.FK_TitleAward_Person", "toRole": "People", "fromRole": "TitleAwards" }
                    ]
                }, {
                    "name": "Title",
                    "hasStream": "true",
                    "key": { "propertyRef": [{ "name": "Id"}] },
                    "property": [
                        { "name": "Id", "type": "Edm.String", "nullable": "false", "maxLength": "30", "fixedLength": "false" },
                        { "name": "Synopsis", "type": "Edm.String", "nullable": "true", "maxLength": "Max", "fixedLength": "false", "unicode": "false", "FC_ContentKind": "html", "FC_TargetPath": "SyndicationSummary" },
                        { "name": "ShortSynopsis", "type": "Edm.String", "nullable": "true", "maxLength": "Max", "fixedLength": "false", "unicode": "false" },
                        { "name": "AverageRating", "type": "Edm.Double", "nullable": "true" }, { "name": "ReleaseYear", "type": "Edm.Int32", "nullable": "true" },
                        { "name": "Url", "type": "Edm.String", "nullable": "true", "maxLength": "200", "fixedLength": "false", "unicode": "false" },
                        { "name": "Runtime", "type": "Edm.Int32", "nullable": "true" },
                        { "name": "Rating", "type": "Edm.String", "nullable": "true", "maxLength": "10", "fixedLength": "false", "unicode": "false" },
                        { "name": "DateModified", "type": "Edm.DateTime", "nullable": "false", "concurrencyMode": "Fixed", "FC_KeepInContent": "false", "FC_TargetPath": "SyndicationUpdated" },
                        { "name": "Type", "type": "Edm.String", "nullable": "false", "maxLength": "8", "fixedLength": "false", "unicode": "false" },
                        { "name": "BoxArt", "type": "TestCatalog.Model.BoxArt", "nullable": "false" },
                        { "name": "ShortName", "type": "Edm.String", "nullable": "false", "maxLength": "200", "fixedLength": "false", "unicode": "false" },
                        { "name": "Name", "type": "Edm.String", "nullable": "false", "maxLength": "200", "fixedLength": "false", "unicode": "false", "FC_TargetPath": "SyndicationTitle" },
                        { "name": "Instant", "type": "TestCatalog.Model.InstantAvailability", "nullable": "false" },
                        { "name": "Dvd", "type": "TestCatalog.Model.DeliveryFormatAvailability", "nullable": "false" },
                        { "name": "BluRay", "type": "TestCatalog.Model.DeliveryFormatAvailability", "nullable": "false" },
                        { "name": "TinyUrl", "type": "Edm.String", "nullable": "false", "maxLength": "30" },
                        { "name": "WebsiteUrl", "type": "Edm.String", "nullable": "true", "maxLength": "200" },
                        { "name": "TestApiId", "type": "Edm.String", "nullable": "false", "maxLength": "200" }
                    ],
                    "navigationProperty": [
                        { "name": "AudioFormats", "relationship": "TestCatalog.Model.FK_TitleAudioFormat_Title", "toRole": "TitleAudioFormats", "fromRole": "Titles" },
                        { "name": "Awards", "relationship": "TestCatalog.Model.FK_TitleAward_Title", "toRole": "TitleAwards", "fromRole": "Titles" },
                        { "name": "Disc", "relationship": "TestCatalog.Model.FK_Title_Disc", "toRole": "Titles", "fromRole": "Titles1" },
                        { "name": "Movie", "relationship": "TestCatalog.Model.FK_Title_Movie", "toRole": "Titles", "fromRole": "Titles1" },
                        { "name": "Season", "relationship": "TestCatalog.Model.FK_Title_Season", "toRole": "Titles", "fromRole": "Titles1" },
                        { "name": "Series", "relationship": "TestCatalog.Model.FK_Title_Series", "toRole": "Titles", "fromRole": "Titles1" },
                        { "name": "ScreenFormats", "relationship": "TestCatalog.Model.FK_TitleScreenFormat_Title", "toRole": "TitleScreenFormats", "fromRole": "Titles" },
                        { "name": "Cast", "relationship": "TestCatalog.Model.TitleActors", "toRole": "People", "fromRole": "Titles" },
                        { "name": "Languages", "relationship": "TestCatalog.Model.TitleLanguages", "toRole": "Language", "fromRole": "Titles" },
                        { "name": "Directors", "relationship": "TestCatalog.Model.TitleDirectors", "toRole": "People", "fromRole": "Titles" },
                        { "name": "Genres", "relationship": "TestCatalog.Model.TitleGenres", "toRole": "Genres", "fromRole": "Titles" }
                    ]
                }, {
                    "name": "TitleScreenFormat",
                    "key": { "propertyRef": [{ "name": "TitleId" }, { "name": "DeliveryFormat" }, { "name": "Format"}] },
                    "property": [
                        { "name": "TitleId", "type": "Edm.String", "nullable": "false", "maxLength": "30", "fixedLength": "false" },
                        { "name": "DeliveryFormat", "type": "Edm.String", "nullable": "false", "maxLength": "10", "fixedLength": "false", "unicode": "false" },
                        { "name": "Format", "type": "Edm.String", "nullable": "false", "maxLength": "30", "fixedLength": "false", "unicode": "false" }
                    ],
                    "navigationProperty": [{ "name": "Title", "relationship": "TestCatalog.Model.FK_TitleScreenFormat_Title", "toRole": "Titles", "fromRole": "TitleScreenFormats"}]
                }],
                "complexType": [{
                    "name": "BoxArt",
                    "property": [
                        { "name": "SmallUrl", "type": "Edm.String", "nullable": "true", "maxLength": "80", "fixedLength": "false", "unicode": "false" },
                        { "name": "MediumUrl", "type": "Edm.String", "nullable": "true", "maxLength": "80", "fixedLength": "false", "unicode": "false" },
                        { "name": "LargeUrl", "type": "Edm.String", "nullable": "true", "maxLength": "80", "fixedLength": "false", "unicode": "false" },
                        { "name": "HighDefinitionUrl", "type": "Edm.String", "nullable": "true", "maxLength": "80", "fixedLength": "false", "unicode": "false" }
                    ]
                }, {
                    "name": "InstantAvailability",
                    "property": [
                        { "name": "Available", "type": "Edm.Boolean", "nullable": "false" },
                        { "name": "AvailableFrom", "type": "Edm.DateTime", "nullable": "true" },
                        { "name": "AvailableTo", "type": "Edm.DateTime", "nullable": "true" },
                        { "name": "HighDefinitionAvailable", "type": "Edm.Boolean", "nullable": "false" },
                        { "name": "Runtime", "type": "Edm.Int32", "nullable": "true" },
                        { "name": "Rating", "type": "Edm.String", "nullable": "true", "maxLength": "10", "fixedLength": "false", "unicode": "false" }
                    ]
                }, {
                    "name": "DeliveryFormatAvailability",
                    "property": [
                        { "name": "Available", "type": "Edm.Boolean", "nullable": "false" },
                        { "name": "AvailableFrom", "type": "Edm.DateTime", "nullable": "true" },
                        { "name": "AvailableTo", "type": "Edm.DateTime", "nullable": "true" },
                        { "name": "Runtime", "type": "Edm.Int32", "nullable": "true" },
                        { "name": "Rating", "type": "Edm.String", "nullable": "true", "maxLength": "10", "fixedLength": "false", "unicode": "false" }
                    ]
                }],
                "association": [{
                    "name": "FK_TitleAudioFormat_Title",
                    "end": [{ "type": "TestCatalog.Model.Title", "role": "Titles", "multiplicity": "1" }, { "type": "TestCatalog.Model.TitleAudioFormat", "role": "TitleAudioFormats", "multiplicity": "*"}],
                    "referentialConstraint": { "principal": { "role": "Titles", "propertyRef": [{ "name": "Id"}] }, "dependent": { "role": "TitleAudioFormats", "propertyRef": [{ "name": "TitleId"}]} }
                }, {
                    "name": "FK_TitleAward_Title",
                    "end": [{ "type": "TestCatalog.Model.Title", "role": "Titles", "multiplicity": "1" }, { "type": "TestCatalog.Model.TitleAward", "role": "TitleAwards", "multiplicity": "*"}]
                }, {
                    "name": "FK_TitleAward_Person",
                    "end": [{ "type": "TestCatalog.Model.Person", "role": "People", "multiplicity": "0..1" }, { "type": "TestCatalog.Model.TitleAward", "role": "TitleAwards", "multiplicity": "*"}]
                }, {
                    "name": "FK_Title_Disc",
                    "end": [{ "type": "TestCatalog.Model.Title", "role": "Titles", "multiplicity": "0..1" }, { "type": "TestCatalog.Model.Title", "role": "Titles1", "multiplicity": "*"}]
                }, {
                    "name": "FK_Title_Movie",
                    "end": [{ "type": "TestCatalog.Model.Title", "role": "Titles", "multiplicity": "0..1" }, { "type": "TestCatalog.Model.Title", "role": "Titles1", "multiplicity": "*"}]
                }, {
                    "name": "FK_Title_Season",
                    "end": [{ "type": "TestCatalog.Model.Title", "role": "Titles", "multiplicity": "0..1" }, { "type": "TestCatalog.Model.Title", "role": "Titles1", "multiplicity": "*"}]
                }, {
                    "name": "FK_Title_Series",
                    "end": [{ "type": "TestCatalog.Model.Title", "role": "Titles", "multiplicity": "0..1" }, { "type": "TestCatalog.Model.Title", "role": "Titles1", "multiplicity": "*"}]
                }, {
                    "name": "FK_TitleScreenFormat_Title",
                    "end": [{ "type": "TestCatalog.Model.Title", "role": "Titles", "multiplicity": "1" }, { "type": "TestCatalog.Model.TitleScreenFormat", "role": "TitleScreenFormats", "multiplicity": "*"}],
                    "referentialConstraint": { "principal": { "role": "Titles", "propertyRef": [{ "name": "Id"}] }, "dependent": { "role": "TitleScreenFormats", "propertyRef": [{ "name": "TitleId"}]} }
                }, {
                    "name": "TitleActors",
                    "end": [{ "type": "TestCatalog.Model.Title", "role": "Titles", "multiplicity": "*" }, { "type": "TestCatalog.Model.Person", "role": "People", "multiplicity": "*"}]
                }, {
                    "name": "TitleLanguages",
                    "end": [{ "type": "TestCatalog.Model.Title", "role": "Titles", "multiplicity": "*" }, { "type": "TestCatalog.Model.Language", "role": "Language", "multiplicity": "*"}]
                }, {
                    "name": "TitleDirectors",
                    "end": [{ "type": "TestCatalog.Model.Title", "role": "Titles", "multiplicity": "*" }, { "type": "TestCatalog.Model.Person", "role": "People", "multiplicity": "*"}]
                }, {
                    "name": "TitleGenres",
                    "end": [{ "type": "TestCatalog.Model.Title", "role": "Titles", "multiplicity": "*" }, { "type": "TestCatalog.Model.Genre", "role": "Genres", "multiplicity": "*"}]
                }]
            }, {
                "namespace": "Test.Catalog",
                "entityContainer": [{
                    "name": "TestCatalog",
                    "isDefaultEntityContainer": "true",
                    "functionImport": [
                        { "name": "Movies", "returnType": "Collection(TestCatalog.Model.Title)", "entitySet": "Titles", httpMethod: "GET" },
                        { "name": "Series", "returnType": "Collection(TestCatalog.Model.Title)", "entitySet": "Titles", httpMethod: "GET" },
                        { "name": "Seasons", "returnType": "Collection(TestCatalog.Model.Title)", "entitySet": "Titles", httpMethod: "GET" },
                        { "name": "Discs", "returnType": "Collection(TestCatalog.Model.Title)", "entitySet": "Titles", httpMethod: "GET" },
                        { "name": "Episodes", "returnType": "Collection(TestCatalog.Model.Title)", "entitySet": "Titles", httpMethod: "GET" }
                    ], "entitySet": [
                        { "name": "Genres", "entityType": "TestCatalog.Model.Genre" },
                        { "name": "Languages", "entityType": "TestCatalog.Model.Language" },
                        { "name": "People", "entityType": "TestCatalog.Model.Person" },
                        { "name": "TitleAudioFormats", "entityType": "TestCatalog.Model.TitleAudioFormat" },
                        { "name": "TitleAwards", "entityType": "TestCatalog.Model.TitleAward" },
                        { "name": "Titles", "entityType": "TestCatalog.Model.Title" },
                        { "name": "TitleScreenFormats", "entityType": "TestCatalog.Model.TitleScreenFormat" }
                    ], "associationSet": [
                        { "name": "FK_TitleAudioFormat_Title", "association": "TestCatalog.Model.FK_TitleAudioFormat_Title", "end": [{ role: "Titles", entitySet: "Titles" }, { role: "TitleAudioFormats", entitySet: "TitleAudioFormats"}] },
                        { "name": "FK_TitleAward_Title", "association": "TestCatalog.Model.FK_TitleAward_Title", "end": [{ "role": "Titles", entitySet: "Titles" }, { "role": "TitleAwards", entitySet: "TitleAwards"}] },
                        { "name": "FK_TitleAward_Person", "association": "TestCatalog.Model.FK_TitleAward_Person", "end": [{ "role": "People", entitySet: "People" }, { "role": "TitleAwards", entitySet: "TitleAwards"}] },
                        { "name": "FK_Title_Disc", "association": "TestCatalog.Model.FK_Title_Disc", "end": [{ "role": "Titles", entitySet: "Titles" }, { "role": "Titles1", entitySet: "Titles"}] },
                        { "name": "FK_Title_Movie", "association": "TestCatalog.Model.FK_Title_Movie", "end": [{ "role": "Titles", entitySet: "Titles" }, { "role": "Titles1", entitySet: "Titles"}] },
                        { "name": "FK_Title_Season", "association": "TestCatalog.Model.FK_Title_Season", "end": [{ "role": "Titles", entitySet: "Titles" }, { "role": "Titles1", entitySet: "Titles"}] },
                        { "name": "FK_Title_Series", "association": "TestCatalog.Model.FK_Title_Series", "end": [{ "role": "Titles", entitySet: "Titles" }, { "role": "Titles1", entitySet: "Titles"}] },
                        { "name": "FK_TitleScreenFormat_Title", "association": "TestCatalog.Model.FK_TitleScreenFormat_Title", "end": [{ "role": "Titles", entitySet: "Titles" }, { "role": "TitleScreenFormats", entitySet: "TitleScreenFormats"}] },
                        { "name": "TitleActors", "association": "TestCatalog.Model.TitleActors", "end": [{ "role": "Titles", entitySet: "Titles" }, { "role": "People", entitySet: "People"}] },
                        { "name": "TitleLanguages", "association": "TestCatalog.Model.TitleLanguages", "end": [{ "role": "Titles", entitySet: "Titles" }, { "role": "Language", entitySet: "Languages"}] },
                        { "name": "TitleDirectors", "association": "TestCatalog.Model.TitleDirectors", "end": [{ "role": "Titles", entitySet: "Titles" }, { "role": "People", entitySet: "People"}] },
                        { "name": "TitleGenres", "association": "TestCatalog.Model.TitleGenres", "end": [{ role: "Titles", entitySet: "Titles" }, { role: "Genres", entitySet: "Genres"}] }
                    ]
                }]
            }]
        }
    };

    var testCsdlV3 = '' +
    '<edmx:Edmx Version="1.0" xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx">\r\n' +
    '  <edmx:DataServices m:DataServiceVersion="3.0" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata">\r\n' +
    '    <Schema Namespace="TestCatalog.Model" xmlns="http://schemas.microsoft.com/ado/2009/11/edm"/>\r\n' +
    '  </edmx:DataServices>\r\n' +
    '</edmx:Edmx>';

    var testMetadataV3 = {
        "version": "1.0",
        "dataServices": {
            "dataServiceVersion": "3.0",
            "schema": [{
                "namespace": "TestCatalog.Model"
            }]
        }
    };

    djstest.addTest(function testParseConceptualModelElement() {
        // Test cases as input XML text / result tuples.
        var cases = [
            { i: "<foo />", e: null },
            { i: '<edmx:Edmx Version="1.0" xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx" />', e: { version: "1.0"} },
            { i: '<edmx:Edmx Version="1.0" xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx-invalid" />', e: null },
            { i: testCsdl, e: testMetadata },
            { i: testCsdlV3, e: testMetadataV3 }
        ];

        var i, len;
        for (i = 0, len = cases.length; i < len; i++) {
            var doc = window.datajs.xmlParse(cases[i].i);
            var schema = window.OData.parseConceptualModelElement(doc.documentElement);
            djstest.assertAreEqualDeep(schema, cases[i].e, "parseConceptualModelElement result matches target");
        }

        djstest.done();
    });

    djstest.addTest(function metadataAttributeExtensionsTest() {
        var testCsdl = '' +
        '<?xml version="1.0" encoding="utf-8" standalone="yes"?>\r\n' +
        '<edmx:Edmx Version="1.0" xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx" extension="true" xmlns:foo="foons" foo:extension="true">\r\n' +
        '  <edmx:DataServices xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" m:DataServiceVersion="2.0" foo:extension="true">\r\n' +
        '    <Schema Namespace="TestCatalog.Model" xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" xmlns="http://schemas.microsoft.com/ado/2008/09/edm">\r\n' +
        '      <EntityType Name="Genre">\r\n' +
        '        <Key><PropertyRef Name="Name" /></Key>\r\n' +
        '        <Property Name="Name" Type="Edm.String" Nullable="false" MaxLength="50" Unicode="false" FixedLength="false" m:FC_TargetPath="SyndicationTitle" foo:extension="true" />\r\n' +
        '      </EntityType></Schema></edmx:DataServices></edmx:Edmx>';


        var doc = window.datajs.xmlParse(testCsdl);
        var schema = window.OData.parseConceptualModelElement(doc.documentElement);

        djstest.assertAreEqual(schema.extensions.length, 2, "schema.extensions.length === 2");
        djstest.assertAreEqual(schema.extensions[0].value, "true", "schema.extensions[0].value === 'true'");
        djstest.assertAreEqual(schema.extensions[0].name, "extension", "schema.extensions[0].name === 'extension'");
        djstest.assertAreEqual(schema.extensions[1].value, "true", "schema.extensions[1].value === 'true'");
        djstest.assertAreEqual(schema.extensions[1].name, "extension", "schema.extensions[1].name === 'extension'");
        djstest.assert(schema.extensions[0].namespace !== schema.extensions[1].namespace, "schema extensions have different namespaces'");
        djstest.assert(schema.extensions[0].namespace === "foons" || schema.extensions[1].namespace === "foons", "correct namespace for one of the extensions");
        djstest.assert(schema.extensions[0].namespace === null || schema.extensions[1].namespace === null, "null namespace for one of the extensions");

        djstest.assertAreEqual(schema.dataServices.extensions.length, 1, "DataServiceVersion length");
        djstest.assertAreEqualDeep(schema.dataServices.extensions[0], { name: "extension", namespace: "foons", value: "true" }, "DataServiceVersion extension");
        djstest.assertAreEqual(schema.dataServices.schema[0].entityType[0].property[0].extensions.length, 1, "entity type property extension length");

        djstest.assertAreEqualDeep(schema.dataServices.schema[0].entityType[0].property[0].extensions[0], { name: "extension", namespace: "foons", value: "true" }, "entity type property extension");

        djstest.done();
    });

    djstest.addTest(function metadataElementExtensionsTest() {
        var testCsdl = '' +
        '<?xml version="1.0" encoding="utf-8" standalone="yes"?>\r\n' +
        '<edmx:Edmx Version="1.0" xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx" extension="true" xmlns:foo="foons" foo:extension="true">\r\n' +
        '  <edmx:DataServices xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" m:DataServiceVersion="2.0" foo:extension="true">\r\n' +
        '    <c:custom xmlns:c="customns" edmx:foo="bar"><c:another>some text</c:another><![CDATA[more text]]></c:custom>' +
        '    <Schema Namespace="TestCatalog.Model" xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" xmlns="http://schemas.microsoft.com/ado/2008/09/edm">\r\n' +
        '      <EntityType Name="Genre">\r\n' +
        '        <Key><PropertyRef Name="Name" /></Key>\r\n' +
        '        <Property Name="Name" Type="Edm.String" Nullable="false" MaxLength="50" Unicode="false" FixedLength="false" m:FC_TargetPath="SyndicationTitle" foo:extension="true" />\r\n' +
        '      </EntityType></Schema></edmx:DataServices></edmx:Edmx>';


        var doc = window.datajs.xmlParse(testCsdl);
        var schema = window.OData.parseConceptualModelElement(doc.documentElement);

        djstest.assertAreEqual(schema.dataServices.extensions.length, 2, "DataServiceVersion length");
        djstest.assertAreEqualDeep(schema.dataServices.extensions[0], { name: "extension", namespace: "foons", value: "true" }, "DataServiceVersion extension");
        djstest.assertAreEqualDeep(schema.dataServices.extensions[1], {
            name: "custom", namespace: "customns", value: "more text",
            attributes: [{ name: "foo", namespace: "http://schemas.microsoft.com/ado/2007/06/edmx", value: "bar"}],
            children: [{ name: "another", namespace: "customns", value: "some text", attributes: [], children: []}]
        },
            "DataServiceVersion extension element"
        );

        djstest.done();
    });

    // DATAJS INTERNAL END
})(this);
