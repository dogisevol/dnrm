﻿/* Lotplan - Search results component 
 * Lotplan - Address search fields component 
 * 
 * Fields:  A single address field that 
 */

// Namespace detection
if (typeof (lotplan) !== "object") lotplan = {};
if (typeof (lotplan.components) !== "object") lotplan.components = {};

lotplan.components.addresssearchfields = (function (jQuery, ko) {


    var _self;

    var addressURL = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/0/query?geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnCountOnly=false&returnIdsOnly=false&returnGeometry=false&outFields=ADDRESS&f=json&where=";
    var lotplanURL = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/0/query?text=&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnCountOnly=false&returnIdsOnly=false&returnGeometry=true&outFields=*&f=json&where=";

    /********************************************************************************** Lifecycle */


    /**
     * Init 
     */
    function setup() {
        var $typeahead = jQuery('#fishery_address_search_address'),
            wrapper = new lotplan.utils.TypeaheadWrapper($typeahead, function (query, syncResults, asyncResults) {

                _self.loading(true);
                var addrUrl = addressURL + encodeURIComponent("LOWER(ADDRESS) like '" + query.toLowerCase().trim() + "%'");

                return jQuery.get(addrUrl).success(function (data) {

                    _self.loading(false);

                    var addresses = [];
                    data = JSON.parse(data);
                    if (data.features.length < 1) {
                        _self.addressValid(false);
                        return false;
                    }

                    data.features.forEach(function (v, i) {
                        if (jQuery.inArray(v.attributes.ADDRESS, addresses) < 0) {
                            addresses.push(v.attributes.ADDRESS);
                            _self.addressValid(true);
                        }
                    });

                    asyncResults(addresses);

                });
            })

        //catch when loading is finished and set loading to false
        jQuery(document).on('loadingFinished', false, function (e) {
            _self.loading(false);
        });

    }

    /********************************************************************************** View models */


    /**
     * View model
     * @constructor
     */
    function viewModel(params) {

        _self = this;

        //vars
        _self.loading = ko.observable(false);
        _self.addressValid = ko.observable(false);
        _self.isError = ko.observable(false);

        //register event handlers
        _self.makeAddressSearch = makeAddressSearch;
        _self.resetAddressSearch = resetAddressSearch;
        _self.searchText = ko.observable('');
    }


    /********************************************************************************** Event handlers */

    /**
     * An address is provided and searched for
     */
    function makeAddressSearch(vm, event) {
        _self.loading(true);
        this.isError(false);
        lotplan.main.clearData();
        _self.searchText(jQuery(vm).find('#fishery_address_search_address').val());
        getAddressSearchResults(jQuery(vm).find('#fishery_address_search_address').val());
    }

    /**
     * The reset button is pressed and the fields must be made empty
     */
    function resetAddressSearch(vm, event) {
        jQuery(event.target).closest('form').find('input[type="text"]').val('');
        this.isError(false);
        lotplan.main.clearData();
    }


    /********************************************************************************** Private */

    /**
     * Get search results
     */
    function getAddressSearchResults(searchtext) {
        lotplan.utils.ajaxRequest(lotplanURL + encodeURIComponent("ADDRESS='" + searchtext + "'"), 'GET', null, lotplan.components.searchresults.setSearchData.bind(_self));
    }



    /**
     * Return the component and public API
     */
    return {

        // API
        setup: setup,


        // Component
        setError: function (value) { _self.isError(value); },
        viewModel: viewModel,
        template: { element: 'addressSearchFields' },
        synchronous: true
    };


})(jQuery, ko);

/**
 * Lotplan - lotplan search fields component 
 * 
 * Fields:  A lot and a plan number.
 */

// Namespace detection
if (typeof (lotplan) !== "object") lotplan = {};
if (typeof (lotplan.components) !== "object") lotplan.components = {};

