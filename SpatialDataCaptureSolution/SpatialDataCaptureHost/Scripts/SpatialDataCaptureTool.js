/* Lotplan - Search results component
    * 
 * Search results are received from addressService or lotplansearch fields and results are displayed.
 * A custom event is dispatched once results are displayed to tell the search elements to stop loading.
 */

// Namespace detection
if (typeof (lotplan) !== "object") lotplan = {};
if (typeof (lotplan.components) !== "object") lotplan.components = {};

lotplan.components.searchresults = (function (jQuery, ko) {


    var _self,
        map,
        markerGroup,
        dynamicLayerUrl = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer",
        selectedIcon = new L.Icon.Default({ iconUrl: "images/marker-icon.png", shadowUrl: 'images/marker-shadow.png', });


    /********************************************************************************** Lifecycle */

    /**
     * Init 
     */
    function setup() {

    }

    // Script for adding marker on map click
    function onMapClick(e) {
        var geojsonFeature = {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Point",
                "coordinates": [e.latlng.lat, e.latlng.lng]
            }
        }

        var marker;
        var markerGroup = L.layerGroup().addTo(map)
        L.geoJson(geojsonFeature, {

            pointToLayer: function (feature, latlng) {

                marker = L.marker(e.latlng, {
                    riseOnHover: true,
                    draggable: true,
                    icon: selectedIcon

                });
                marker.dmsLat = ko.observable("")
                marker.dmsLat.subscribe(function () {
                    lotplan.main.notifyClient()
                })
                marker.dmsLng = ko.observable("")
                marker.dmsLng.subscribe(function () {
                    lotplan.main.notifyClient()
                })
                marker.setDms = function (dms) {
                    this.dmsLat(dms.lat)
                    this.dmsLng(dms.lng)
                }

                marker.bindPopup(marker.getLatLng() + "<br><center><a class='marker-delete-button'/>Remove marker</a></center>");
                marker.setDms(lotplan.utils.convertLatLngToDMS(marker.getLatLng().lat, marker.getLatLng().lng))

                lotplan.main.getSelection().push(marker)
                marker.on("popupopen", onPopupOpen);
                marker.on('dragend', function (e, marker) {
                    this.setDms(lotplan.utils.convertLatLngToDMS(this.getLatLng().lat, this.getLatLng().lng))
                });
                return marker;
            }
        }).addTo(markerGroup);
    }

    // Function to handle delete as well as other events on marker popup open
    function onPopupOpen() {
        var tempMarker = this;

        //var tempMarkerGeoJSON = this.toGeoJSON();

        //var lID = tempMarker._leaflet_id; // Getting Leaflet ID of this marker

        // To remove marker on click of delete
        $(".marker-delete-button:visible").click(function () {
            lotplan.main.getSelection().remove(tempMarker)
            map.removeLayer(tempMarker);
        });
    }

    function removeMarker(marker) {
        map.removeLayer(marker);
    }

    function setupMap() {
        map = L.map('map').setView([-33.86617516416043, 151.2077522277832], 15);
        L.esri.basemapLayer("Streets").addTo(map);
        L.esri.dynamicMapLayer({
            url: dynamicLayerUrl,
            opacity: 0.7,
            dynamicLayers: [{
                "id": 1,
                "source": {
                    "type": "mapLayer",
                    "mapLayerId": 4
                }
            },
            {
                "id": 1000,
                "source": {
                    "type": "mapLayer",
                    "mapLayerId": 0
                }
            }]
        }).addTo(map);
        lotplan.main.clearSelection()
        markerGroup = L.layerGroup().addTo(map);
        map.on('click', onMapClick);


        L.Icon.Default.imagePath = 'image';

        var bounds = L.latLngBounds([]),
            searchData = lotplan.main.getSearchData()


        for (var i = 0; i < searchData().length; i++) {
            var item = searchData()[i]

            var marker;

            //is item's geometry a ring/polygon or a point?
            if (item.geometry.rings) {

                // get point in middle of poly via finding highest and lowest x and y values
                var topleft, topright, bottomleft, bottomright;

                for (var j in item.geometry.rings[0]) {
                    if (j == 0) {
                        topleft = item.geometry.rings[0][j][0];
                        topright = item.geometry.rings[0][j][0];
                        bottomleft = item.geometry.rings[0][j][1];
                        bottomright = item.geometry.rings[0][j][1];
                    }

                    //detect and set topleft
                    if (j > 0 && item.geometry.rings[0][j][0] < topleft) { topleft = item.geometry.rings[0][j][0]; }
                    //detect and set  top right
                    if (j > 0 && item.geometry.rings[0][j][0] > topright) { topright = item.geometry.rings[0][j][0]; }
                    //detect and set  bottom left
                    if (j > 0 && item.geometry.rings[0][j][1] < bottomleft) { bottomleft = item.geometry.rings[0][j][1]; }
                    //detect and set  bottom right
                    if (j > 0 && item.geometry.rings[0][j][1] > bottomright) { bottomright = item.geometry.rings[0][j][1]; }

                }

                marker = L.marker(
                    [(bottomleft - topleft) / 2, (topright - topleft) / 2])

            } else {
                marker = L.marker(
                    [item.geometry.y, item.geometry.x])

            }
            bounds.extend(marker.getLatLng());
        }
        map.fitBounds(bounds);
        var points = lotplan.main.getPoints()
        if (points) {
            reg = new RegExp(
                "([-+]?[0-9]*\.?[0-9]+,.?[+]?[0-9]*\.?[0-9]+)", "g");
            var point
            while ((point = reg.exec(points)) !== null) {                
                var a = point[0].split(',')
                _self.onMapClick({ 'latlng': { 'lat': a[0], 'lng': a[1] } })
            }        
        }
    }

    /**
     * View model
     * @constructor
     */
    function viewModel(params) {
        _self = this;
        _self.onMapClick = onMapClick
        if (lotplan.main && lotplan.main.getSearchData() && lotplan.main.getSearchData()().length > 0) {
            setupMap();
        }
    }





    /**
    * Public: Parse and set search data once it is received from other classes
    */
    function setSearchData(address, plan, lot, isFirstSearch, results) {
        //parse search results and set them
        if (results) {
            var data = JSON.parse(results);

            if (data.relatedRecordGroups && data.relatedRecordGroups.length > 0) {
                data.features = data.relatedRecordGroups[0].relatedRecords;
            }

            if (data.features && data.features.length > 0) {
                // add some defaults for our products on the way in
                for (var i = 0; i < data.features.length; i++) {
                    var item = data.features[i].attributes;
                    item.LOT_TITLE = ko.observable("");
                    item.LOT_VALID = ko.observable(false);
                    item.PRODUCTS = ko.observableArray();
                }
                lotplan.main.getSearchData()(data.features);
                setupMap();
                if (address) {
                    lotplan.main.setAddress(address)
                    lotplan.main.setLotPlan('', '')
                } else {
                    lotplan.main.setLotPlan(lot, plan)
                    lotplan.main.setAddress('')
                }
                if (!isFirstSearch) {
                    lotplan.main.setPoints('')
                    lotplan.main.clearSelection()
                }
            } else {
                this.isError(true);
                lotplan.main.getSearchData()(false);
            }
        } else {
            lotplan.main.getSearchData()(false);
        }

        //fire custom loading finished event  
        jQuery(document).trigger("loadingFinished");
    }




    /********************************************************************************** Private */

    /**
     * Return the component and public API
     */
    return {

        // API
        setup: setup,
        setupMap: setupMap,
        setSearchData: setSearchData,
        removeMarker: removeMarker,

        // Component
        viewModel: viewModel,
        template: { element: 'searchResults' },
        synchronous: true
    };


})(jQuery, ko);


