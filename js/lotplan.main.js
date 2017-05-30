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
        ko.components.register('review', lotplan.components.review);
        ko.components.register('cart', lotplan.components.cart);
        ko.components.register('receipt', lotplan.components.receipt);

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
            routePage();
        });

        // initialise cart helper (this will load any current cookie into the cart)
        _self.cartHelper.initalise(_self.cartItems);

        // activate any tooltips
        jQuery(document).ready(function () {
            jQuery("body").tooltip({ selector: '[data-toggle=tooltip]' });
        });

        // Set initial route
        routePage();
    }


    /********************************************************************************** View models */

    function vmMain() {
        _self = this;

        //page routing
        _self.isLoading = ko.observable();

        _self.pageRoute = ko.observable('');

        // data selected for review / product selection
        _self.selectedData = ko.observableArray();

        // data returned from a search
        _self.searchData = ko.observableArray();
		
		_self.selection = ko.observableArray();

        // products to review before adding to a cart
        _self.selectedProducts = ko.observableArray();
        _self.productsLoading = ko.observable(false);
        _self.errorText = ko.observable();

        // helper functions
        _self.formatCurrency = formatCurrency;
        _self.getLotSummary = getLotSummary;

        // cart storage
        _self.cartItems = ko.observableArray();
        _self.cartHelper = new lotplan.utils.Cart(_self.cartItems, "cart");

        // navigation helpers
        _self.viewDetails = viewDetails;
        _self.goToCart = goToCart;

        _self.checkAllSearchData = checkAllSearchData;
		_self.clearSelection = clearSelection;
		_self.removeSelection = removeSelection;
    }


    /********************************************************************************** Page routing */

    /**
     * Route the page to the correct component
     */
    function routePage() {

        // Check if there is a deep link
        var urlParams = lotplan.utils.getUrlParamsObject();

        //before routing make sure there is no selection
            
        if (urlParams['page'] === 'review') {
            //only show selected address if there is an address selected
            if (_self.selectedData().length > 0) {
                _self.pageRoute('review');
                lotplan.components.review.setup();        
            } else {
                 window.location.hash = 'page=search';
                 _self.pageRoute('search');
                 clearData(false, true, true);
                lotplan.components.addresssearchfields.setup();
                lotplan.components.lotplansearchfields.setup();

            }
        } else if (urlParams['page'] === 'review') {
            _self.pageRoute('review');
            lotplan.components.review.setup();
        } else if (urlParams['page'] === 'cart') {
            clearData(true, false, true);
            _self.pageRoute('cart');
            lotplan.components.cart.setup();
        } else if (urlParams['page'] === 'receipt') {
            _self.pageRoute('receipt');
            lotplan.components.receipt.setup();
        } else if (urlParams['page'] === undefined || urlParams['page'] === 'search') {
            window.location.hash = 'page=search';
            _self.pageRoute('search');
            clearData(false, true, true);
            lotplan.components.addresssearchfields.setup();
            lotplan.components.lotplansearchfields.setup();
        }
        
        _self.isLoading(false);
    }
	
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



    function setLotProduct(item) {

        // if we already have the lot title, or don't have the required data, return here as nothing we can or should do.
        if (item.LOT_TITLE()) return;

        var matches = item.PLAN.match(/(\d+|\D+)/g);

        if (matches && matches.length > 0) {
            //increment loaded counter for determining loading status
            selectedFetchCounter ++;

            //lotplan.components.review.setAlert("","");

            _self.productsLoading(true);

            lotplan.utils.ajaxRequest(productsAvailableUrl, 'POST', { "lotnum": item.LOT, "plannum": matches[1], "plantype": matches[0] }, function (results) {

                if (results && !results.title_reference) {
                    //not found error
                    //lotplan.components.review.setAlert("danger", "<p>No products found for this lot and plan.</p><p><a href='#page=search'>Return to Property Search</a></p>");
                    _self.productsLoading(false);
                    return;
                }

                item.LOT_TITLE(results.title_reference);
                item.LOT_VALID(true);
                item.PRODUCTS([
                    { pid: results.pid, name: 'Current title search', price: results.price, sample: 'samples/title-search-sample.pdf' }
                ]);
                
                //deincrement loaded counter
                selectedFetchCounter --;
                if (selectedFetchCounter==0){
                    _self.productsLoading(false);
                }
            }, function (errResult) {
                //webservice error
                //lotplan.components.review.setAlert("danger", "<p>The application webservice cannot be reached.</p><p><a href='#page=search'>Return to Property Search</a></p>");
                _self.productsLoading(false);
            });
        }

    }

 


    /********************************************************************************** Helper methods */


    // clears data stores, defaults to all data
    function clearData(search, selected, products) {
        if ((search || search === undefined) && _self.searchData().length) _self.searchData.removeAll();
        if ((selected || selected === undefined) && _self.selectedData().length) _self.selectedData.removeAll();
        if ((products || products === undefined) && _self.selectedProducts().length) _self.selectedProducts.removeAll();
    }

    // returns a currency string
    function formatCurrency(value) {
        return "$" + parseFloat(value || 0).toFixed(2);
    }

    // returns a standardised way of printing out a lot/plan/title reference
    function getLotSummary(lot, plan, title) {
        return 'Lot on plan: ' + (lot + '/' + plan) + (title ? ' - Title: ' + title : '');
    }




    /********************************************************************************** Navigation methods */



    //move user to their cart at any time
    function goToCart(vm, ev) {
        jQuery(ev.target).attr('disabled', 'disabled');
        window.location.hash = 'page=cart';
        clearData(true, false, false);
    }


    // show the details of a search
    function viewDetails(vm, ev) {
        window.scrollTo(0, 0);
        _self.selectedProducts.removeAll();
        window.location.hash = 'page=review';
    }




    /**
     * Return public API
     */
    return {
        constructor: constructor(),

        // navigation
        goToCart: goToCart,

        // helpers
        setLotProduct: setLotProduct,
        clearData: clearData,
        productsLoading: function(){return _self.productsLoading;},
        cartHelper: function () { return _self.cartHelper },
        emptyCart: function() { _self.cartItems.removeAll();  _self.cartHelper.updateCookie(true); return true;},

        getSearchData: function () { return _self.searchData; },
        getSelectedData: function () { return _self.selectedData; },
		getSelection: function () { return _self.selection; },
        getSelectedProducts: function () { return _self.selectedProducts; }

    };




})(jQuery, ko);