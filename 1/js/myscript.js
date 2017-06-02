
if (typeof(dataCaptureTool) !== "object") dataCaptureTool = {};

dataCaptureTool.main = (function(jQuery, ko){

    'use strict';

    var _self = new ViewModel()

    function constructor() {
debugger
		$('#myTemplate').load('templates/tool.html', function() {
			debugger
			ko.applyBindings(new MyViewModel());
				ko.applyBindings(_self);
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