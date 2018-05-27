var ss, ssVariables;

// Constructors

MultiVariable = function() {
    this.instances = [];
    document.addEventListener("DOMContentLoaded", function() {
        ss = atob(document.querySelector("input[name='SS']").value).split("|");
        ssVariables = JSON.parse("{" + ss.pop().replace(/[A-Z][A-Z0-9]*/g, '"$&"').replace(/,/g, ":").replace(/;/g, ",") + "}");
        for (var i = 0; i < this.instances.length; i++) {
            (function() {
                var instance = this.instances[i],
                    globalFilter = instance.filter instanceof RegExp ? new RegExp(instance.filter.source, instance.filter.flags.replace(/g|^/i, "g")) : null,
                    globalReplace = instance.replace instanceof RegExp ? new RegExp(instance.replace.source, instance.replace.flags.replace(/g|^/i, "g")) : null,
                    input = document.querySelector("input#" + instance.input),
                    pagetextNodes = getNodeContent(".dark1border + div > div");

                for (var n = 0; n < instance.length; n++) {
                    var code = ssVariables[instance.prefix + n];
                    code = instance.deserialize ? instance.deserialize(code) : String.fromCharCode(code);
                    if (code) {
                        if (typeof code === "string") {
                            if (code.length === 1) instance.value += code;
                            else throw "Deserialize function must return a string of length 1.";
                        } else throw "Deserialize function must return a string if truthy.";
                    }
                }

                if (input) {
                    input.maxLength = instance.length;

                    if (Array.isArray(instance.default)) input.placeholder = instance.default[Math.floor(Math.random() * instance.default.length)]
                    else if (typeof instance.default === "function") input.placeholder = instance.default(instance.length);

                    input.addEventListener("input", function() {
                        var obj = {},
                            val = this.value;
                        if (globalFilter) this.value = val = val.replace(globalFilter, "");
                        if (instance.transform) this.value = val = instance.transform(val);
                        for (var i = 0; i < instance.length; i++) {
                            obj[instance.prefix + i] = instance.serialize ? instance.serialize(val.substr(i, 1)) : val.charCodeAt(i) || 0;
                        }
                        updateVariables(obj);
                    });
                }

                if (instance.replace) replaceTextNode(pagetextNodes, globalReplace, instance.value);
            }).bind(this)()
        }
    }.bind(this));
}

