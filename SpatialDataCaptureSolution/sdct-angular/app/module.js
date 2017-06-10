/**
 * Created by dann6343 on 8/8/14.
 */
/**
 * Main application js
 */
(function() {
    var app = angular.module('mapApp', ["leaflet-directive", "esri-map-module"]);

	    app.controller('AppController', ['$scope', function($scope) {	
			$scope.sdcPoints = []
			$scope.$watchCollection(
				"sdcPoints",
				function( newValue, oldValue ) {
					console.log($scope.sdcPoints)
				}
			)
		}
	])
	
})();