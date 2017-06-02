var index = 0
$("#fishery").each(function () {
    var element = this

    if (typeof (lotplan) !== "object") lotplan = {};

    lotplan.main = (function (jQuery, ko) {

        'use strict';

        var _self = new vmMain(),

            productsAvailableUrl = "https://propertysearch.dnrm.qld.gov.au/productsAvailable",

            selectedFetchCounter = 0
            ;

        /********************************************************************************** Lifecycle */

        function constructor() {

            _self.isLoading(true);
            $(element).load('Content/templates/template.html', function () {
                ko.components.register(processComponent('lotplansearchfields', ++index), lotplan.components.lotplansearchfields);
                ko.components.register(processComponent('addresssearchfields', index), lotplan.components.addresssearchfields);
                ko.components.register(processComponent('searchresults', index), lotplan.components.searchresults);

                ko.applyBindings(_self, element);
                postBinding();
            });
        }

        function processComponent(name, suffix) {
            var elName = name + suffix
            debugger
            $(element).find(name).append("<" + elName + "></" + elName + ">")
            $(element).find('script#' + name).attr("id", elName);            
            lotplan.components[name].template.element = elName
            return elName
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
            getSearchData: function () { return _self.searchData; },
            getSelectedData: function () { return _self.selectedData; },
            getSelection: function () { return _self.selection; },

        };




    })(jQuery, ko)
});