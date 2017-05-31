/**
 * Lotplan - Address search fields component 
 * 
 * Fields:  A single address field that 
 */

if (typeof(lotplan) !== "object") lotplan = {};

lotplan.main = (function(jQuery, ko){

    'use strict';

    var _self = new vmMain(),

        productsAvailableUrl = "https://propertysearch.dnrm.qld.gov.au/productsAvailable",

        selectedFetchCounter = 0
        ;

    /********************************************************************************** Lifecycle */

    function constructor() {

        _self.isLoading(true);

        //register components
        ko.components.register('lotplansearchfields', lotplan.components.lotplansearchfields);
        ko.components.register('addresssearchfields', lotplan.components.addresssearchfields);
        ko.components.register('searchresults', lotplan.components.searchresults);

        ko.applyBindings(_self);

        // Start post binding
        postBinding();
    }

    /**
     * Post binding
     * Actions occur after components and this VM are registered and created
     */
    function postBinding() {

        // Watch for hashchange events
        jQuery(window).on('hashchange', function(){
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
		
		_self.selection = ko.observableArray();


        _self.errorText = ko.observable();

        _self.checkAllSearchData = checkAllSearchData;
		_self.clearSelection = clearSelection;
		_self.removeSelection = removeSelection;
    }


    /********************************************************************************** Page routing */

	
	 function clearSelection() {
		 _self.selection().forEach(function(selection){
			lotplan.components.searchresults.removeMarker(selection.marker)
		 });
		 _self.selection.removeAll();
	 }
	 
	 function removeSelection() {
		lotplan.components.searchresults.removeMarker(this.marker)
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
		formatLat: function()  {debugger; return lotplan.util.convertToDMS(this.getLatLng().lat)},
		formatLng: function()  {debugger; return lotplan.util.convertToDMS(this.getLatLng().lng)},
        getSearchData: function () { return _self.searchData; },
        getSelectedData: function () { return _self.selectedData; },
		getSelection: function () { return _self.selection; },

    };




})(jQuery, ko);