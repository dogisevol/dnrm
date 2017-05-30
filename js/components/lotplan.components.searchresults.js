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
        markers = [],
        featureLayerUrl = "https://geospatial.information.qld.gov.au/ArcGIS/rest/services/QLD/LandParcelPropertyFramework/MapServer/4";
        featureLayerUrl = "https://geospatial.information.qld.gov.au/ArcGIS/rest/services/QLD/LandParcelPropertyFramework/MapServer/4";
		dynamicLayerUrl = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer",		
		unselectedIcon = new L.Icon.Default({ iconUrl: "https://www.dnrm.qld.gov.au/?a=332335", shadowUrl: 'https://www.dnrm.qld.gov.au/?a=332701' } ),
        selectedIcon = new L.Icon.Default({ iconUrl: "https://www.dnrm.qld.gov.au/?a=332681", shadowUrl: 'https://www.dnrm.qld.gov.au/?a=332701', } );


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
					
					title: "Resource Location",
					alt: "Resource Location",
					riseOnHover: true,
					draggable: true,
					icon: selectedIcon,

				});
				marker.bindPopup(marker.getLatLng() + "<br><center><a class='marker-delete-button'/>Remove marker</a></center>");
				lotplan.main.getSelection().push({"marker": marker, "dms": latLngToDMS(marker.getLatLng())})
				marker.on("popupopen", onPopupOpen);
			
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
	
	function latLngToDMS(latLng){
      deg = parseInt(latLng.lng);
	  var result = {}
      min = (latLng.lng - deg) * 60;
      result.lng = deg + 'º ' + format('00', parseInt(min)) + "' " + format('00.0', (min - parseInt(min)) * 60) + "''";
      deg = parseInt(latLng.lat);
      min = (latLng.lat - deg) * 60;
      result.lat = deg + 'º ' + format('00', parseInt(min)) + "' " + format('00.0', (min - parseInt(min)) * 60) + "''";
	  return result
	}
	
	
	function format(m, v){
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
	
    function setupMap(){
      map = L.map('map').setView([-33.86617516416043, 151.2077522277832], 15);
        /*L.tileLayer('https://api{s}.nowwhere.com.au/1.1.2/tile/50/{z}/{x}/{y}/?key=oDYTVpCsmigGKoxiy7ZxyNpIasMjEcMelJqTyz1x', {
            minZoom: 13,
            maxZoom: 18,
            attribution: 'Map data &copy; MapData Services',
            subdomains: ['1', '2', '3', '4']
        }).addTo(map);*/
		
		L.esri.basemapLayer("Streets").addTo(map);
		
		/*L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);*/
		

		/*L.esri.dynamicMapLayer({
			url: "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer",
			opacity: 0.7
		  }).addTo(map);*/
		  

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
		  
	markerGroup = L.layerGroup().addTo(map);
	map.on('click', onMapClick);
	

	
	
      //clear markers
      if (markers) {
        for(i=0;i<markers.length;i++) { map.removeLayer(markers[i]); }
      }

      L.Icon.Default.imagePath = 'https://www.dnrm.qld.gov.au/';

      var bounds = L.latLngBounds([]),
          markers = [],
          searchData = lotplan.main.getSearchData()
        

      for (var i = 0; i < searchData().length; i++) {
        var item = searchData()[i], attrs = item.attributes;
               
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
            [(bottomleft-topleft)/2, (topright-topleft)/2], 
            { title: "Lot: " + attrs.LOT + " plan: " + attrs.PLAN, opacity: 1, icon: unselectedIcon }
          );

        } else {
        
          marker = L.marker(
            [item.geometry.y, item.geometry.x], 
            { title: "Lot: " + attrs.LOT + " plan: " + attrs.PLAN, opacity: 1, icon: unselectedIcon }
          );
        
        }

        marker.on("click", function (e) {
            var selectedData = lotplan.main.getSelectedData();
            if(~selectedData.indexOf(e.target.lotdata)) {
                selectedData.remove(e.target.lotdata);
            } else {
                selectedData.push(e.target.lotdata);
            }

        })
        marker.lotdata = attrs;
        markers.push(marker.addTo(map));
        bounds.extend(marker.getLatLng());
      }
      map.fitBounds(bounds);

        // load feature layer after markers added to ensure minimal bounds
        // also, we want actually show the layer, only the specific feature.
        // maybe we could do this from the lotdata above as it is a lot of overhead to get the whole layer the specific address feature(s).
      L.esri.featureLayer({ url: featureLayerUrl, 
            style: {opacity: 0, weight: 1 },
            onEachFeature: function (feature, layer) {

                    layer.setStyle( { fill:false, color:"#000" } );

                    for (var i = 0; i < searchData().length; i++) {
                        if (feature.properties.LOT == searchData()[i].attributes.LOT && feature.properties.PLAN == searchData()[i].attributes.PLAN) {
                        layer.setStyle( { fill:true, color:"red" } )
                      }
                    }

            } 
      }).addTo(map);


      // subscribe to the selected data array
      lotplan.main.getSelectedData().subscribe(function (newValue) {

          // go get our products
          if(newValue.length > 0) {
              lotplan.main.setLotProduct(newValue[newValue.length - 1]);
          }

          //  manipulate the corresponding markers
          for(var i = 0; i < markers.length; i++) {
              markers[i].setIcon(~newValue.indexOf(markers[i].lotdata) ? selectedIcon : unselectedIcon);
          }

      });

      //add click events to results table
      eventBinding();
    }
		

    function eventBinding(){
      jQuery('#results tbody td').on('click', function(e){
        if(!jQuery(e.target).is('input')){
          jQuery(e.target).parent().find('input').trigger('click');
        }
      });
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