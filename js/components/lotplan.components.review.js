/**
 * Lotplan - Search results component 
 * 
 * Search results are received from addresssearchfields or lotplansearch fields and results are displayed. 
 * A custom event is dispatched once results are displayed to tell the search elements to stop loading.
 */

// Namespace detection
if (typeof(lotplan) !== "object") lotplan = {};
if (typeof(lotplan.components) !== "object") lotplan.components = {};

lotplan.components.review = (function(jQuery,ko) {

    var _self;

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

        // buttons and tc/pp acceptance
       // _self.accept_tc = ko.observable();
        _self.added = ko.observable();

        _self.backToSearch = backToSearch;
        _self.newSearch = newSearch;
        _self.addToCart = addToCart;

        _self.titleGroupKeys = ko.pureComputed(function () {
            return Object.keys(_self.titleGroups());
        });

        // we will provide a wrapper to loop around our "titles", internally referencing the lots
        _self.titleGroups = ko.computed(function () {
            var titleGroups = {}, selectedData = lotplan.main.getSelectedData();

            for (var i = 0; i < selectedData().length; i++) {
                var thisLot = selectedData()[i];
                // make sure we have this title (we add an undescore before it so we can store it as a member
                var thisTitle = "_" + thisLot.LOT_TITLE();
                if (!titleGroups[thisTitle]) {
                    titleGroups[thisTitle] = { title:thisLot.LOT_TITLE(), lots: [], products: [] };
                }

                // ok so now we have the title, lets add this lot to it
                titleGroups[thisTitle].lots.push(thisLot);

                // if we don't have any products on the title, copy a single list of products up to the title level
                // from the lot - a bit of a hack - as products come in for each lot
                if (titleGroups[thisTitle].products.length < 1) {
                    titleGroups[thisTitle].products.push.apply(titleGroups[thisTitle].products, thisLot.PRODUCTS());
                }

            }
            return titleGroups;
        })

        // tooltip for the review area if the product already exists in the cart
        _self.selectedProductAlreadyInCartTooltip = function (data, prod) {
            if (lotplan.main.cartHelper().find({ product: prod, data: _self.titleGroups()[data] }, true)) {
                return 'This product already exists in your cart.';
            }
        };

        _self.checkSelectedProduct = function (data, prod, e) {
            if (e.target.checked) {
                // does this product already exist in the cart?
                if (lotplan.main.cartHelper().find({ product: prod, data: _self.titleGroups()[data] }, true)) {
                    return false;
                }
                // add it to the selectedProducts
                lotplan.main.getSelectedProducts().push({ data: _self.titleGroups()[data], product: prod })
            } else {
                // remove it from our selectedProducts
                lotplan.main.getSelectedProducts().remove(function (item) {
                    return (item.data === _self.titleGroups()[data] && item.product === prod);
                });
            }
            return true;
        }

        // selectedProducts total
        _self.selectedProductTotal = ko.pureComputed(function () {
            var total = 0;
            for (var i = 0; i < lotplan.main.getSelectedProducts()().length; i++) {
                total += parseFloat(lotplan.main.getSelectedProducts()()[i].product.price);
            }
            return total;
        });

        _self.alertType = ko.observable("");
        _self.alertMessage = ko.observable("");
        _self.alertClose = function () {
            _self.alertType("");
            _self.alertMessage("");
        }

        _self.productsLoading = lotplan.main.productsLoading();

        // make sure we have all our products?
        var selections = lotplan.main.getSelectedData()();
        for (var i = 0; i < selections.length; i++) {
            lotplan.main.setLotProduct(selections[i]);
        }

    }

    function backToSearch(vm, ev) {
        window.location.hash = 'page=search';
    }

    function newSearch(vm, ev) {
        lotplan.main.clearData(true, false, false);
        window.location.hash = 'page=search';
    }

    function addToCart(vm, ev) {

        jQuery(ev.target).attr('disabled', 'disabled');

        // add our new (summarised) items to the cart
        var newCartItems = [],
            selectedProducts = lotplan.main.getSelectedProducts();

        if (!lotplan.main.cartHelper().add(selectedProducts(), true, function () {
            _self.alertType("danger");
            _self.alertMessage("<p>You have reached the limit of your cart, no more products can be added.</p>"
                + "<p>Please proceed to the checkout and either purchase or remove items in your cart to continue ordering.</p>");
        })) {
            // the cart was not added to so return
            return;
        }

        _self.added(true);

        lotplan.main.clearData(true, false, false);
        lotplan.main.goToCart(vm, ev);

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
        template: { element: 'review' },
        synchronous: true
    };


})(jQuery, ko);