lotplan.components.lotplansearchfields = (function (jQuery, ko) {


    var _self;

    var addressURL = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/0/query?text=&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnIdsOnly=false&returnGeometry=true&outFields=*&f=json&returnCountOnly=false&where=";
    var lotplanURL = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/4/query?text=&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnIdsOnly=false&returnGeometry=true&outFields=*&f=json&returnCountOnly=false&where=";
    var lotplanbupURL = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/21/query?text=&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnIdsOnly=false&returnGeometry=true&outFields=*&f=json&returnCountOnly=false&where=";
    var lotplanrelatedURL = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/21/queryRelatedRecords?relationshipId=1&outFields=*&definitionExpression=&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&returnZ=false&returnM=false&gdbVersion=&f=json&objectIds=";


    /********************************************************************************** Lifecycle */


    /**
     * Init fired off when the
     */
    function setup() {

        //catch when loading is finished and set loading to false
        jQuery(document).on('loadingFinished', false, function (e) {
            _self.loading(false);
        });

    }


    /********************************************************************************** View models */


    /**
     * View model
     * @constructor
     */
    function viewModel(params) {

        _self = this;

        //vars
        _self.loading = ko.observable(false);
        _self.isError = ko.observable(false);

        //register event handlers
        _self.makeLotPlanSearch = makeLotPlanSearch;
        _self.resetLotPlanSearch = resetLotPlanSearch;

        _self.searchLot = ko.observable('');
        _self.searchPlan = ko.observable('');
    }



    /********************************************************************************** Event handlers */

    /**
     * A search is made with a lot and plan number
     */
    function makeLotPlanSearch(vm, event) {
        _self.loading(true);
        this.isError(false);
        lotplan.main.clearData();
        _self.searchLot(jQuery(vm).find('#lot_plan_search_lotno').val().trim());
        _self.searchPlan(jQuery(vm).find('#lot_plan_search_planno').val().toUpperCase().trim());

        if (_self.searchLot() && _self.searchPlan()) {
            getLotPlanSearchResults();
        } else {
            _self.loading(false);
            this.isError(true);
        }
    }

    /**
     * The reset button is clicked and fields must be made empty
     */
    function resetLotPlanSearch(vm, event) {
        jQuery(event.target).closest('form').find('input[type="text"]').val('');
        this.isError(false);
        lotplan.main.clearData();
    }


    /********************************************************************************** Private */

    /**
     * Get search results
     * lot plan search should follow this algorithm regarding lot plan searches, layer 4, 21 (if bup) then 4 again.
     * https://i.gyazo.com/fff82acc80212bb1f7a7f1e72a8f23cd.png
     * Results returned to searchresults component via callback
     */
    function getLotPlanSearchResults() {

        if (_self.searchPlan().match('BUP')) {
            //lotplan is of type BUP so it must poll 21 then 4 for object IDS then 0 for addresses
            lotplan.utils.ajaxRequest(lotplanbupURL + "BUP_LOTPLAN+%3D+%27" + _self.searchLot() + _self.searchPlan() + "%27", 'GET', null, function (layer21results) {
                if (layer21results && JSON.parse(layer21results).features.length > 0) {
                    lotplan.utils.ajaxRequest(lotplanrelatedURL + JSON.parse(layer21results).features[0].attributes.OBJECTID, 'GET', null, lotplan.components.searchresults.setSearchData.bind(_self))
                } else {
                    //no lot found
                    lotplan.components.searchresults.setSearchData.bind(null);
                    _self.isError(true);
                    _self.loading(false);
                }
            });
        } else {
            //a non BUP lotplan should search layer 4
            lotplan.utils.ajaxRequest(lotplanURL + "LOTPLAN+%3D+%27" + _self.searchLot() + _self.searchPlan() + "%27", 'GET', null, function (results) {
                if (JSON.parse(results).features.length > 0) {
                    var objectIDs = "";
                    for (var j in JSON.parse(results).features) {
                        if (j > 0) {
                            objectIDs += "+OR+";
                        }
                        objectIDs += "LOTPLAN+%3D+%27" + JSON.parse(results).features[j].attributes.LOTPLAN + "%27";
                    }
                    lotplan.utils.ajaxRequest(addressURL + objectIDs, 'GET', null, lotplan.components.searchresults.setSearchData.bind(_self));
                } else {
                    //no lot found
                    lotplan.components.searchresults.setSearchData.bind(null);
                    _self.isError(true);
                    _self.loading(false);
                }
            });
        }

    }



    /**
     * Return the component and public API
     */
    return {

        // API
        setup: setup,


        // Component
        setError: function (value) { _self.isError(value); },
        viewModel: viewModel,
        template: { element: 'lotPlanSearchFields' },
        synchronous: true
    };


})(jQuery, ko);


/**
 * Lotplan - Address search fields component 
 * 
 * Fields:  A single address field that 
 */

if (typeof (lotplan) !== "object") lotplan = {};

