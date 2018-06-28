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
                    input = document.querySelector("input#" + instance.input),
                    serial = [];

                for (var n = 0; n < instance.length; n++) {
                    serial.push(ssVariables[instance.prefix + n]);
                }

                instance.value = instance._deserialize(serial);

                if (input) {
                    input.maxLength = instance.length;

                    if (Array.isArray(instance.default)) input.placeholder = instance.default[Math.floor(Math.random() * instance.default.length)]
                    else if (typeof instance.default === "function") input.placeholder = instance.default(instance.length);

                    input.addEventListener("input", function() {
                        var obj = {},
                            val = instance._serialize(this.value);

                        for (var i = 0; i < instance.length; i++) {
                            obj[instance.prefix + i] = val[i];
                        }
                        updateVariables(obj);
                    });
                }

                if (instance.replace)
                    for (var k = 0; k < instance.replace.length; k++) {
                        var replacer = instance.replace[k],
                            replaceRegex,
                            replaceTransform,
                            globalReplace,
                            val = instance.value;

                        if (Array.isArray(replacer)) {
                            replaceRegex = globalizeRegex(replacer[0]);
                            replaceTransform = replacer[1];
                            if (typeof replaceTransform === "number") val = val.substr(replaceTransform, 1);
                            else if (Array.isArray(replaceTransform) && typeof replaceTransform[0] === "number" && typeof replaceTransform[1] === "number") val = val.substr(replaceTransform[0], replaceTransform[1]);
                            else if (typeof replaceTransform === "function") val = replaceTransform(val);
                        } else replaceRegex = globalizeRegex(replacer);

                        replaceTextNode(getNodeContent(".dark1border + div > div"), replaceRegex, val);
                    }
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

    this.replace = [];
    if (object.replace) {
        if (!Array.isArray(object.replace)) object.replace = [object.replace];
        for (var i = 0; i < object.replace.length; i++) {
            var e = object.replace[i],
                replaceA,
                replaceB;

            if (Array.isArray(e) && e.length > 1) replaceA = e[0], replaceB = e[1];
            else replaceA = e;

            if (typeof replaceA === "string") replaceA = new RegExp(replaceA.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"));
            else if (!(replaceA instanceof RegExp)) replaceA = null;

            // More type checking here

            if (replaceA != null) {
                if (replaceB != null) this.replace.push([replaceA, replaceB]);
                else this.replace.push(replaceA);
            }
        }
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

MultiVariable.prototype.create = function(object) { // returns MultiVariableInstance
    var construct = new MultiVariableInstance(object, this);
    this.instances.push(construct);
    return this.instances[this.instances.length - 1];
}

MultiVariable.prototype.entries = function(begin, end) {
    if (begin != null) {
        if (end != null) return this.instances.slice(begin, end);
        return this.instances.slice(begin);
    }
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

MultiVariableInstance.prototype._serialize = function(string) {
    if (typeof string !== "string") throw "Input must be a string";

    var serial = [],
        globalFilter = globalizeRegex(this.filter);

    if (globalFilter) string = string.replace(globalFilter, "");
    if (this.transform) string = this.transform(string);
    for (var i = 0; i < this.length; i++) {
        var number = Number(this.serialize ? this.serialize(string.substr(i, 1)) : string.charCodeAt(i) || 0);
        if (Number.isNaN(number)) throw "Serialization result must be a number.";
        if (2147483647 < number || number < -2147483648) throw "Serialization result is outside the 32-bit limit."
        serial.push(number);
    }

    return serial;
}


MultiVariableInstance.prototype._deserialize = function(serial) {
    if (!Array.isArray(serial)) throw "Input must be an array";

    var string = "";

    for (var i = 0; i < serial.length; i++) {
        var code = serial[i];
        code = this.deserialize ? this.deserialize(code) : String.fromCharCode(code);
        if (code) {
            if (typeof code === "string") {
                if (code.length === 1) string += code;
                else throw "Deserialize function must return a string of length 1.";
            } else throw "Deserialize function must return a string if truthy.";
        }
    }
    return string;
}

MultiVariableInstance.prototype.conditionalize = function(string) {
    string = string || "";

    return this._serialize(string).map(function(a, i) {
        return "%" + this.prefix + i + " = " + a;
    }.bind(this)).join(" AND ");
}

// Polyfills

"function"!=typeof Object.assign&&Object.defineProperty(Object,"assign",{value:function(t,e){"use strict";if(null==t)throw new TypeError("Cannot convert undefined or null to object");for(var r=Object(t),n=1;n<arguments.length;n++){var o=arguments[n];if(null!=o)for(var c in o)Object.prototype.hasOwnProperty.call(o,c)&&(r[c]=o[c])}return r},writable:!0,configurable:!0}),Object.keys||(Object.keys=function(){"use strict";var t=Object.prototype.hasOwnProperty,e=!{toString:null}.propertyIsEnumerable("toString"),r=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],n=r.length;return function(o){if("function"!=typeof o&&("object"!=typeof o||null===o))throw new TypeError("Object.keys called on non-object");var c,i,l=[];for(c in o)t.call(o,c)&&l.push(c);if(e)for(i=0;i<n;i++)t.call(o,r[i])&&l.push(r[i]);return l}}()),Object.entries||(Object.entries=function(t){for(var e=Object.keys(t),r=e.length,n=new Array(r);r--;)n[r]=[e[r],t[e[r]]];return n}),void 0===RegExp.prototype.flags&&Object.defineProperty(RegExp.prototype,"flags",{configurable:!0,get:function(){return this.toString().match(/[gimuy]*$/)[0]}});

// Functions

globalizeRegex = function(regex) {
    return regex instanceof RegExp ? new RegExp(regex.source, regex.flags.replace(/g|^/i, "g")) : null
}

unglobalizeRegex = function(regex) {
    return regex instanceof RegExp ? new RegExp(regex.source, regex.flags.replace(/g/i, "")) : null
}

getNodeContent = function(selector) {
    return [].slice.call(document.querySelectorAll(selector + ", " + selector + " *")).reduce(function(a, e) {
        return a.concat([].slice.call(e.childNodes))
    }, []);
}

replaceTextNode = function(nodeList, match, replace) {
    var nodes = nodeList.filter(function(e) {
        return (e.nodeType == 3 && e.nodeValue.trim() && unglobalizeRegex(match).test(e.data))
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
