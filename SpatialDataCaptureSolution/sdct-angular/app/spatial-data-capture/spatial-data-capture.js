
(function() {
    var module = angular.module('esri-map-module', ["leaflet-directive"]);


    module.controller("MapCtrl", ['$scope', '$http', 'leafletData', function($scope, $http, leafletData){
		var mapCtrl = this;
		L.Icon.Default.imagePath = 'images/';
		this.leafletData = leafletData
        this.baseLayer
		this.scope = $scope
        this.layers = []
		if($scope.output){
			$scope.points = $scope.$parent[$scope.output]	
		}else{
			$scope.points = $scope.$parent.sdcPoints
		}
		this.points = $scope.points
		this.markers = []
		
		$scope.$watchCollection(
				"points",
				function( newValue, oldValue ) {					
					var toRemove = []
					var toCreate = []
					var points = []
					mapCtrl.markers.forEach(function(marker){
						if($scope.points.indexOf(marker.point) < 0){
							toRemove.push(marker)
						}else{
							points.push(marker.point)
						}
					})
					$scope.points.forEach(function(point){
						if(points.indexOf(point) < 0){
							toCreate.push(point)
						}
					})
					mapCtrl.leafletData.getMap().then(function(map) {
						toRemove.forEach(function(marker){
							map.removeLayer(marker)
						})
						toCreate.forEach(function(point){
							if(!point.latlng){
								point.latlng = {}
								if(point.zoneEastNorth){
									mapCtrl.setLongLatFromZoneEastNorth(point)
								}else{
									//TODO dms
								}
							}
							
							mapCtrl.onMapClick(point, point)
							
						})
					})
				}
		)
		
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
							map.setView([item.geometry.y, item.geometry.x], mapCtrl.scope.zoomLevel);
							map.invalidateSize();
							mapCtrl.markerGroup = L.layerGroup().addTo(map)
							map.on('click', mapCtrl.onMapClick)
						})
					}
				}
			})	
			
		this.onMapClick = function(e, point){
			mapCtrl.leafletData.getMap().then(function(map) {
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
						
						marker.on("popupopen", function(e){
							var tempMarker = this;
							var closeLink = e.popup._contentNode.children[1]
							if(closeLink){
								closeLink.style.cursor = 'hand'
								closeLink.onclick = function () {
									mapCtrl.points.splice(mapCtrl.points.indexOf(tempMarker.point), 1)
									mapCtrl.markers.splice(mapCtrl.markers.indexOf(tempMarker), 1)
									map.removeLayer(tempMarker)

								}
							}
						})
						marker.on('dragend', function (e) {
							var marker = e.target
							var oldPoint = marker.point
							marker.point = mapCtrl.createPoint(marker)
							mapCtrl.points[mapCtrl.points.indexOf(oldPoint)] = marker.point
						})
						return marker
					}	
				}).addTo(markerGroup);
				if(point){
					marker.point = point
				}else{
					marker.point = mapCtrl.createPoint(marker)
					mapCtrl.points.push(marker.point)
				}
				mapCtrl.markers.push(marker)
			})
		}	

		this.createPoint = function(marker){
			var point = {}
			point.latlng = {}
			point.latlng.latitude = marker.getLatLng().lat
			point.latlng.longitude = marker.getLatLng().lng
			point.dms = mapCtrl.convertLatLngToDMS(point.latitude, point.longitude)
			mapCtrl.setZoneEastNorthFromLongLat(point)
			return point
		}	
			
		this.setZoneEastNorthFromLongLat = function(point) {		
			var zone = 1 + Math.floor((point.latlng.longitude+180)/6);
			var firstProjection = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"; //EPSG:4326
			var secondProjection = "+proj=utm +zone=" + zone + " +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs"; //EPSG:32756		
			var coords = proj4(firstProjection,secondProjection,[point.latlng.latitude, point.latlng.longitude]);				
			point.zoneEastNorth =  {
				"zone" : zone,
				"easting" : coords[0],
				"northing" : coords[1],
			}
			return point
		}	
		
		
		this.setLongLatFromZoneEastNorth = function(point) {
			var firstProjection = "+proj=utm +zone=" + point.zoneEastNorth.zone + " +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs"; //EPSG:32756		
			var secondProjection = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"; //EPSG:4326
			var coords = proj4(firstProjection,secondProjection,[point.zoneEastNorth.easting, point.zoneEastNorth.northing]);				
			point.latlng.longitude = coords[0]
			point.latlng.latitude = coords[1]
			return point
		}
		
		this.convertLatLngToDMS = function(lat, lng) {
			var deg, min
			deg = parseInt(lng);
			var result = {}
			min = (lng - deg) * 60;
			result.lng = deg + 'ยบ ' + mapCtrl.format('00', parseInt(min)) + "' " + mapCtrl.format('00.0', (min - parseInt(min)) * 60) + "''";
			deg = parseInt(lat);
			min = (lat - deg) * 60;
			result.lat = deg + 'ยบ ' + mapCtrl.format('00', parseInt(min)) + "' " + mapCtrl.format('00.0', (min - parseInt(min)) * 60) + "''";
			return result
		}


		this.format = function(m, v) {
			if (!m || isNaN(+v)) {
				return v; //return as it is.
			}
			//convert any string to number according to formation sign.
			var v = m.charAt(0) == '-' ? -v : +v;
			var isNegative = v < 0 ? v = -v : 0; //process only abs(), and turn on flag.

			//search for separator for grp & decimal, anything not digit, not +/- sign, not #.
			var result = m.match(/[^\d\-\+#]/g);
			var Decimal = (result && result[result.length - 1]) || '.'; //treat the right most symbol as decimal
			var Group = (result && result[1] && result[0]) || ','; //treat the left most symbol as group separator

			//split the decimal for the format string if any.
			var m = m.split(Decimal);
			//Fix the decimal first, toFixed will auto fill trailing zero.
			v = v.toFixed(m[1] && m[1].length);
			v = +(v) + ''; //convert number to string to trim off *all* trailing decimal zero(es)

			//fill back any trailing zero according to format
			var pos_trail_zero = m[1] && m[1].lastIndexOf('0'); //look for last zero in format
			var part = v.split('.');
			//integer will get !part[1]
			if (!part[1] || part[1] && part[1].length <= pos_trail_zero) {
				v = (+v).toFixed(pos_trail_zero + 1);
			}
			var szSep = m[0].split(Group); //look for separator
			m[0] = szSep.join(''); //join back without separator for counting the pos of any leading 0.

			var pos_lead_zero = m[0] && m[0].indexOf('0');
			if (pos_lead_zero > -1) {
				while (part[0].length < (m[0].length - pos_lead_zero)) {
					part[0] = '0' + part[0];
				}
			} else if (+part[0] == 0) {
				part[0] = '';
			}

			v = v.split('.');
			v[0] = part[0];

			//process the first group separator from decimal (.) only, the rest ignore.
			//get the length of the last slice of split result.
			var pos_separator = (szSep[1] && szSep[szSep.length - 1].length);
			if (pos_separator) {
				var integer = v[0];
				var str = '';
				var offset = integer.length % pos_separator;
				for (var i = 0, l = integer.length; i < l; i++) {

					str += integer.charAt(i); //ie6 only support charAt for sz.
					//-pos_separator so that won't trail separator on full length
					if (!((i - offset + 1) % pos_separator) && i < l - pos_separator) {
						str += Group;
					}
				}
				v[0] = str;
			}

			v[1] = (m[1] && v[1]) ? Decimal + v[1] : "";
			return (isNegative ? '-' : '') + v[0] + v[1]; //put back any negation and combine integer and fraction.
		}
			

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
            //templateUrl: 'app/spatial-data-capture/spatial-data-capture.tpl.html',
			template : '<leaflet height="100" weight="100"></leaflet>',
			scope: {
				mapCenter: "=",
				zoomLevel: "@",
				showSearch: "@",
				output: "@",
			},
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