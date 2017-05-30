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
        markers = [],
        featureLayerUrl = "https://geospatial.information.qld.gov.au/ArcGIS/rest/services/QLD/LandParcelPropertyFramework/MapServer/4";
        featureLayerUrl = "https://geospatial.information.qld.gov.au/ArcGIS/rest/services/QLD/LandParcelPropertyFramework/MapServer/4";
		featureLayerUrl = "https://gisservices.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer"

    /********************************************************************************** Lifecycle */

    /**
     * Init 
     */
    function setup(){

    }

    function setupMap(){
      var map = L.map('map').setView([-33.86617516416043, 151.2077522277832], 15);
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
			url: featureLayerUrl,
			opacity: 0.7,
			dynamicLayers: [{
				 "id": 77,
				 "source": {
				  "type": "mapLayer",
				  "mapLayerId": 4
				 }
				},
				{
				 "id": 78,
				 "source": {
				  "type": "mapLayer",
				  "mapLayerId": 0
				 }
				}]
		  }).addTo(map);
		  

      //clear markers
      if (markers) {
        for(i=0;i<markers.length;i++) { map.removeLayer(markers[i]); }
      }

      L.Icon.Default.imagePath = 'https://www.dnrm.qld.gov.au/';

      var bounds = L.latLngBounds([]),
          markers = [],
          searchData = lotplan.main.getSearchData(),
          unselectedIcon = new L.Icon.Default({ iconUrl: "https://www.dnrm.qld.gov.au/?a=332335", shadowUrl: 'https://www.dnrm.qld.gov.au/?a=332701' } ),
          selectedIcon = new L.Icon.Default({ iconUrl: "https://www.dnrm.qld.gov.au/?a=332681", shadowUrl: 'https://www.dnrm.qld.gov.au/?a=332701', } );


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

        // Component
        viewModel: viewModel,       
        template: { element: 'searchResults' },
        synchronous: true
    };


})(jQuery, ko);