MultiVariableInstance = function(object, factory) {
    this.factory = factory;

    this.default = null;
    if (Array.isArray(object.default) || typeof object.default === "function") this.default = object.default;
    else if (typeof object.default === "string") this.default = [object.default];

    this.filter = null;
    if (object.filter) {
        if (object.filter instanceof RegExp) this.filter = object.filter;
        else if (typeof object.filter === "string" && object.filter in this.factory.dictionary.FILTER) this.filter = this.factory.dictionary.FILTER[object.filter];
    }

    this.input = typeof object.input === "string" ? object.input : null;

    this.length = parseInt(object.length) || 8;

    this.prefix = typeof object.prefix === "string" && /^[A-Z]/i.test(object.prefix) ? object.prefix.toUpperCase() : "MULTIVARIABLE" + this.factory.instances.length;

    this.replace = null;
    if (object.replace) {
        if (object.replace instanceof RegExp) this.replace = object.replace;
        else if (typeof object.replace === "string") this.replace = new RegExp(object.replace.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"));
    }

    this.transform = null;
    if (object.transform) {
        if (typeof object.transform === "function") this.transform = object.transform;
        else if (typeof object.transform === "string" && object.transform in this.factory.dictionary.TRANSFORM) this.transform = this.factory.dictionary.TRANSFORM[object.transform];
    }

    this.value = "";


    this.deserialize = this.serialize = null;
    if (typeof object.deserialize === "function" && typeof object.serialize === "function") {
        this.deserialize = object.deserialize;
        this.serialize = object.serialize;
    } else if (typeof object.serialize === "string" && object.serialize in this.factory.dictionary.SERIALIZE) {
        this.serialize = this.factory.dictionary.SERIALIZE[object.serialize][0];
        this.deserialize = this.factory.dictionary.SERIALIZE[object.serialize][1];
    } else if (typeof object.deserialize === "string" && object.deserialize in this.factory.dictionary.SERIALIZE) {
        this.serialize = this.factory.dictionary.SERIALIZE[object.deserialize][0];
        this.deserialize = this.factory.dictionary.SERIALIZE[object.deserialize][1];
    }
}

MultiVariable.prototype.add = function(object) { // returns MultiVariable
    var construct = new MultiVariableInstance(object, this);
    this.instances.push(construct);
    return this;
}

MultiVariable.prototype.create = function(object) { // returns index
    var construct = new MultiVariableInstance(object, this);
    return this.instances.push(construct);
}

MultiVariable.prototype.entries = function() {
    return this.instances;
}

MultiVariable.prototype.get = function(i) {
    return this.instances[i];
}

MultiVariable.prototype.dictionary = {
    FILTER: {
        "INTEGER": /(?!^-|[\d])./,
        "NATURAL": /[^\d]/,
        "NAME": /^[-']|[^-'a-zA-Z]/,
        "NAME_INTERNATIONAL": /^[-']|[^-'a-zA-ZÀ-ÖØ-öø-ÿ]/
    },
    SERIALIZE: {
        "UNICODE": [
            function(string) {
                return string.charCodeAt();
            },
            function(integer) {
                return String.fromCharCode(integer);
            }
        ],
        "ALPHABET": [
            function(string) {
                return string ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(string.toUpperCase()) + 1 : 0;
            },
            function(integer) {
                return integer ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")[integer - 1] : "";
            }
        ],
        "DIGIT": [
            function(string) {
                return parseInt(string) || -1;
            },
            function(integer) {
                return integer === -1 ? "" : "" + integer;
            }
        ]
    },
    TRANSFORM: {
        "LOWERCASE": function(string) {
            return string.toLowerCase();
        },
        "NAME": function(string) {
            return string.toLowerCase().replace(/(^|-)(.)/g, function(match, $1, $2) {
                return $1 + $2.toUpperCase();
            });
        },
        "UPPERCASE": function(string) {
            return string.toUpperCase();
        }
    }
};

// Polyfills
/*
"function"!=typeof Object.assign&&Object.defineProperty(Object,"assign",{value:function(t,e){"use strict";if(null==t)throw new TypeError("Cannot convert undefined or null to object");for(var r=Object(t),n=1;n<arguments.length;n++){var o=arguments[n];if(null!=o)for(var c in o)Object.prototype.hasOwnProperty.call(o,c)&&(r[c]=o[c])}return r},writable:!0,configurable:!0}),Object.keys||(Object.keys=function(){"use strict";var t=Object.prototype.hasOwnProperty,e=!{toString:null}.propertyIsEnumerable("toString"),r=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],n=r.length;return function(o){if("function"!=typeof o&&("object"!=typeof o||null===o))throw new TypeError("Object.keys called on non-object");var c,i,l=[];for(c in o)t.call(o,c)&&l.push(c);if(e)for(i=0;i<n;i++)t.call(o,r[i])&&l.push(r[i]);return l}}()),Object.entries||(Object.entries=function(t){for(var e=Object.keys(t),r=e.length,n=new Array(r);r--;)n[r]=[e[r],t[e[r]]];return n}),void 0===RegExp.prototype.flags&&Object.defineProperty(RegExp.prototype,"flags",{configurable:!0,get:function(){return this.toString().match(/[gimuy]*$/)[0]}});
*/
// Functions

getNodeContent = function(selector) {
    return [].slice.call(document.querySelectorAll(selector + ", " + selector + " *")).reduce(function(a, e) {
        return a.concat([].slice.call(e.childNodes))
    }, []);
}

replaceTextNode = function(nodeList, match, replace) {
    var nodes = nodeList.filter(function(e) {
        return (e.nodeType == 3 && e.nodeValue.trim() && match.test(e.data))
    });
    for (var i = 0; i < nodes.length; i++) {
        var div = document.createElement("div"),
            node = nodes[i];
        div.innerHTML = node.data.replace(match, replace);
        while (div.firstChild) {
            node.parentNode.insertBefore(div.firstChild, node);
        }
        node.parentNode.removeChild(node);
    }
}

updateVariables = function(obj) {
    Object.assign(ssVariables, obj);
}

applySS = function() {
    document.querySelector("input[name='SS']").value = btoa(
        ss.concat(Object.entries(ssVariables).map(function(e) {
            return e.join(",");
        }).join(";"))
        .join("|"));
}

PostBack = function(action, value) {
    applySS();
    var frm = getEl("pbForm");
    frm.pbAction.value = action ? action : "";
    frm.pbValue.value = value ? value : "";
    frm.submit();
    return false;
}
