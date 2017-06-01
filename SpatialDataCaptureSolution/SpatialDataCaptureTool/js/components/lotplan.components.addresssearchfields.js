/**
 * Lotplan - Address search fields component 
 * 
 * Fields:  A single address field that 
 */

// Namespace detection
if (typeof(lotplan) !== "object") lotplan = {};
if (typeof(lotplan.components) !== "object") lotplan.components = {};

lotplan.components.addresssearchfields = (function(jQuery,ko) {


    var _self;

    var addressURL      = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/0/query?geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnCountOnly=false&returnIdsOnly=false&returnGeometry=false&outFields=ADDRESS&f=json&where=";
    var lotplanURL      = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/0/query?text=&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnCountOnly=false&returnIdsOnly=false&returnGeometry=true&outFields=*&f=json&where=";

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
                        if (jQuery.inArray(v.attributes.ADDRESS, addresses) < 0){
                            addresses.push(v.attributes.ADDRESS);
                            _self.addressValid(true);
                        }
                    });

                    asyncResults(addresses);

                });
        })

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
        setError: function(value) { _self.isError(value); },
        viewModel: viewModel,
        template: { element: 'addressSearchFields' },
        synchronous: true
    };


})(jQuery, ko);