// minifyOnSave

var LV_SSInput, LV_SS;

// Constructors

LongVariable = function() {
    this.instances = [];
    document.addEventListener("DOMContentLoaded", function() {
        if (!LV_SSInput) {
            LV_SSInput = document.querySelector("input[name='SS']");
        }
        if (!LV_SS) {
            LV_SS = atob(LV_SSInput.value).split("|");
        }
        this.DOMContentLoaded.bind(this)();
    }.bind(this));
}

LongVariableInstance = function(object, factory) {
    this.factory = factory;

    if (object.name && typeof object.name === "string") {
        if (/^\w+$/.test(object.name)) {
            this.name = object.name;
        } else {
            throw new RangeError("LongVariable name must only contain word characters ([A-Za-z0-9_])");
        }
    } else {
        throw new TypeError("LongVariable requires a name of type 'string'");
    }

    if (object.input) {
        if (object.input instanceof Node) {
            this.input = object.input;
        } else if (typeof object.input === "string") {
            if (/^#[A-Za-z][\w.:-]*$/.test(object.input)) {
                this.input = document.getElementById(object.input.slice(1));
            } else {
                this.input = document.querySelector(object.input);
            }
        } else {
            if (!(this.warn === false)) console.warn("LongVariable input is neither a Node nor a string. Defaulting to 'null'");
            this.input = null;
        }
        if (this.input instanceof Node) {
          this.input.addEventListener("input", this.onInput.bind(this));
          this.input.addEventListener("change", this.onChange.bind(this));
        } else {
          if (!(this.warn === false)) console.warn("LongVariable input could not be resolved to a node. Defaulting to 'null'");
          this.input = null;
        }
    } else {
        this.input = null;
    }

    this.output = [];
    if (object.output) {
        if (!Array.isArray(object.output)) {
            object.output = [object.output];
        }
        for (i = 0; i < object.output.length; i++) {
          var tempNode;
            if (object.output[i] instanceof Node) {
                this.output.push(object.output[i]);
            } else if (typeof object.output[i] === "string") {
                if (/^#\w+$/.test(object.output[i])) {
                    tempNode = document.getElementById(object.output[i].slice(1));
                } else {
                    tempNode = document.querySelector(object.output[i]);
                }
                if (tempNode instanceof Node) {
                  this.output.push(tempNode);
                } else {
                  if (!(this.warn === false)) console.warn("LongVariable output '" + object.output[i] + "' could not be resolved to a node. Its value will be ignored.");
                }
            } else {
                if (!(this.warn === false)) console.warn("LongVariable output '" + object.output[i] + "' is neither a Node nor a string. Its value will be ignored.");
            }
        }
    }

    this.value = "";

    if (typeof object.decode === "function" && typeof object.encode === "function") {
        var random = Math.random().toString(36).substr(2, 5) + Math.random().toString(36).substr(2, 5);
        if (random === object.decode(object.encode(random))) {
            this.decode = object.decode;
            this.encode = object.encode;
        } else {
            throw new Error("LongVariable encode and decode functions must be losslessly reversible");
        }
    }

    this.regex = new RegExp(this.name + ":([^,;]*),0");
}

try { // adds a size accessor if possible
    Object.defineProperty(LongVariable.prototype, "size", {
        get: function() {
            return this.instances.length;
        }
    });
} catch (e) {}

LongVariable.prototype.add = function(object) { // returns LongVariable
    var construct = new LongVariableInstance(object, this);
    this.instances.push(construct);
    return this;
}

LongVariable.prototype.create = function(object) { // returns LongVariableInstance
    var construct = new LongVariableInstance(object, this);
    this.instances.push(construct);
    return this.instances[this.instances.length - 1];
}

LongVariable.prototype.entries = function(begin, end) {
    if (begin != null) {
        if (end != null) return this.instances.slice(begin, end);
        return this.instances.slice(begin);
    }
    return this.instances;
}

LongVariable.prototype.get = function(i) {
    return this.instances[i];
}

LongVariable.prototype.first = function() {
    return this.instances[0];
}

LongVariable.prototype.last = function() {
    return this.instances[this.instances.length - 1];
}

LongVariable.prototype.DOMContentLoaded = function() {
    LV_SS = atob(document.querySelector('input[name=\'SS\']').value).split('|');
    for (i = 0; i < this.instances.length; i++) {
        this.instances[i].DOMContentLoaded.bind(this.instances[i])();
    }
}

LongVariableInstance.prototype.DOMContentLoaded = function() {
    var valEncoded = LV_SS[4].match(this.regex)
    if (valEncoded) {
        this.value = this.decode(valEncoded[1]);
        if (this.input) {
            input.value = this.value;
        }
        if (this.output) {
            for (i = 0; i < this.output.length; i++) {
                if (this.plain === false) {
                    this.output[i].innerHTML = this.value;
                } else {
                    this.output[i].textContent = this.value;
                }
            }
        }
    } else {
        LV_SS[4] = LV_SS[4].split(";").concat(this.name + ":,0").join(";");
    }
}

LongVariableInstance.prototype.onInput = function(event) {
  this.value = event.target.value;
  if (!(LV_SSInput || LV_SS)) return;
  LV_SS[4] = LV_SS[4].replace(this.regex, this.name + ":" + this.encode(this.value) + ",0");
}

LongVariableInstance.prototype.onChange = LV_updateSS;

LongVariableInstance.prototype.encode = LV_btoaUTF16;

LongVariableInstance.prototype.decode = LV_atobUTF16;

// Local functions

function LV_updateSS() {
    if (!(LV_SSInput && LV_SS)) return;
    LV_SSInput.value = btoa(LV_SS.join('|'));
}

function LV_btoaUTF16(sString) {
    var aUTF16CodeUnits = new Uint16Array(sString.length);
    Array.prototype.forEach.call(aUTF16CodeUnits, function(el, idx, arr) {
        arr[idx] = sString.charCodeAt(idx);
    });
    return btoa(String.fromCharCode.apply(null, new Uint8Array(aUTF16CodeUnits.buffer)));
}

function LV_atobUTF16(sBase64) {
    var sBinaryString = atob(sBase64),
        aBinaryView = new Uint8Array(sBinaryString.length);
    Array.prototype.forEach.call(aBinaryView, function(el, idx, arr) {
        arr[idx] = sBinaryString.charCodeAt(idx);
    });
    return String.fromCharCode.apply(null, new Uint16Array(aBinaryView.buffer));
}
