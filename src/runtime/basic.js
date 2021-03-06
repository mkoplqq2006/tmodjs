!function (global) {

    'use strict';

    var template = function (path, content) {
        return template[
            /string|function/.test(typeof content) ? 'compile' : 'render'
        ].apply(template, arguments);
    };


    var cache = template.cache = {};


    var toString = function (value, type) {

        if (typeof value !== 'string') {

            type = typeof value;
            if (type === 'number') {
                value += '';
            } else if (type === 'function') {
                value = toString(value.call(value));
            } else {
                value = '';
            }
        }

        return value;

    };


    var escapeMap = {
        "<": "&#60;",
        ">": "&#62;",
        '"': "&#34;",
        "'": "&#39;",
        "&": "&#38;"
    };


    var escapeHTML = function (content) {
        return toString(content)
        .replace(/&(?![\w#]+;)|[<>"']/g, function (s) {
            return escapeMap[s];
        });
    };


    var isArray = Array.isArray || function (obj) {
        return ({}).toString.call(obj) === '[object Array]';
    };


    var each = function (data, callback) {             
        if (isArray(data)) {
            for (var i = 0, len = data.length; i < len; i++) {
                callback.call(data, data[i], i, data);
            }
        } else {
            for (i in data) {
                callback.call(data, data[i], i);
            }
        }
    };


    var resolve = function(from, to) {
        var DOUBLE_DOT_RE = /(\/)[^/]+\1\.\.\1/;
        var dirname = from.replace(/^([^.])/, './$1').replace(/[^/]+$/, "");
        var id = dirname + to;
        id = id.replace(/\/\.\//g, "/");
        while (id.match(DOUBLE_DOT_RE)) {
            id = id.replace(DOUBLE_DOT_RE, "/");
        }
        return id;
    };

    
    var helpers = template.helpers = {

        $include: function (path, data, from) {
            var id = resolve(from, path);
            return template.render(id, data);
        },

        $string: toString,

        $escape: escapeHTML,

        $each: each
        
    };


    var debug = function (e) {

        var message = '';
        for (var name in e) {
            message += '<' + name + '>\n' + e[name] + '\n\n';
        }

        if (message && global.console) {
            console.error('Template Error\n\n' + message);
        }
        
        return function () {
            return '{Template Error}';
        };
    };


    template.render = function (path, data) {
        var fn = template.get(path) || debug({
            id: path,
            name: 'Render Error',
            message: 'No Template'
        });

        return data ? fn(data) : fn;
    };


    template.compile = function (path, fn) {
        var isFunction = typeof fn === 'function';
        var render = cache[path] = function (data) {
            try {
                return isFunction ? new fn(data, path) + '' : fn;
            } catch (e) {
                return debug(e)();
            }
        };

        render.prototype = fn.prototype = helpers;
        render.toString = function () {
            return fn + '';
        };

        return render;
    };


    template.get = function (id) {
        return cache[id.replace(/^\.\//, '')];
    };


    template.helper = function (name, helper) {
        helpers[name] = helper;
    };


    '<:helpers:>'
    '<:templates:>'


    // RequireJS && SeaJS
    if (typeof define === 'function') {
        define(function() {
            return template;
        });

    // NodeJS
    } else if (typeof exports !== 'undefined') {
        module.exports = template;
    } else {
        global.template = template;
    }

}(this);

