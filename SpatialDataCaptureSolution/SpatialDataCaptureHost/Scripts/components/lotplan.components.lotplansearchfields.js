/**
 * Lotplan - lotplan search fields component 
 * 
 * Fields:  A lot and a plan number.
 */

// Namespace detection
if (typeof(lotplan) !== "object") lotplan = {};
if (typeof(lotplan.components) !== "object") lotplan.components = {};

lotplan.components.lotplansearchfields = (function(jQuery,ko) {


    var _self;

    var addressURL = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/0/query?text=&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnIdsOnly=false&returnGeometry=true&outFields=*&f=json&returnCountOnly=false&where=";
    var lotplanURL = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/4/query?text=&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnIdsOnly=false&returnGeometry=true&outFields=*&f=json&returnCountOnly=false&where=";
    var lotplanbupURL = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/21/query?text=&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnIdsOnly=false&returnGeometry=true&outFields=*&f=json&returnCountOnly=false&where=";
    var lotplanrelatedURL = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/21/queryRelatedRecords?relationshipId=1&outFields=*&definitionExpression=&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&returnZ=false&returnM=false&gdbVersion=&f=json&objectIds=";


    /********************************************************************************** Lifecycle */


    /**
     * Init fired off when the
     */
    function setup(){
        
        //catch when loading is finished and set loading to false
        jQuery(document).on('loadingFinished', false, function(e) {
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
            lotplan.utils.ajaxRequest(lotplanbupURL + "BUP_LOTPLAN+%3D+%27" + _self.searchLot() + _self.searchPlan() + "%27", 'GET', null, function(layer21results) {
                if(layer21results && JSON.parse(layer21results).features.length > 0) {
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
            lotplan.utils.ajaxRequest(lotplanURL + "LOTPLAN+%3D+%27" + _self.searchLot() + _self.searchPlan() + "%27", 'GET', null, function(results) {
                if (JSON.parse(results).features.length > 0) {
                    var objectIDs = "";
                    for(var j in JSON.parse(results).features) {
                        if (j > 0) {
                            objectIDs += "+OR+";
                        }
                        objectIDs += "LOTPLAN+%3D+%27"+JSON.parse(results).features[j].attributes.LOTPLAN+"%27";
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
        setError: function(value) { _self.isError(value); },
        viewModel: viewModel,
        template: { element: 'lotPlanSearchFields' },
        synchronous: true
    };


})(jQuery, ko);