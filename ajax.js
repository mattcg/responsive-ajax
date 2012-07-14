/**
 * Responsive AJAX for people who know what they're doing.
 *
 * @module responsive-ajax
 * @author Matthew Caruana Galizia <m@m.cg>
 * @fileOverview
 */

'use strict';

/*jshint node:true */

var

Deferred = require('tiny-deferred');


/**
 * Use URL encoding to stringify an object.
 *
 * @param {Object} object
 * @returns {string}
 */
function stringifyQuery(object) {
	var i, l, k, qs = [], enc = encodeURIComponent;

	for (k in object) {
		if (object.hasOwnProperty(k)) {
			if (Array.isArray(object[k])) {
				for (i = 0, l = object[k].length; i < l; i++) {
					qs.push(enc(k) + '=' + enc(String(object[k][i])));
				}
			} else {
				qs.push(enc(k) + '=' + enc(String(object[k])));
			}
		}
	}

	return qs.join('&');
}


/**
 * Make an AJAX request.
 *
 * @param {Deferred} def Deferred object to resolve or reject according AJAX state
 * @returns {XMLHttpRequest}
 */
function makeRequest(def) {
	var req = new XMLHttpRequest();

	req.addEventListener('load', function() {
		var responseData = null, status = req.status;

		// IE < 10 mangles HTTP 204 to 1223
		if (status === 1223) {
			status = 204;
		}

		if (req.responseText) {
			try {
				responseData = JSON.parse(req.responseText);
			} catch (err) {
				return def.reject(status, null, 'parseerror');
			}
		}

		if (status >= 400) {
			return def.reject(status, responseData);
		}

		def.resolve(status, responseData);
	}, false);

	req.addEventListener('error', function() {
		def.reject(req.status, null);
	}, false);

	req.addEventListener('timeout', function() {
		def.reject(req.status, null, 'timeout');
	}, false);

	req.addEventListener('abort', function() {
		def.reject(req.status, null, 'abort');
	}, false);

	return req;
}


/**
 * Make and send an AJAX request, providing a raw entity.
 *
 * @param {string} method HTTP method
 * @param {string} path Request path
 * @param {Object} [headers] Optional HTTP headers
 * @param {string} [entity] Entity string
 * @param {string} [type] Entity MIME type
 * @returns {Deferred}
 */
function sendRequest(method, path, headers, entity, type) {
	var req, def, header;

	def = new Deferred();
	req = makeRequest(def);

	req.open(method, path, true);
	req.setRequestHeader('Accept', 'application/json');

	if (headers) {
		for (header in headers) {
			if (headers.hasOwnProperty(header)) {
				req.setRequestHeader(header, headers[header]);
			}
		}
	}

	if (type) {
		req.setRequestHeader('Content-Type', type);
	}

	if (entity) {
		req.send(entity);
	} else {
		req.send();
	}

	return def;
}


/**
 * Send a form as multipart data (available on newer browsers only)
 *
 * @param {HTMLFormElement} form The form to send
 * @returns {Deferred}
 */
function sendMultipartForm(form) {

	// Allow unsupported (by HTML) PUT to be shimmed, otherwise assume POST
	var method = (form.elements._method && form.elements._method.toUpperCase()) || 'POST';
	return sendRequest(method, form.action, null, new FormData(form), 'multipart/form-data');
}


/**
 * Send a JSON request entity.
 *
 * @param {string} method HTTP method (either POST or PUT)
 * @param {string} path Request path
 * @param {Object} [data] Data to serialize into entity
 * @param {Object} [headers] Optional HTTP headers
 * @returns {Deferred}
 */
function sendJSON(method, path, data, headers) {
	if (data !== null && typeof data === 'object') {
		return sendRequest(method, path, headers, JSON.stringify(data), 'application/json');
	}

	return sendRequest(method, path, headers);
}


/**
 * Send a request with optional data in the query string.
 *
 * @param {string} method HTTP method (either GET or DELETE)
 * @param {string} path Request path
 * @param {Object} [data] Data to serialize into query string
 * @param {Object} [headers] Optional HTTP headers
 * @returns {Deferred}
 */
function send(method, path, data, headers) {
	if (data !== null && typeof data === 'object') {
		path += '?' + stringifyQuery(data);
	}

	return sendRequest(method, path, headers);
}


/**
 * PUT a resource by serializing it to JSON in the request.
 *
 * @param {string} path Request path
 * @param {Object} [data] Data to serialize into entity
 * @param {Object} [headers] Optional HTTP headers
 * @returns {Deferred}
 */
exports.putJSON = function(path, data, headers) {
	return sendJSON('PUT', path, data, headers);
};


/**
 * POST an object by serializing it to JSON in the request.
 *
 * @param {string} path Request path
 * @param {Object} [data] Data to serialize into entity
 * @param {Object} [headers] Optional HTTP headers
 * @returns {Deferred}
 */
exports.postJSON = function(path, data, headers) {
	return sendJSON('POST', path, data, headers);
};


/**
 * DELETE a resource with optional data in the query string.
 *
 * @param {string} path Request path
 * @param {Object} [data] Data to serialize into query string
 * @param {Object} [headers] Optional HTTP headers
 * @returns {Deferred}
 */
exports.del = function(path, data, headers) {
	return send('DELETE', path, headers);
};


/**
 * GET a resource with optional data in the query string.
 *
 * @param {string} path Request path
 * @param {Object} [data] Data to serialize into query string
 * @param {Object} [headers] Optional HTTP headers
 * @returns {Deferred}
 */
exports.get = function(path, data, headers) {
	return send('GET', path, headers);	
};


/**
 * Send a form using AJAX. Forms explictly declared with the encoding 'multipart/form-data'
 * or forms containing files can only be sent on newer browsers.
 *
 * @param {HTMLFormElement} form The form to send
 * @returns {Deferred}
 */
exports.sendForm = function(form) {
	var i, ii, l, ll, element, method, qs = '', enc = encodeURIComponent;

	if (form.enctype === 'multipart/form-data') {
		return sendMultipartForm(form);
	}

	for (i = 0, l = form.length; i < l; i++) {
		element = form.elements[i];

		if (element.type === 'file') {
			return sendMultipartForm(form);
		}

		if (element.type === 'select-multiple') {
			for (ii = 0, ll = element.options.length; ii < ll; ii++) {
				if (element.options[ii].selected) {
					qs += enc(element.name) + '=' + enc(element.options[ii].value);
				}
			}
		} else {
			qs += enc(element.name) + '=' + enc(element.value);
		}
	}

	// Allow unimplemented HTML form methods (i.e. DELETE and PUT) to be shimmed with a hidden control named '_method'
	method = (form.elements._method || form.method).toUpperCase();
	switch (method) {
		case 'POST':
		case 'PUT':
			return sendRequest(method, form.action, null, qs, 'application/x-www-form-urlencoded');
		case 'DELETE':
		case 'GET':
			return sendRequest(method, form.action + '?' + qs);
	}
};


/**
 * Multipart data can be sent via AJAX on newer browsers (Safari 5+ and IE10+).
 * Use this method to check compatibility.
 *
 * @param {HTMLFormElement} form The form to check
 * @returns {boolean}
 */
exports.canSendForm = function(form) {
	var i, l;

	if (typeof FormData !== 'undefined') {
		return true;
	}

	if (form.enctype === 'multipart/form-data') {
		return false;
	}

	for (i = 0, l = form.length; i < l; i++) {
		if (form[i].type === 'file') {
			return false;
		}
	}
};