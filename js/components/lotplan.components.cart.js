/**
 * Lotplan - Cart component
 * 
 * Show cart from items added from the lot plan search 
 */

// Namespace detection
if (typeof(lotplan) !== "object") lotplan = {};
if (typeof(lotplan.components) !== "object") lotplan.components = {};

lotplan.components.cart = (function(jQuery,ko) {

    var _self,
        startTransactionUrl = "https://propertysearch.dnrm.qld.gov.au/startTransaction";

    /********************************************************************************** Lifecycle */

    /**
     * Init 
     */
    function setup(){

    }


    /********************************************************************************** View models */

    /**
     * View model
     * @constructor
     */
    function viewModel(params) {
        _self = this;

        _self.removeItems = ko.observableArray();
        _self.removeSelectedItems = removeSelectedItems;

        _self.givenName = ko.observable();
        _self.familyName = ko.observable();
        _self.email = ko.observable();
        _self.confirmEmail = ko.observable();
        _self.phone = ko.observable();
        _self.accept_tc = ko.observable(false);

        _self.validateBuy = validateBuy;
        _self.buyProcess = buyProcess;

        _self.alertType = ko.observable("");
        _self.alertMessage = ko.observable("");
        _self.alertClose = function () {
            _self.alertType("");
            _self.alertMessage("");
        }
        

    }


    function validateBuy() {

        return new lotplan.utils.Validator()
            .add("Enter your given name", function () { return this.givenName() })
            .add("Enter your family name", function () { return this.familyName() })
            .add("Enter your email address", function () { return this.email() })
            .add("Enter your phone number", function () { return this.phone() })
            .add("Confirmation email must be the same as email address", function () { return this.email() === this.confirmEmail(); })
            .add("You must accept the terms, conditions and privacy statement to continue", function () { return this.accept_tc() })
            .validate(_self, function (valid, count) {
                if (valid) { return true; }
                _self.alertType("danger");
                _self.alertMessage(this.errorMessage("<p>The following " + (count > 1 ? "are" : "is") + " required to complete your purchase</p>"));
                return false;
            });
    }


    function removeSelectedItems() {
        for (var i = 0; i < _self.removeItems().length; i++) {
            lotplan.main.cartHelper().remove(_self.removeItems()[i]);
        }
        _self.removeItems.removeAll();
    }

    // start the purchase workflow
    function buyProcess() {

        if (!confirm("You are about to be sent to our payment service provided by the Commonwealth Bank. Once the payment is confirmed, you will be returned to our website. \n\nClick OK to continue or cancel if you aren't ready to pay yet.")) {
            return;
        }

        var cartData = lotplan.main.cartHelper().items();

        var buyEntries = [];

        for(var i = 0; i < cartData.length; i++) {
            buyEntries.push(
                {"product_id":cartData[i].i, "lot":cartData[i].l, "plan":cartData[i].p, "title_reference":cartData[i].t, "address":cartData[i].d}
            )
        }
        var buyData = { 
            "first_name": _self.givenName(),
            "last_name": _self.familyName(),
            "phone": _self.phone(),
            "email": _self.email(),
            "entries": buyEntries
        }

        lotplan.utils.ajaxRequest(startTransactionUrl, 'POST', buyData, function (results) {

            if (!results) return;

            //window.location.hash = 'page=receipt';

            window.location.href = results;

        });

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
        template: { element: 'cart' },
        synchronous: true
    };


})(jQuery, ko);