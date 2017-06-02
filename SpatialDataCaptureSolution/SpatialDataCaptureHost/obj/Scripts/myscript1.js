
if (typeof(dataCaptureTool) !== "object") dataCaptureTool = {};

dataCaptureTool.main = (function(jQuery, ko){
    'use strict';

    var _self = new ViewModel()

    function constructor() {
        $('#myTemplate').load('Content/templates/tool.html', function () {
            ko.applyBindings(_self, $('#myTemplate')[0]);
		});
	}

    function ViewModel() {
        _self = this;
    }

    /**
     * Return public API
     */
    return {
        constructor: constructor(),
    };
})(jQuery, ko);