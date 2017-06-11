
(function() {
    var app = angular.module('mapApp', ["leaflet-directive", "esri-map-module"]);

	    app.controller('AppController', ['$scope', function($scope) {	
			$scope.sdcPoints = [
			{"zoneEastNorth": {"zone": 55, "easting" : 1239481.8403357072, "northing" : 13689538.256745618}, "latlng": {"lat": -25.08590983563934, "lng": 146.9074630737305}}
			]
		}
	])
	
})();