lotplan.main = (function (jQuery, ko) {

    'use strict';

    var _self = new vmMain(),

        productsAvailableUrl = "https://propertysearch.dnrm.qld.gov.au/productsAvailable",

        selectedFetchCounter = 0
        ;

    /********************************************************************************** Lifecycle */

    function constructor() {
        var searchElement = $.find("#fisherySearch")[0]
        _self.isLoading(true);
        var templatesPath = $(searchElement).attr("data-path")
        $(searchElement).load(templatesPath + '/searchComponent.html', function () {
            //           var addressSearchElement = $(searchElement).find('addresssearchfields')[0]
            //            $(addressSearchElement).load(templatesPath + '/addressSearch.html', function () {
            //                var lotPlanElement = $(searchElement).find('lotplansearchfields')[0]
            //               $(lotPlanElement).load(templatesPath + '/lotPlanSearch.html', function () {
            //                    var searchResultElement = $(searchElement).find('searchresults')[0]
            //                    $(searchResultElement).load(templatesPath + '/searchResults.html', function () {

            var addressSearchElement = $(searchElement).find('addresssearchfields')[0]
            var lotPlanElement = $(searchElement).find('lotplansearchfields')[0]
            var searchResultElement = $(searchElement).find('searchresults')[0]
            _self.mapDiv = $(searchElement).find('div.map:first')[0]
            debugger
            lotplan.components.lotplansearchfields.template.element = lotPlanElement
            lotplan.components.addresssearchfields.template.element = addressSearchElement
            lotplan.components.searchresults.template.element = searchResultElement
            ko.components.register('lotplansearchfields', lotplan.components.lotplansearchfields);
            ko.components.register('addresssearchfields', lotplan.components.addresssearchfields);
            ko.components.register('searchresults', lotplan.components.searchresults);

            ko.applyBindings(_self, searchElement);

            //                   })
            //               })
            //         })
            postBinding();
        })

        // Start post binding

    }

    /**
     * Post binding
     * Actions occur after components and this VM are registered and created
     */
    function postBinding() {

        // Watch for hashchange events
        jQuery(window).on('hashchange', function () {
            clearData(false, true, true);
            lotplan.components.addresssearchfields.setup();
            lotplan.components.lotplansearchfields.setup();
        });

        // activate any tooltips
        jQuery(document).ready(function () {
            jQuery("body").tooltip({ selector: '[data-toggle=tooltip]' });
        });

        // Set initial route
        clearData(false, true, true);
        lotplan.components.addresssearchfields.setup();
        lotplan.components.lotplansearchfields.setup();

        _self.id = decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent("id").replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
        notifyParent()
    }

    function notifyParent() {
        var sel = []
        _self.selection().forEach(function (marker) {
            sel.push({ "latitude": marker.getLatLng().lat, "longitude": marker.getLatLng().lng })
        })
        setTimeout(250, new function () {
            parent.postMessage({
                id: (_self.id) ? _self.id : "SpatialDataCaptureTool",
                componentHeight: $('body').outerHeight(true),
                selection: sel
            }, '*')
        })
    };


    /********************************************************************************** View models */

    function vmMain() {
        _self = this;

        //page routing
        _self.isLoading = ko.observable();

        // data selected for review / product selection
        _self.selectedData = ko.observableArray();

        // data returned from a search
        _self.searchData = ko.observableArray();

        _self.selection = ko.observableArray()
        _self.selection.subscribe(function () {
            notifyParent()
        })


        _self.errorText = ko.observable();

        _self.checkAllSearchData = checkAllSearchData;
        _self.clearSelection = clearSelection;
        _self.removeSelection = removeSelection;
    }

    function clearSelection() {
        _self.selection().forEach(function (selection) {
            lotplan.components.searchresults.removeMarker(selection)
        });
        _self.selection.removeAll();
    }

    function removeSelection() {
        lotplan.components.searchresults.removeMarker(this)
        _self.selection.remove(this);
    }

    function checkAllSearchData(vm, e) {

        // first remove all items from our selection
        _self.selectedData.removeAll();

        // if we have checked the select all, then we want to add them all
        if (e.target.checked) {
            for (var i = 0; i < _self.searchData().length; i++) {
                _self.selectedData.push(_self.searchData()[i].attributes);
            }
        }

        return true;

    }

    // clears data stores, defaults to all data
    function clearData(search, selected, products) {
        if ((search || search === undefined) && _self.searchData().length) _self.searchData.removeAll();
    }


    /**
     * Return public API
     */
    return {
        constructor: constructor(),
        clearSelection: clearSelection,
        clearData: clearData,
        notifyParent: notifyParent,
        getMapElement: function () { return _self.mapDiv; },
        getSearchData: function () { return _self.searchData; },
        getSelectedData: function () { return _self.selectedData; },
        getSelection: function () { return _self.selection; },

    };




})(jQuery, ko);
