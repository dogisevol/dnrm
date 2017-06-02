/**
 * Lotplan - Search results component 
 * 
 * Search results are received from addresssearchfields or lotplansearch fields and results are displayed. 
 * A custom event is dispatched once results are displayed to tell the search elements to stop loading.
 */

// Namespace detection
if (typeof(lotplan) !== "object") lotplan = {};
if (typeof(lotplan.components) !== "object") lotplan.components = {};

lotplan.components.searchresults = (function(jQuery,ko) {


    var _self,
		map,
		markerGroup,
		dynamicLayerUrl = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer",		
        selectedIcon = new L.Icon.Default({ iconUrl: "images/marker-icon.png", shadowUrl: 'images/marker-shadow.png', } );


    /********************************************************************************** Lifecycle */

    /**
     * Init 
     */
    function setup(){

    }

	// Script for adding marker on map click
	function onMapClick(e) {
		
		var geojsonFeature = {
			"type": "Feature",
				"properties": {},
				"geometry": {
					"type": "Point",
					"coordinates": [e.latlng.lat, e.latlng.lng]
			}
		}

		var marker;
		var markerGroup = L.layerGroup().addTo(map)
		L.geoJson(geojsonFeature, {
			
			pointToLayer: function(feature, latlng){
				
				marker = L.marker(e.latlng, {
					riseOnHover: true,
					draggable: true,
					icon: selectedIcon

				});
				marker.dmsLat = ko.observable("")
				marker.dmsLng = ko.observable("")
				marker.setDms = function(dms){
					this.dmsLat(dms.lat)
					this.dmsLng(dms.lng)
				}

				marker.bindPopup(marker.getLatLng() + "<br><center><a class='marker-delete-button'/>Remove marker</a></center>");	
				marker.setDms(lotplan.utils.convertLatLngToDMS(marker.getLatLng().lat, marker.getLatLng().lng))	
					
				lotplan.main.getSelection().push(marker)
				marker.on("popupopen", onPopupOpen);
			    marker.on('dragend', function(e, marker) {					
					this.setDms(lotplan.utils.convertLatLngToDMS(this.getLatLng().lat, this.getLatLng().lng))
				});
				return marker;
			}
		}).addTo(markerGroup);
	}
	
		// Function to handle delete as well as other events on marker popup open
	function onPopupOpen() {
		var tempMarker = this;

		//var tempMarkerGeoJSON = this.toGeoJSON();

		//var lID = tempMarker._leaflet_id; // Getting Leaflet ID of this marker

		// To remove marker on click of delete
		$(".marker-delete-button:visible").click(function () {
			lotplan.main.getSelection().remove(tempMarker)
			map.removeLayer(tempMarker);
		});
	}
	
	function removeMarker(marker){
		map.removeLayer(marker);
	}
	
    function setupMap(){
		map = L.map('map').setView([-33.86617516416043, 151.2077522277832], 15);
		L.esri.basemapLayer("Streets").addTo(map);
		L.esri.dynamicMapLayer({
			url: dynamicLayerUrl,
			opacity: 0.7,
			dynamicLayers: [{
				 "id": 1,
				 "source": {
				  "type": "mapLayer",
				  "mapLayerId": 4
				 }
				},
				{
				 "id": 1000,
				 "source": {
				  "type": "mapLayer",
				  "mapLayerId": 0
				 }
				}]
		  }).addTo(map);
	lotplan.main.clearSelection()	  
	markerGroup = L.layerGroup().addTo(map);
	map.on('click', onMapClick);
	

    L.Icon.Default.imagePath = 'image';

      var bounds = L.latLngBounds([]),
          searchData = lotplan.main.getSearchData()
        

      for (var i = 0; i < searchData().length; i++) {
        var item = searchData()[i]
               
        var marker;

        //is item's geometry a ring/polygon or a point?
        if(item.geometry.rings) {
          
          // get point in middle of poly via finding highest and lowest x and y values
          var topleft,topright,bottomleft,bottomright;
          
          for(var j in item.geometry.rings[0]) { 
            if (j == 0) {
              topleft = item.geometry.rings[0][j][0];
              topright = item.geometry.rings[0][j][0];
              bottomleft = item.geometry.rings[0][j][1];
              bottomright = item.geometry.rings[0][j][1];
            }

            //detect and set topleft
            if (j > 0 && item.geometry.rings[0][j][0] < topleft){ topleft = item.geometry.rings[0][j][0]; }
            //detect and set  top right
            if (j > 0 && item.geometry.rings[0][j][0] > topright){ topright = item.geometry.rings[0][j][0]; }
            //detect and set  bottom left
            if (j > 0 && item.geometry.rings[0][j][1] < bottomleft){ bottomleft = item.geometry.rings[0][j][1]; }
            //detect and set  bottom right
            if (j > 0 && item.geometry.rings[0][j][1] > bottomright){ bottomright = item.geometry.rings[0][j][1]; }

          }

          marker = L.marker(
            [(bottomleft-topleft)/2, (topright-topleft)/2])

        } else {     
          marker = L.marker(
            [item.geometry.y, item.geometry.x])
        
        }
        bounds.extend(marker.getLatLng());
      }
      map.fitBounds(bounds);
    }
		

    /********************************************************************************** View models */

    /**
     * View model
     * @constructor
     */
    function viewModel(params) {
        _self = this;

        _self.waitingOnProducts = ko.observable(false);

        if (lotplan.main && lotplan.main.getSearchData() && lotplan.main.getSearchData()().length > 0) {
            setupMap();
        }
    }





    /**
    * Public: Parse and set search data once it is received from other classes
    */
    function setSearchData(results) {

        //parse search results and set them
        if (results) {
            var data = JSON.parse(results);

            if(data.relatedRecordGroups && data.relatedRecordGroups.length > 0) {
              data.features = data.relatedRecordGroups[0].relatedRecords;
            }
            
            if (data.features && data.features.length > 0) {
                // add some defaults for our products on the way in
                for (var i = 0; i < data.features.length; i++) {
                    var item = data.features[i].attributes;
                    item.LOT_TITLE = ko.observable("");
                    item.LOT_VALID = ko.observable(false);
                    item.PRODUCTS = ko.observableArray();
                }
                lotplan.main.getSearchData()(data.features);
                setupMap();
            } else {
                this.isError(true);
                lotplan.main.getSearchData()(false);
            }
        } else {
            lotplan.main.getSearchData()(false);
        }

        //fire custom loading finished event  
        jQuery(document).trigger( "loadingFinished");
    }




    /********************************************************************************** Private */

    /**
     * Return the component and public API
     */
    return {

        // API
        setup: setup,
        setupMap: setupMap,
        setSearchData: setSearchData,
		removeMarker: removeMarker,

        // Component
        viewModel: viewModel,       
        template: { element: 'searchResults' },
        synchronous: true
    };


})(jQuery, ko);