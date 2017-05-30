/**
 * Lotplan - Search results component 
 * 
 * Search results are received from addresssearchfields or lotplansearch fields and results are displayed. 
 * A custom event is dispatched once results are displayed to tell the search elements to stop loading.
 */

// Namespace detection
if (typeof(lotplan) !== "object") lotplan = {};
if (typeof(lotplan.components) !== "object") lotplan.components = {};

lotplan.components.receipt = (function (jQuery, ko) {

    var _self;
    var getProductURLsURL = "https://propertysearch.dnrm.qld.gov.au/getProductURLs";
    
    /********************************************************************************** Lifecycle */

    /**
     * Init 
     */
    function setup(){

        urlParams = lotplan.utils.getUrlParamsObject();
        
        
        _self.number(decodeURIComponent(urlParams.number));
        _self.date(decodeURIComponent(urlParams.date).replace(/\+/g, ' '));
        _self.total(decodeURIComponent(urlParams.total));
        _self.email(decodeURIComponent(urlParams.email));
        _self.errorMessage(decodeURIComponent(urlParams.errorMessage).replace(/\+/g, ' '));
        


        lotplan.utils.ajaxRequest(getProductURLsURL, 'POST', {"receipt":_self.number()}, function (results) {
            if (!results) return;
            lotplan.main.emptyCart();
            _self.products(results);
        });

    }


    /********************************************************************************** View models */

    /**
     * View model
     * @constructor
     */
    function viewModel(params) {
        _self = this;
        _self.newSearch = newSearch;

        _self.number = ko.observable();         //receipt number, entries looked up based off this
        _self.date = ko.observable();           //date of transaction  
        _self.total = ko.observable();          //total cost of transaction
        _self.email = ko.observable();          //email of user who made transaction
        _self.errorMessage = ko.observable();   //error message if success code isn't 00

        _self.products = ko.observable();
        
    };


    function newSearch(vm, ev) {
        window.location.hash = 'page=search';
    }


    /********************************************************************************** Private */

    /**
     * Return the component and public API
     */
    return {

        // API
        setup: setup,

        // Component
        viewModel: viewModel,     
        template: { element: 'receipt' },
        synchronous: true
    };


})(jQuery, ko);