/**
 * Lotplan - Address search fields component 
 * 
 * Fields:  A single address field that 
 */

// Namespace detection
if (typeof (lotplan) !== "object") lotplan = {};
if (typeof (lotplan.components) !== "object") lotplan.components = {};

lotplan.components.addressService = (function (jQuery, ko) {


    var _self;

    var addressURL = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/0/query?geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnCountOnly=false&returnIdsOnly=false&returnGeometry=false&outFields=ADDRESS&f=json&where=";
    var addressMapURL = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/0/query?text=&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnCountOnly=false&returnIdsOnly=false&returnGeometry=true&outFields=*&f=json&where=";

    /********************************************************************************** Lifecycle */


    /**
     * Init 
     */
    function setup() {
        var $typeahead = jQuery('#address_search_address'),
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
        var address = lotplan.main.getAddress()
        if (address) {
            _self.searchText(address)
            $('#address_search_address').val(address)
            $('#lot_plan_search_lotno').val('')
            $('#lot_plan_search_planno').val('')
            _self.loading(true)
            getAddressSearchResults(address, true   )
        }
    }

    /********************************************************************************** View models */


    /**
     * View model
     * @constructor
     */
    function viewModel(params) {

        _self = this;

        //vars
        _self.loading = ko.observable(false)
        _self.addressValid = ko.observable(false)
        _self.isError = ko.observable(false)

        //register event handlers
        _self.makeAddressSearch = makeAddressSearch
        _self.resetAddressSearch = resetAddressSearch
        _self.searchText = ko.observable('')
    }


    /********************************************************************************** Event handlers */

    /**
     * An address is provided and searched for
     */
    function makeAddressSearch(vm, event) {
        _self.loading(true);
        this.isError(false);
        lotplan.main.clearData();
        _self.searchText(jQuery(vm).find('#address_search_address').val());
        getAddressSearchResults(jQuery(vm).find('#address_search_address').val());
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
    function getAddressSearchResults(searchtext, isFirstSearch) {
        lotplan.utils.ajaxRequest(addressMapURL + encodeURIComponent("ADDRESS='" + searchtext + "'"), 'GET', null, lotplan.components.searchresults.setSearchData.bind(_self, searchtext, null, null, isFirstSearch));
    }



    /**
     * Return the component and public API
     */
    return {

        // API
        setup: setup,
        setSearchText: function (value) { _self.searchText(value) },

        // Component
        setError: function (value) { _self.isError(value) },
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

    var lotplanMapURL = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/0/query?text=&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnIdsOnly=false&returnGeometry=true&outFields=*&f=json&returnCountOnly=false&where=";
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
        var lot = lotplan.main.getLot()
        var plan = lotplan.main.getPlan()
        if (lot && plan) {
            $('#address_search_address').val('')
            $('#lot_plan_search_lotno').val(lot.trim())
            $('#lot_plan_search_planno').val(plan.toUpperCase().trim())
            _self.loading(true);
            _self.searchLot(lot);
            _self.searchPlan(plan.toUpperCase().trim());
            getLotPlanSearchResults(true);
        }

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
    function getLotPlanSearchResults(isFirstSearch) {
        if (_self.searchPlan().match('BUP')) {
            //lotplan is of type BUP so it must poll 21 then 4 for object IDS then 0 for addresses
            lotplan.utils.ajaxRequest(lotplanbupURL + "BUP_LOTPLAN+%3D+%27" + _self.searchLot() + _self.searchPlan() + "%27", 'GET', null, function (layer21results) {
                if (layer21results && JSON.parse(layer21results).features.length > 0) {
                    lotplan.utils.ajaxRequest(lotplanrelatedURL + JSON.parse(layer21results).features[0].attributes.OBJECTID, 'GET', null, lotplan.components.searchresults.setSearchData.bind(_self, null, _self.searchPlan(), _self.searchLot(), isFirstSearch))
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
                    lotplan.utils.ajaxRequest(lotplanMapURL + objectIDs, 'GET', null, lotplan.components.searchresults.setSearchData.bind(_self, null, _self.searchPlan(), _self.searchLot(), isFirstSearch));
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
        var searchElement = $.find("spatialDataCaptureTool")[0]
        _self.isLoading(true);
        var templateFile = $(searchElement).attr("data-template-file")
        if (!templateFile)
            templateFile = "Content/templates/SpatialDataCaptureTool.html"
        lotplan.utils.ajaxRequest(encodeURIComponent(templateFile)+'?90', 'GET', null, function (data) {
            if (data) {
                $(searchElement).html(_.template(data)(_self))
                var addressSearchElement = $(searchElement).find('addresssearchfields')[0]
                var lotPlanElement = $(searchElement).find('lotplansearchfields')[0]
                var searchResultElement = $(searchElement).find('searchresults')[0]
                _self.mapDiv = $(searchElement).find('div.map:first')[0]
                lotplan.components.lotplansearchfields.template.element = lotPlanElement
                lotplan.components.addressService.template.element = addressSearchElement
                lotplan.components.searchresults.template.element = searchResultElement
                ko.components.register('lotplansearchfields', lotplan.components.lotplansearchfields);
                ko.components.register('addresssearchfields', lotplan.components.addressService);
                ko.components.register('searchresults', lotplan.components.searchresults);


                //custom binding to just handle initializing a value
                ko.bindingHandlers.init = {
                    init: function (element, valueAccessor) {
                        var value = valueAccessor();
                        if (ko.isObservable(value)) {
                            value(element.value);
                        }
                    }
                }

                ko.applyBindings(_self, $(searchElement).parent()[0]);
                postBinding();
            } else {
                _self.isError(true);
                _self.loading(false);
            }
        });
    }

    /**
     * Post binding
     * Actions occur after components and this VM are registered and created
     */
    function postBinding() {
        // activate any tooltips
        jQuery(document).ready(function () {
            jQuery("body").tooltip({ selector: '[data-toggle=tooltip]' });
        });

        // Set initial route
        clearData(false);
        lotplan.components.addressService.setup();
        lotplan.components.lotplansearchfields.setup();

        _self.id = decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent("id").replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
    }

    function notifyClient() {
        if (_self.selection().length > 0) {
            var data = 'MULTIPOINT(' + _self.selection().map(function (marker) {
                return '(' + marker.getLatLng().lat + ', ' + marker.getLatLng().lng + ')'
            }).join(', ') + ')'
                _self.points(data)
        }
    }


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
            notifyClient()
        })
        /*
        * Host fields binding
        */
        _self.address = ko.observable('')
        _self.plan = ko.observable('')
        _self.lot = ko.observable('')
        _self.points = ko.observable('')
        /*
        *End of host fields binding
        */
        _self.errorText = ko.observable();

        _self.checkAllSearchData = checkAllSearchData;
        _self.clearSelection = clearSelection;
        _self.removeAllPoints = removeAllPoints
        _self.removeSelection = removeSelection;
    }

    function setAddress(address) {
        _self.address(address)
    }

    function setLotPlan(lot, plan) {
        _self.lot(lot)
        _self.plan(plan)
    }

    function removeAllPoints() {
        _self.points('')
        clearSelection()
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
    function clearData(search) {
        if ((search || search === undefined) && _self.searchData().length) {
            _self.searchData.removeAll()
            _self.points('')
        }
    }


    /**
     * Return public API
     */
    return {
        constructor: constructor(),
        clearSelection: clearSelection,
        removeAllPoints: removeAllPoints,
        clearData: clearData,
        notifyClient: notifyClient,
        setAddress: setAddress,
        getAddress: function () { return _self.address() },
        setPoints: function () {_self.points() },
        getPoints: function () { return _self.points() },
        setLotPlan: setLotPlan,
        getLot: function () { return _self.lot() },
        getPlan: function () { return _self.plan() },
        getMapElement: function () { return _self.mapDiv },
        getSearchData: function () { return _self.searchData },
        getSelectedData: function () { return _self.selectedData },
        getSelection: function () { return _self.selection },

    };




})(jQuery, ko);

