/**
 Lot Plan Utilities
 **/

if (lotplan === undefined) var lotplan = {};

lotplan.utils = (function (jQuery) {


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





    function formatCurrency(value) {
        value = value || 0;
        return "$" + parseFloat(value).toFixed(2);
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





    // cart helper
    function CartHelper(observableArray, cookieName) {
        this.maxLength = 3800;
        this.cookieTimeout = 60;
        this.cookieName = cookieName || "";
        this.items = observableArray;
    }

    CartHelper.prototype.remove = function (match) {
        var result = false,
            remove = this.find(match),
            idx = remove ? this.items.indexOf(match) : -1;
        if (~idx) { result = !!this.items.splice(idx, 1).length; }
        this.updateCookie();
        return result;
    }

    CartHelper.prototype.find = function (match, convert) {
        match = convert ? this.converter.call(this, match) : match;
        var found = null;
        this.forEach(this.items(), function (itm, i) {
            if (itm === match || this.equality.call(this, itm, match, i)) {
                return !(found = itm);  // deliberate assignment
            }
        })
        return found;
    }

    CartHelper.prototype.add = function (items, convert, exceedFn) {
        items = convert ? this.convert(items) : items;
        if (exceedFn && this.willExceedLimit(items, false)) {
            exceedFn.call(this);
            return false;
        }
        this.items.push.apply(this.items, items);
        this.updateCookie();
        return true;
    }

    CartHelper.prototype.willExceedLimit = function (newItems, convert) {
        var currentLen = this.serialize().length,
            addLen = this.serialize(convert ? this.convert(newItems) : newItems).length;
        return (currentLen + addLen) > this.maxLength;
    }

    CartHelper.prototype.getTotal = function () {
        var total = 0;
        this.forEach(this.items(), function (itm, i) {
            total += parseFloat(this.getAmount.call(this, itm, i));
        });
        return total;
    }

    CartHelper.prototype.forEach = function (arr, fn) {
        for (var i = 0; i < arr.length; i++) {
            if (fn.call(this, arr[i], i) === false) { break; }
        }
    }

    CartHelper.prototype.serialize = function (data) {
        data = data || this.items() || [];
        return JSON.stringify(data)
    }

    //NOTE: Passing true to updateCookie will clear the cookies.
    CartHelper.prototype.updateCookie = function (clear) {
        setCookie(this.cookieName, clear ? "" : this.serialize(), this.cookieTimeout);
    }

    CartHelper.prototype.convert = function (arr) {
        var output = [];
        this.forEach(arr, function (itm, i) {
            output.push(this.converter.call(this, itm, i));
        });
        return output;
    }

    CartHelper.prototype.initalise = function (arr) {
        try {
            this.items.push.apply(this.items, JSON.parse(lotplan.utils.getCookie(this.cookieName)));
        } catch (ex) {
            this.updateCookie(true);
        }
    }

    // overrides

    // convert an object (in this case a data/product pair) into a limited length cookie object
    CartHelper.prototype.converter = function (itm, i) {
        return { i: itm.product.pid, a: itm.product.price, t: itm.data.title }; // l: itm.data.LOT, p: itm.data.PLAN, t: itm.data.LOT_TITLE(), d: itm.data.ADDRESS };
    }

    // how to determine equality
    CartHelper.prototype.equality = function (a, b, i) {
        return (a.i == b.i && a.t == b.t); // a.l == b.l && a.p == b.p
    }

    // how to retrieve the amount
    CartHelper.prototype.getAmount = function (itm, i) {
        return itm.a;
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

    /**
     * Sets data as a named cookie with an expiry in minuites
     */
    function setCookie(name, value, mins) {
        var d = new Date();
        d.setTime(d.getTime() + (mins * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + value + "; " + expires;
    }

    /**
     * Returns the URL hash params as an object
     * @returns cookie
     */
    function getCookie(name) {
        var n = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1);
            if (c.indexOf(n) == 0) return c.substring(n.length, c.length);
        }
        return "";
    }

    /**
     * Return public API
     */
    return {
        setupPubSub: setupPubSub(),

        multiAjaxRequest: multiAjaxRequest,
        getUrlParamsObject: getUrlParamsObject,
        ajaxRequest: ajaxRequest,

        formatCurrency: formatCurrency,
        setCookie: setCookie,
        getCookie: getCookie,

        TypeaheadWrapper: TypeaheadWrapper,
        Validator: Validator,
        Cart: CartHelper

    };



})(jQuery);


