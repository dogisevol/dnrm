/**
 * Created by dann6343 on 8/8/14.
 */
(function() {
    var module = angular.module('esri-map-module', ["leaflet-directive"]);


    module.controller("MapCtrl", ['$scope', '$http', 'leafletData', function($scope, $http, leafletData){
		var mapCtrl = this;
		this.leafletData = leafletData
        this.baseLayer
		this.scope = $scope
        this.layers = []
        this.points = $scope.$parent.sdcPoints
		if(!this.markers)
			this.markers = []
		
		
		var lotplanUrl = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/0/query?text=&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnIdsOnly=false&returnGeometry=true&outFields=*&f=json&returnCountOnly=false&where="
		$http.get(lotplanUrl + "LOTPLAN+%3D+%27" + "1265" + "PH1828" + "%27")
			.then(function(response) {
				var data = response.data
				if (data.features.length > 0) {
					if (data.relatedRecordGroups && data.relatedRecordGroups.length > 0) {
						data.features = data.relatedRecordGroups[0].relatedRecords;
					}
					if (data.features && data.features.length > 0) {
						var item = data.features[0]
						mapCtrl.leafletData.getMap().then(function(map) {
							L.Icon.Default.imagePath = 'images/';
							map.setView([item.geometry.y, item.geometry.x], mapCtrl.scope.zoomLevel);
							map.invalidateSize();
							mapCtrl.markerGroup = L.layerGroup().addTo(map)
							map.on('click', function(e){
								var geojsonFeature = {
									"type": "Feature",
									"properties": {},
									"geometry": {
										"type": "Point",
										"coordinates": [e.latlng.lat, e.latlng.lng]
									}
								}

								var markerGroup = L.layerGroup().addTo(map)
								var marker
								L.geoJson(geojsonFeature, {	
									pointToLayer: function (feature, latlng) {
										
										marker = L.marker(e.latlng, {
											riseOnHover: true,
											draggable: true,
											icon: new L.Icon.Default({ iconUrl: "spct-marker-icon.png", shadowUrl: 'spct-marker-shadow.png'})

										})
										marker.bindPopup(marker.getLatLng() + "<br><center><a>Remove marker</a></center>")
										mapCtrl.markers.push(marker)
										marker.on("popupopen", function(e){
											var tempMarker = this;
											var closeLink = e.popup._contentNode.children[1]
											if(closeLink){
												closeLink.style.cursor = 'hand'
												closeLink.onclick = function () {
													map.removeLayer(tempMarker)
													debugger
													mapCtrl.markers.remove(tempMarker)
												}
											}
										})
										marker.on('dragend', function (e, marker) {
											//TODO
											console.log('m')
											//this.setDms(captureToolUtils.convertLatLngToDMS(this.getLatLng().lat, this.getLatLng().lng))
										})
										return marker
									}	
								}).addTo(markerGroup);
							})
						})
					}
				}
			})				

        this.setBasemapLayer = function(strLayerName) {
            leafletData.getMap().then(function(map) {
                if ( mapCtrl.baseLayer ){
                    map.removeLayer(mapCtrl.baseLayer);
                } else {
                    var streetLayer = null;
                    map.eachLayer( function (layer) {
                        if(layer._url.indexOf("openstreetmap.org") > -1){
                            streetLayer = layer;
                        }
                    });
                    if (streetLayer){
                        map.removeLayer(streetLayer);
                    }
                }
                mapCtrl.baseLayer = L.esri.basemapLayer(strLayerName);
                mapCtrl.baseLayer.addTo(map);//'Streets'
            });
        };

        this.addDynamicMapLayer = function(options) {
            leafletData.getMap().then(function(map) {
				//L.esri.dynamicMapLayer(options.url, options).addTo(map);
				        L.esri.dynamicMapLayer({
            url: options.url,
            opacity: 0.7,
            dynamicLayers: options.layerDefs
        }).addTo(map);
            });
        }
	}]);
	
    var module = angular.module('esri-map-module');

    module.directive('spatialDataCapture', function () {
        return {
            restrict: 'E',
            transclude: true,
            controller: 'MapCtrl',
            templateUrl: 'app/spatial-data-capture/spatial-data-capture.tpl.html',
			  scope: {
                mapCenter: "=",
                zoomLevel: "@",
                showSearch: "@",
				},
            controller: 'MapCtrl',
            link: function(scope, element, attributes){}
        };
    });
	
   module.directive('esriDynamicLayer', function(){
		return {
			require: '^spatialDataCapture',
			restrict: 'E',
			transclude: true,
			scope: {
				url: '@',
				opacity:'@',
				layerDefs:'='
			},
			link: function(scope, element, attrs, mapCtrl){
				var options = {};

				options.opacity = scope.opacity
				options.url = scope.url

				if(scope.layerDefs){
					options.layerDefs = scope.layerDefs;
				}
				mapCtrl.addDynamicMapLayer(options);
			},
			template: '<div ng-transclude></div>'
		};
	});

})();