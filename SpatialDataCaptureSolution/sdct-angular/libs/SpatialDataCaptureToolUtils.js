if (captureToolUtils === undefined) var captureToolUtils = {};

captureToolUtils = (function (jQuery) {


    'use strict';


    /**
     * Make an ajax request
     * @public
     * @param url The URL endpoint
     * @param verb GET or PUT
     * @param reqData Any data as an object
     * @param callback The callback method 
     */
    function ajaxRequest(url, verb, reqData, callback, errback) {
        var req = jQuery.ajax({
            url: url,
            method: verb,
            crossDomain: true,
            data: reqData,
            xhrFields: {
                withCredentials: false
            }
        });

        req.done(function (data, textStatus, jqXHR) {
            callback(data);
        });

        req.fail(function (jqXHR, textStatus, errorThrown) {

            if (errback) return errback.call(jqXHR);

            // Unauthorised
            if (jqXHR.status == 401) {
                handleUnauthorised();
            }
        });
    }




    /**
     * Make multiple ajax requests - GET requests only
     * @param urlArrayObj Array { url }
     * @param callback The callback method
     */
    function multiAjaxRequest(url) {

        var deferred = jQuery.Deferred();

        ajaxRequest(url, 'GET', null, function (data) {
            deferred.resolve(data);
        });

        return deferred.promise();
    }






    /**
     * Show an ajax loading screen
     */
    function showLoadingScreen() {

    }


    /**
     * Setup the the publish and subscribe system for event messaging
     * @automatic initalisation
     */
    function setupPubSub() {
        jQuery.Topic = function (id) {
            var callbacks, method,
                topic = id && topics[id];

            if (!topic) {
                callbacks = jQuery.Callbacks();
                topic = {
                    publish: callbacks.fire,
                    subscribe: callbacks.add,
                    unsubscribe: callbacks.remove
                };
                if (id) {
                    topics[id] = topic;
                }
            }
            return topic;
        };
    }


    // validation handler
    function Validator() {
        this.items = [];
        this.errors = [];
    }

    Validator.prototype.add = function (msg, fn) {
        this.items.push({ msg: msg, fn: fn });
        return this;
    }

    Validator.prototype.validate = function (thisArg, callback) {
        for (var i = 0; i < this.items.length; i++)
            if (!this.items[i].fn.call(thisArg || this))
                this.errors.push(this.items[i].msg);
        if (callback) { return callback.call(this, this.valid(), this.errors.length); }
        return this.valid();
    }

    Validator.prototype.errorMessage = function (heading) {
        var txt = "<ul>";
        for (var i = 0; i < this.errors.length; i++) {
            txt += "<li>" + this.errors[i] + "</li>";
        }
        return heading + txt + "</ul>";
    }

    Validator.prototype.valid = function () {
        return !(this.errors.length);
    }

    // typeahead wrapper
    function TypeaheadWrapper($obj, callback) {
        var delay = 200, req, ctrl, timer, abortRequest = function (r) {
            if (r && r.abort) { r.abort(); }
        };

        //define and initialize the autocomplete address validation
        $obj.typeahead({
            minLength: 3,
            highlight: false,
            limit: 20
        }, {
                source: function (query, syncResults, asyncResults) {
                    if (timer) clearTimeout(timer);
                    abortRequest(req);

                    timer = setTimeout(function () {
                        abortRequest(req);
                        req = callback.call(this, query, syncResults, asyncResults);

                    }, delay);
                }
            });

        $obj.bind('typeahead:select', function (ev, suggestion) {
            // bug fix, selection is lost occasionally. force it to be there
            $obj.val(suggestion);
            $obj.typeahead('val', suggestion);
        });

    }





    /**
     * Returns the URL hash params as an object
     * @returns object
     */
    function getUrlParamsObject() {
        var params = {};
        var hashArray = window.location.hash.substr(1).split('&');

        for (var i = 0, len = hashArray.length; i < len; i++) {
            var paramsArray = hashArray[i].split('=');
            params[paramsArray[0]] = paramsArray[1];
        }

        return params;
    }

	/*
	*Latitude\Longitude to DMS converter
	*/

    function convertLatLngToDMS(lat, lng) {
        var deg, min
        deg = parseInt(lng);
        var result = {}
        min = (lng - deg) * 60;
        result.lng = deg + 'º ' + format('00', parseInt(min)) + "' " + format('00.0', (min - parseInt(min)) * 60) + "''";
        deg = parseInt(lat);
        min = (lat - deg) * 60;
        result.lat = deg + 'º ' + format('00', parseInt(min)) + "' " + format('00.0', (min - parseInt(min)) * 60) + "''";
        return result
    }


    function format(m, v) {
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


    /**
     * Return public API
     */
    return {
        setupPubSub: setupPubSub(),

        multiAjaxRequest: multiAjaxRequest,
        getUrlParamsObject: getUrlParamsObject,
        ajaxRequest: ajaxRequest,
        convertLatLngToDMS: convertLatLngToDMS,
        TypeaheadWrapper: TypeaheadWrapper,
        Validator: Validator
    };

})(jQuery);