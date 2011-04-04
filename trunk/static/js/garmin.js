/*  Prototype JavaScript framework, version 1.6.0.2
 *  (c) 2005-2008 Sam Stephenson
 *
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://www.prototypejs.org/
 *
 *--------------------------------------------------------------------------*/

var Prototype = {
  Version: '1.6.0.2',

  Browser: {
    IE:     !!(window.attachEvent && !window.opera),
    Opera:  !!window.opera,
    WebKit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
    Gecko:  navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1,
    MobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/)
  },

  BrowserFeatures: {
    XPath: !!document.evaluate,
    ElementExtensions: !!window.HTMLElement,
    SpecificElementExtensions:
      document.createElement('div').__proto__ &&
      document.createElement('div').__proto__ !==
        document.createElement('form').__proto__
  },

  ScriptFragment: '<script[^>]*>([\\S\\s]*?)<\/script>',
  JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,

  emptyFunction: function() { },
  K: function(x) { return x }
};

if (Prototype.Browser.MobileSafari)
  Prototype.BrowserFeatures.SpecificElementExtensions = false;


/* Based on Alex Arnell's inheritance implementation. */
var Class = {
  create: function() {
    var parent = null, properties = $A(arguments);
    if (Object.isFunction(properties[0]))
      parent = properties.shift();

    function klass() {
      this.initialize.apply(this, arguments);
    }

    Object.extend(klass, Class.Methods);
    klass.superclass = parent;
    klass.subclasses = [];

    if (parent) {
      var subclass = function() { };
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass;
      parent.subclasses.push(klass);
    }

    for (var i = 0; i < properties.length; i++)
      klass.addMethods(properties[i]);

    if (!klass.prototype.initialize)
      klass.prototype.initialize = Prototype.emptyFunction;

    klass.prototype.constructor = klass;

    return klass;
  }
};

Class.Methods = {
  addMethods: function(source) {
    var ancestor   = this.superclass && this.superclass.prototype;
    var properties = Object.keys(source);

    if (!Object.keys({ toString: true }).length)
      properties.push("toString", "valueOf");

    for (var i = 0, length = properties.length; i < length; i++) {
      var property = properties[i], value = source[property];
      if (ancestor && Object.isFunction(value) &&
          value.argumentNames().first() == "$super") {
        var method = value, value = Object.extend((function(m) {
          return function() { return ancestor[m].apply(this, arguments) };
        })(property).wrap(method), {
          valueOf:  function() { return method },
          toString: function() { return method.toString() }
        });
      }
      this.prototype[property] = value;
    }

    return this;
  }
};

var Abstract = { };

Object.extend = function(destination, source) {
  for (var property in source)
    destination[property] = source[property];
  return destination;
};

Object.extend(Object, {
  inspect: function(object) {
    try {
      if (Object.isUndefined(object)) return 'undefined';
      if (object === null) return 'null';
      return object.inspect ? object.inspect() : String(object);
    } catch (e) {
      if (e instanceof RangeError) return '...';
      throw e;
    }
  },

  toJSON: function(object) {
    var type = typeof object;
    switch (type) {
      case 'undefined':
      case 'function':
      case 'unknown': return;
      case 'boolean': return object.toString();
    }

    if (object === null) return 'null';
    if (object.toJSON) return object.toJSON();
    if (Object.isElement(object)) return;

    var results = [];
    for (var property in object) {
      var value = Object.toJSON(object[property]);
      if (!Object.isUndefined(value))
        results.push(property.toJSON() + ': ' + value);
    }

    return '{' + results.join(', ') + '}';
  },

  toQueryString: function(object) {
    return $H(object).toQueryString();
  },

  toHTML: function(object) {
    return object && object.toHTML ? object.toHTML() : String.interpret(object);
  },

  keys: function(object) {
    var keys = [];
    for (var property in object)
      keys.push(property);
    return keys;
  },

  values: function(object) {
    var values = [];
    for (var property in object)
      values.push(object[property]);
    return values;
  },

  clone: function(object) {
    return Object.extend({ }, object);
  },

  isElement: function(object) {
    return object && object.nodeType == 1;
  },

  isArray: function(object) {
    return object != null && typeof object == "object" &&
      'splice' in object && 'join' in object;
  },

  isHash: function(object) {
    return object instanceof Hash;
  },

  isFunction: function(object) {
    return typeof object == "function";
  },

  isString: function(object) {
    return typeof object == "string";
  },

  isNumber: function(object) {
    return typeof object == "number";
  },

  isUndefined: function(object) {
    return typeof object == "undefined";
  }
});

Object.extend(Function.prototype, {
  argumentNames: function() {
    var names = this.toString().match(/^[\s\(]*function[^(]*\((.*?)\)/)[1].split(",").invoke("strip");
    return names.length == 1 && !names[0] ? [] : names;
  },

  bind: function() {
    if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
    var __method = this, args = $A(arguments), object = args.shift();
    return function() {
      return __method.apply(object, args.concat($A(arguments)));
    }
  },

  bindAsEventListener: function() {
    var __method = this, args = $A(arguments), object = args.shift();
    return function(event) {
      return __method.apply(object, [event || window.event].concat(args));
    }
  },

  curry: function() {
    if (!arguments.length) return this;
    var __method = this, args = $A(arguments);
    return function() {
      return __method.apply(this, args.concat($A(arguments)));
    }
  },

  delay: function() {
    var __method = this, args = $A(arguments), timeout = args.shift() * 1000;
    return window.setTimeout(function() {
      return __method.apply(__method, args);
    }, timeout);
  },

  wrap: function(wrapper) {
    var __method = this;
    return function() {
      return wrapper.apply(this, [__method.bind(this)].concat($A(arguments)));
    }
  },

  methodize: function() {
    if (this._methodized) return this._methodized;
    var __method = this;
    return this._methodized = function() {
      return __method.apply(null, [this].concat($A(arguments)));
    };
  }
});

Function.prototype.defer = Function.prototype.delay.curry(0.01);

Date.prototype.toJSON = function() {
  return '"' + this.getUTCFullYear() + '-' +
    (this.getUTCMonth() + 1).toPaddedString(2) + '-' +
    this.getUTCDate().toPaddedString(2) + 'T' +
    this.getUTCHours().toPaddedString(2) + ':' +
    this.getUTCMinutes().toPaddedString(2) + ':' +
    this.getUTCSeconds().toPaddedString(2) + 'Z"';
};

var Try = {
  these: function() {
    var returnValue;

    for (var i = 0, length = arguments.length; i < length; i++) {
      var lambda = arguments[i];
      try {
        returnValue = lambda();
        break;
      } catch (e) { }
    }

    return returnValue;
  }
};

RegExp.prototype.match = RegExp.prototype.test;

RegExp.escape = function(str) {
  return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
};

/*--------------------------------------------------------------------------*/

var PeriodicalExecuter = Class.create({
  initialize: function(callback, frequency) {
    this.callback = callback;
    this.frequency = frequency;
    this.currentlyExecuting = false;

    this.registerCallback();
  },

  registerCallback: function() {
    this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
  },

  execute: function() {
    this.callback(this);
  },

  stop: function() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  },

  onTimerEvent: function() {
    if (!this.currentlyExecuting) {
      try {
        this.currentlyExecuting = true;
        this.execute();
      } finally {
        this.currentlyExecuting = false;
      }
    }
  }
});
Object.extend(String, {
  interpret: function(value) {
    return value == null ? '' : String(value);
  },
  specialChar: {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '\\': '\\\\'
  }
});

Object.extend(String.prototype, {
  gsub: function(pattern, replacement) {
    var result = '', source = this, match;
    replacement = arguments.callee.prepareReplacement(replacement);

    while (source.length > 0) {
      if (match = source.match(pattern)) {
        result += source.slice(0, match.index);
        result += String.interpret(replacement(match));
        source  = source.slice(match.index + match[0].length);
      } else {
        result += source, source = '';
      }
    }
    return result;
  },

  sub: function(pattern, replacement, count) {
    replacement = this.gsub.prepareReplacement(replacement);
    count = Object.isUndefined(count) ? 1 : count;

    return this.gsub(pattern, function(match) {
      if (--count < 0) return match[0];
      return replacement(match);
    });
  },

  scan: function(pattern, iterator) {
    this.gsub(pattern, iterator);
    return String(this);
  },

  truncate: function(length, truncation) {
    length = length || 30;
    truncation = Object.isUndefined(truncation) ? '...' : truncation;
    return this.length > length ?
      this.slice(0, length - truncation.length) + truncation : String(this);
  },

  strip: function() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  },

  stripTags: function() {
    return this.replace(/<\/?[^>]+>/gi, '');
  },

  stripScripts: function() {
    return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
  },

  extractScripts: function() {
    var matchAll = new RegExp(Prototype.ScriptFragment, 'img');
    var matchOne = new RegExp(Prototype.ScriptFragment, 'im');
    return (this.match(matchAll) || []).map(function(scriptTag) {
      return (scriptTag.match(matchOne) || ['', ''])[1];
    });
  },

  evalScripts: function() {
    return this.extractScripts().map(function(script) { return eval(script) });
  },

  escapeHTML: function() {
    var self = arguments.callee;
    self.text.data = this;
    return self.div.innerHTML;
  },

  unescapeHTML: function() {
    var div = new Element('div');
    div.innerHTML = this.stripTags();
    return div.childNodes[0] ? (div.childNodes.length > 1 ?
      $A(div.childNodes).inject('', function(memo, node) { return memo+node.nodeValue }) :
      div.childNodes[0].nodeValue) : '';
  },

  toQueryParams: function(separator) {
    var match = this.strip().match(/([^?#]*)(#.*)?$/);
    if (!match) return { };

    return match[1].split(separator || '&').inject({ }, function(hash, pair) {
      if ((pair = pair.split('='))[0]) {
        var key = decodeURIComponent(pair.shift());
        var value = pair.length > 1 ? pair.join('=') : pair[0];
        if (value != undefined) value = decodeURIComponent(value);

        if (key in hash) {
          if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        }
        else hash[key] = value;
      }
      return hash;
    });
  },

  toArray: function() {
    return this.split('');
  },

  succ: function() {
    return this.slice(0, this.length - 1) +
      String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
  },

  times: function(count) {
    return count < 1 ? '' : new Array(count + 1).join(this);
  },

  camelize: function() {
    var parts = this.split('-'), len = parts.length;
    if (len == 1) return parts[0];

    var camelized = this.charAt(0) == '-'
      ? parts[0].charAt(0).toUpperCase() + parts[0].substring(1)
      : parts[0];

    for (var i = 1; i < len; i++)
      camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);

    return camelized;
  },

  capitalize: function() {
    return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
  },

  underscore: function() {
    return this.gsub(/::/, '/').gsub(/([A-Z]+)([A-Z][a-z])/,'#{1}_#{2}').gsub(/([a-z\d])([A-Z])/,'#{1}_#{2}').gsub(/-/,'_').toLowerCase();
  },

  dasherize: function() {
    return this.gsub(/_/,'-');
  },

  inspect: function(useDoubleQuotes) {
    var escapedString = this.gsub(/[\x00-\x1f\\]/, function(match) {
      var character = String.specialChar[match[0]];
      return character ? character : '\\u00' + match[0].charCodeAt().toPaddedString(2, 16);
    });
    if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
    return "'" + escapedString.replace(/'/g, '\\\'') + "'";
  },

  toJSON: function() {
    return this.inspect(true);
  },

  unfilterJSON: function(filter) {
    return this.sub(filter || Prototype.JSONFilter, '#{1}');
  },

  isJSON: function() {
    var str = this;
    if (str.blank()) return false;
    str = this.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '');
    return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(str);
  },

  evalJSON: function(sanitize) {
    var json = this.unfilterJSON();
    try {
      if (!sanitize || json.isJSON()) return eval('(' + json + ')');
    } catch (e) { }
    throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
  },

  include: function(pattern) {
    return this.indexOf(pattern) > -1;
  },

  startsWith: function(pattern) {
    return this.indexOf(pattern) === 0;
  },

  endsWith: function(pattern) {
    var d = this.length - pattern.length;
    return d >= 0 && this.lastIndexOf(pattern) === d;
  },

  empty: function() {
    return this == '';
  },

  blank: function() {
    return /^\s*$/.test(this);
  },

  interpolate: function(object, pattern) {
    return new Template(this, pattern).evaluate(object);
  }
});

if (Prototype.Browser.WebKit || Prototype.Browser.IE) Object.extend(String.prototype, {
  escapeHTML: function() {
    return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },
  unescapeHTML: function() {
    return this.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  }
});

String.prototype.gsub.prepareReplacement = function(replacement) {
  if (Object.isFunction(replacement)) return replacement;
  var template = new Template(replacement);
  return function(match) { return template.evaluate(match) };
};

String.prototype.parseQuery = String.prototype.toQueryParams;

Object.extend(String.prototype.escapeHTML, {
  div:  document.createElement('div'),
  text: document.createTextNode('')
});

with (String.prototype.escapeHTML) div.appendChild(text);

var Template = Class.create({
  initialize: function(template, pattern) {
    this.template = template.toString();
    this.pattern = pattern || Template.Pattern;
  },

  evaluate: function(object) {
    if (Object.isFunction(object.toTemplateReplacements))
      object = object.toTemplateReplacements();

    return this.template.gsub(this.pattern, function(match) {
      if (object == null) return '';

      var before = match[1] || '';
      if (before == '\\') return match[2];

      var ctx = object, expr = match[3];
      var pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;
      match = pattern.exec(expr);
      if (match == null) return before;

      while (match != null) {
        var comp = match[1].startsWith('[') ? match[2].gsub('\\\\]', ']') : match[1];
        ctx = ctx[comp];
        if (null == ctx || '' == match[3]) break;
        expr = expr.substring('[' == match[3] ? match[1].length : match[0].length);
        match = pattern.exec(expr);
      }

      return before + String.interpret(ctx);
    });
  }
});
Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;

var $break = { };

var Enumerable = {
  each: function(iterator, context) {
    var index = 0;
    iterator = iterator.bind(context);
    try {
      this._each(function(value) {
        iterator(value, index++);
      });
    } catch (e) {
      if (e != $break) throw e;
    }
    return this;
  },

  eachSlice: function(number, iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var index = -number, slices = [], array = this.toArray();
    while ((index += number) < array.length)
      slices.push(array.slice(index, index+number));
    return slices.collect(iterator, context);
  },

  all: function(iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var result = true;
    this.each(function(value, index) {
      result = result && !!iterator(value, index);
      if (!result) throw $break;
    });
    return result;
  },

  any: function(iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var result = false;
    this.each(function(value, index) {
      if (result = !!iterator(value, index))
        throw $break;
    });
    return result;
  },

  collect: function(iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var results = [];
    this.each(function(value, index) {
      results.push(iterator(value, index));
    });
    return results;
  },

  detect: function(iterator, context) {
    iterator = iterator.bind(context);
    var result;
    this.each(function(value, index) {
      if (iterator(value, index)) {
        result = value;
        throw $break;
      }
    });
    return result;
  },

  findAll: function(iterator, context) {
    iterator = iterator.bind(context);
    var results = [];
    this.each(function(value, index) {
      if (iterator(value, index))
        results.push(value);
    });
    return results;
  },

  grep: function(filter, iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var results = [];

    if (Object.isString(filter))
      filter = new RegExp(filter);

    this.each(function(value, index) {
      if (filter.match(value))
        results.push(iterator(value, index));
    });
    return results;
  },

  include: function(object) {
    if (Object.isFunction(this.indexOf))
      if (this.indexOf(object) != -1) return true;

    var found = false;
    this.each(function(value) {
      if (value == object) {
        found = true;
        throw $break;
      }
    });
    return found;
  },

  inGroupsOf: function(number, fillWith) {
    fillWith = Object.isUndefined(fillWith) ? null : fillWith;
    return this.eachSlice(number, function(slice) {
      while(slice.length < number) slice.push(fillWith);
      return slice;
    });
  },

  inject: function(memo, iterator, context) {
    iterator = iterator.bind(context);
    this.each(function(value, index) {
      memo = iterator(memo, value, index);
    });
    return memo;
  },

  invoke: function(method) {
    var args = $A(arguments).slice(1);
    return this.map(function(value) {
      return value[method].apply(value, args);
    });
  },

  max: function(iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator(value, index);
      if (result == null || value >= result)
        result = value;
    });
    return result;
  },

  min: function(iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator(value, index);
      if (result == null || value < result)
        result = value;
    });
    return result;
  },

  partition: function(iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var trues = [], falses = [];
    this.each(function(value, index) {
      (iterator(value, index) ?
        trues : falses).push(value);
    });
    return [trues, falses];
  },

  pluck: function(property) {
    var results = [];
    this.each(function(value) {
      results.push(value[property]);
    });
    return results;
  },

  reject: function(iterator, context) {
    iterator = iterator.bind(context);
    var results = [];
    this.each(function(value, index) {
      if (!iterator(value, index))
        results.push(value);
    });
    return results;
  },

  sortBy: function(iterator, context) {
    iterator = iterator.bind(context);
    return this.map(function(value, index) {
      return {value: value, criteria: iterator(value, index)};
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }).pluck('value');
  },

  toArray: function() {
    return this.map();
  },

  zip: function() {
    var iterator = Prototype.K, args = $A(arguments);
    if (Object.isFunction(args.last()))
      iterator = args.pop();

    var collections = [this].concat(args).map($A);
    return this.map(function(value, index) {
      return iterator(collections.pluck(index));
    });
  },

  size: function() {
    return this.toArray().length;
  },

  inspect: function() {
    return '#<Enumerable:' + this.toArray().inspect() + '>';
  }
};

Object.extend(Enumerable, {
  map:     Enumerable.collect,
  find:    Enumerable.detect,
  select:  Enumerable.findAll,
  filter:  Enumerable.findAll,
  member:  Enumerable.include,
  entries: Enumerable.toArray,
  every:   Enumerable.all,
  some:    Enumerable.any
});
function $A(iterable) {
  if (!iterable) return [];
  if (iterable.toArray) return iterable.toArray();
  var length = iterable.length || 0, results = new Array(length);
  while (length--) results[length] = iterable[length];
  return results;
}

if (Prototype.Browser.WebKit) {
  $A = function(iterable) {
    if (!iterable) return [];
    if (!(Object.isFunction(iterable) && iterable == '[object NodeList]') &&
        iterable.toArray) return iterable.toArray();
    var length = iterable.length || 0, results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
  };
}

Array.from = $A;

Object.extend(Array.prototype, Enumerable);

if (!Array.prototype._reverse) Array.prototype._reverse = Array.prototype.reverse;

Object.extend(Array.prototype, {
  _each: function(iterator) {
    for (var i = 0, length = this.length; i < length; i++)
      iterator(this[i]);
  },

  clear: function() {
    this.length = 0;
    return this;
  },

  first: function() {
    return this[0];
  },

  last: function() {
    return this[this.length - 1];
  },

  compact: function() {
    return this.select(function(value) {
      return value != null;
    });
  },

  flatten: function() {
    return this.inject([], function(array, value) {
      return array.concat(Object.isArray(value) ?
        value.flatten() : [value]);
    });
  },

  without: function() {
    var values = $A(arguments);
    return this.select(function(value) {
      return !values.include(value);
    });
  },

  reverse: function(inline) {
    return (inline !== false ? this : this.toArray())._reverse();
  },

  reduce: function() {
    return this.length > 1 ? this : this[0];
  },

  uniq: function(sorted) {
    return this.inject([], function(array, value, index) {
      if (0 == index || (sorted ? array.last() != value : !array.include(value)))
        array.push(value);
      return array;
    });
  },

  intersect: function(array) {
    return this.uniq().findAll(function(item) {
      return array.detect(function(value) { return item === value });
    });
  },

  clone: function() {
    return [].concat(this);
  },

  size: function() {
    return this.length;
  },

  inspect: function() {
    return '[' + this.map(Object.inspect).join(', ') + ']';
  },

  toJSON: function() {
    var results = [];
    this.each(function(object) {
      var value = Object.toJSON(object);
      if (!Object.isUndefined(value)) results.push(value);
    });
    return '[' + results.join(', ') + ']';
  }
});

// use native browser JS 1.6 implementation if available
if (Object.isFunction(Array.prototype.forEach))
  Array.prototype._each = Array.prototype.forEach;

if (!Array.prototype.indexOf) Array.prototype.indexOf = function(item, i) {
  i || (i = 0);
  var length = this.length;
  if (i < 0) i = length + i;
  for (; i < length; i++)
    if (this[i] === item) return i;
  return -1;
};

if (!Array.prototype.lastIndexOf) Array.prototype.lastIndexOf = function(item, i) {
  i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
  var n = this.slice(0, i).reverse().indexOf(item);
  return (n < 0) ? n : i - n - 1;
};

Array.prototype.toArray = Array.prototype.clone;

function $w(string) {
  if (!Object.isString(string)) return [];
  string = string.strip();
  return string ? string.split(/\s+/) : [];
}

if (Prototype.Browser.Opera){
  Array.prototype.concat = function() {
    var array = [];
    for (var i = 0, length = this.length; i < length; i++) array.push(this[i]);
    for (var i = 0, length = arguments.length; i < length; i++) {
      if (Object.isArray(arguments[i])) {
        for (var j = 0, arrayLength = arguments[i].length; j < arrayLength; j++)
          array.push(arguments[i][j]);
      } else {
        array.push(arguments[i]);
      }
    }
    return array;
  };
}
Object.extend(Number.prototype, {
  toColorPart: function() {
    return this.toPaddedString(2, 16);
  },

  succ: function() {
    return this + 1;
  },

  times: function(iterator) {
    $R(0, this, true).each(iterator);
    return this;
  },

  toPaddedString: function(length, radix) {
    var string = this.toString(radix || 10);
    return '0'.times(length - string.length) + string;
  },

  toJSON: function() {
    return isFinite(this) ? this.toString() : 'null';
  }
});

$w('abs round ceil floor').each(function(method){
  Number.prototype[method] = Math[method].methodize();
});
function $H(object) {
  return new Hash(object);
};

var Hash = Class.create(Enumerable, (function() {

  function toQueryPair(key, value) {
    if (Object.isUndefined(value)) return key;
    return key + '=' + encodeURIComponent(String.interpret(value));
  }

  return {
    initialize: function(object) {
      this._object = Object.isHash(object) ? object.toObject() : Object.clone(object);
    },

    _each: function(iterator) {
      for (var key in this._object) {
        var value = this._object[key], pair = [key, value];
        pair.key = key;
        pair.value = value;
        iterator(pair);
      }
    },

    set: function(key, value) {
      return this._object[key] = value;
    },

    get: function(key) {
      return this._object[key];
    },

    unset: function(key) {
      var value = this._object[key];
      delete this._object[key];
      return value;
    },

    toObject: function() {
      return Object.clone(this._object);
    },

    keys: function() {
      return this.pluck('key');
    },

    values: function() {
      return this.pluck('value');
    },

    index: function(value) {
      var match = this.detect(function(pair) {
        return pair.value === value;
      });
      return match && match.key;
    },

    merge: function(object) {
      return this.clone().update(object);
    },

    update: function(object) {
      return new Hash(object).inject(this, function(result, pair) {
        result.set(pair.key, pair.value);
        return result;
      });
    },

    toQueryString: function() {
      return this.map(function(pair) {
        var key = encodeURIComponent(pair.key), values = pair.value;

        if (values && typeof values == 'object') {
          if (Object.isArray(values))
            return values.map(toQueryPair.curry(key)).join('&');
        }
        return toQueryPair(key, values);
      }).join('&');
    },

    inspect: function() {
      return '#<Hash:{' + this.map(function(pair) {
        return pair.map(Object.inspect).join(': ');
      }).join(', ') + '}>';
    },

    toJSON: function() {
      return Object.toJSON(this.toObject());
    },

    clone: function() {
      return new Hash(this);
    }
  }
})());

Hash.prototype.toTemplateReplacements = Hash.prototype.toObject;
Hash.from = $H;
var ObjectRange = Class.create(Enumerable, {
  initialize: function(start, end, exclusive) {
    this.start = start;
    this.end = end;
    this.exclusive = exclusive;
  },

  _each: function(iterator) {
    var value = this.start;
    while (this.include(value)) {
      iterator(value);
      value = value.succ();
    }
  },

  include: function(value) {
    if (value < this.start)
      return false;
    if (this.exclusive)
      return value < this.end;
    return value <= this.end;
  }
});

var $R = function(start, end, exclusive) {
  return new ObjectRange(start, end, exclusive);
};

var Ajax = {
  getTransport: function() {
    return Try.these(
      function() {return new XMLHttpRequest()},
      function() {return new ActiveXObject('Msxml2.XMLHTTP')},
      function() {return new ActiveXObject('Microsoft.XMLHTTP')}
    ) || false;
  },

  activeRequestCount: 0
};

Ajax.Responders = {
  responders: [],

  _each: function(iterator) {
    this.responders._each(iterator);
  },

  register: function(responder) {
    if (!this.include(responder))
      this.responders.push(responder);
  },

  unregister: function(responder) {
    this.responders = this.responders.without(responder);
  },

  dispatch: function(callback, request, transport, json) {
    this.each(function(responder) {
      if (Object.isFunction(responder[callback])) {
        try {
          responder[callback].apply(responder, [request, transport, json]);
        } catch (e) { }
      }
    });
  }
};

Object.extend(Ajax.Responders, Enumerable);

Ajax.Responders.register({
  onCreate:   function() { Ajax.activeRequestCount++ },
  onComplete: function() { Ajax.activeRequestCount-- }
});

Ajax.Base = Class.create({
  initialize: function(options) {
    this.options = {
      method:       'post',
      asynchronous: true,
      contentType:  'application/x-www-form-urlencoded',
      encoding:     'UTF-8',
      parameters:   '',
      evalJSON:     true,
      evalJS:       true
    };
    Object.extend(this.options, options || { });

    this.options.method = this.options.method.toLowerCase();

    if (Object.isString(this.options.parameters))
      this.options.parameters = this.options.parameters.toQueryParams();
    else if (Object.isHash(this.options.parameters))
      this.options.parameters = this.options.parameters.toObject();
  }
});

Ajax.Request = Class.create(Ajax.Base, {
  _complete: false,

  initialize: function($super, url, options) {
    $super(options);
    this.transport = Ajax.getTransport();
    this.request(url);
  },

  request: function(url) {
    this.url = url;
    this.method = this.options.method;
    var params = Object.clone(this.options.parameters);

    if (!['get', 'post'].include(this.method)) {
      // simulate other verbs over post
      params['_method'] = this.method;
      this.method = 'post';
    }

    this.parameters = params;

    if (params = Object.toQueryString(params)) {
      // when GET, append parameters to URL
      if (this.method == 'get')
        this.url += (this.url.include('?') ? '&' : '?') + params;
      else if (/Konqueror|Safari|KHTML/.test(navigator.userAgent))
        params += '&_=';
    }

    try {
      var response = new Ajax.Response(this);
      if (this.options.onCreate) this.options.onCreate(response);
      Ajax.Responders.dispatch('onCreate', this, response);

      this.transport.open(this.method.toUpperCase(), this.url,
        this.options.asynchronous);

      if (this.options.asynchronous) this.respondToReadyState.bind(this).defer(1);

      this.transport.onreadystatechange = this.onStateChange.bind(this);
      this.setRequestHeaders();

      this.body = this.method == 'post' ? (this.options.postBody || params) : null;
      this.transport.send(this.body);

      /* Force Firefox to handle ready state 4 for synchronous requests */
      if (!this.options.asynchronous && this.transport.overrideMimeType)
        this.onStateChange();

    }
    catch (e) {
      this.dispatchException(e);
    }
  },

  onStateChange: function() {
    var readyState = this.transport.readyState;
    if (readyState > 1 && !((readyState == 4) && this._complete))
      this.respondToReadyState(this.transport.readyState);
  },

  setRequestHeaders: function() {
    var headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Prototype-Version': Prototype.Version,
      'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
    };

    if (this.method == 'post') {
      headers['Content-type'] = this.options.contentType +
        (this.options.encoding ? '; charset=' + this.options.encoding : '');

      /* Force "Connection: close" for older Mozilla browsers to work
       * around a bug where XMLHttpRequest sends an incorrect
       * Content-length header. See Mozilla Bugzilla #246651.
       */
      if (this.transport.overrideMimeType &&
          (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005)
            headers['Connection'] = 'close';
    }

    // user-defined headers
    if (typeof this.options.requestHeaders == 'object') {
      var extras = this.options.requestHeaders;

      if (Object.isFunction(extras.push))
        for (var i = 0, length = extras.length; i < length; i += 2)
          headers[extras[i]] = extras[i+1];
      else
        $H(extras).each(function(pair) { headers[pair.key] = pair.value });
    }

    for (var name in headers)
      this.transport.setRequestHeader(name, headers[name]);
  },

  success: function() {
    var status = this.getStatus();
    return !status || (status >= 200 && status < 300);
  },

  getStatus: function() {
    try {
      return this.transport.status || 0;
    } catch (e) { return 0 }
  },

  respondToReadyState: function(readyState) {
    var state = Ajax.Request.Events[readyState], response = new Ajax.Response(this);

    if (state == 'Complete') {
      try {
        this._complete = true;
        (this.options['on' + response.status]
         || this.options['on' + (this.success() ? 'Success' : 'Failure')]
         || Prototype.emptyFunction)(response, response.headerJSON);
      } catch (e) {
        this.dispatchException(e);
      }

      var contentType = response.getHeader('Content-type');
      if (this.options.evalJS == 'force'
          || (this.options.evalJS && this.isSameOrigin() && contentType
          && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i)))
        this.evalResponse();
    }

    try {
      (this.options['on' + state] || Prototype.emptyFunction)(response, response.headerJSON);
      Ajax.Responders.dispatch('on' + state, this, response, response.headerJSON);
    } catch (e) {
      this.dispatchException(e);
    }

    if (state == 'Complete') {
      // avoid memory leak in MSIE: clean up
      this.transport.onreadystatechange = Prototype.emptyFunction;
    }
  },

  isSameOrigin: function() {
    var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
    return !m || (m[0] == '#{protocol}//#{domain}#{port}'.interpolate({
      protocol: location.protocol,
      domain: document.domain,
      port: location.port ? ':' + location.port : ''
    }));
  },

  getHeader: function(name) {
    try {
      return this.transport.getResponseHeader(name) || null;
    } catch (e) { return null }
  },

  evalResponse: function() {
    try {
      return eval((this.transport.responseText || '').unfilterJSON());
    } catch (e) {
      this.dispatchException(e);
    }
  },

  dispatchException: function(exception) {
    (this.options.onException || Prototype.emptyFunction)(this, exception);
    Ajax.Responders.dispatch('onException', this, exception);
  }
});

Ajax.Request.Events =
  ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];

Ajax.Response = Class.create({
  initialize: function(request){
    this.request = request;
    var transport  = this.transport  = request.transport,
        readyState = this.readyState = transport.readyState;

    if((readyState > 2 && !Prototype.Browser.IE) || readyState == 4) {
      this.status       = this.getStatus();
      this.statusText   = this.getStatusText();
      this.responseText = String.interpret(transport.responseText);
      this.headerJSON   = this._getHeaderJSON();
    }

    if(readyState == 4) {
      var xml = transport.responseXML;
      this.responseXML  = Object.isUndefined(xml) ? null : xml;
      this.responseJSON = this._getResponseJSON();
    }
  },

  status:      0,
  statusText: '',

  getStatus: Ajax.Request.prototype.getStatus,

  getStatusText: function() {
    try {
      return this.transport.statusText || '';
    } catch (e) { return '' }
  },

  getHeader: Ajax.Request.prototype.getHeader,

  getAllHeaders: function() {
    try {
      return this.getAllResponseHeaders();
    } catch (e) { return null }
  },

  getResponseHeader: function(name) {
    return this.transport.getResponseHeader(name);
  },

  getAllResponseHeaders: function() {
    return this.transport.getAllResponseHeaders();
  },

  _getHeaderJSON: function() {
    var json = this.getHeader('X-JSON');
    if (!json) return null;
    json = decodeURIComponent(escape(json));
    try {
      return json.evalJSON(this.request.options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  },

  _getResponseJSON: function() {
    var options = this.request.options;
    if (!options.evalJSON || (options.evalJSON != 'force' &&
      !(this.getHeader('Content-type') || '').include('application/json')) ||
        this.responseText.blank())
          return null;
    try {
      return this.responseText.evalJSON(options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  }
});

Ajax.Updater = Class.create(Ajax.Request, {
  initialize: function($super, container, url, options) {
    this.container = {
      success: (container.success || container),
      failure: (container.failure || (container.success ? null : container))
    };

    options = Object.clone(options);
    var onComplete = options.onComplete;
    options.onComplete = (function(response, json) {
      this.updateContent(response.responseText);
      if (Object.isFunction(onComplete)) onComplete(response, json);
    }).bind(this);

    $super(url, options);
  },

  updateContent: function(responseText) {
    var receiver = this.container[this.success() ? 'success' : 'failure'],
        options = this.options;

    if (!options.evalScripts) responseText = responseText.stripScripts();

    if (receiver = $(receiver)) {
      if (options.insertion) {
        if (Object.isString(options.insertion)) {
          var insertion = { }; insertion[options.insertion] = responseText;
          receiver.insert(insertion);
        }
        else options.insertion(receiver, responseText);
      }
      else receiver.update(responseText);
    }
  }
});

Ajax.PeriodicalUpdater = Class.create(Ajax.Base, {
  initialize: function($super, container, url, options) {
    $super(options);
    this.onComplete = this.options.onComplete;

    this.frequency = (this.options.frequency || 2);
    this.decay = (this.options.decay || 1);

    this.updater = { };
    this.container = container;
    this.url = url;

    this.start();
  },

  start: function() {
    this.options.onComplete = this.updateComplete.bind(this);
    this.onTimerEvent();
  },

  stop: function() {
    this.updater.options.onComplete = undefined;
    clearTimeout(this.timer);
    (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
  },

  updateComplete: function(response) {
    if (this.options.decay) {
      this.decay = (response.responseText == this.lastText ?
        this.decay * this.options.decay : 1);

      this.lastText = response.responseText;
    }
    this.timer = this.onTimerEvent.bind(this).delay(this.decay * this.frequency);
  },

  onTimerEvent: function() {
    this.updater = new Ajax.Updater(this.container, this.url, this.options);
  }
});
function $(element) {
  if (arguments.length > 1) {
    for (var i = 0, elements = [], length = arguments.length; i < length; i++)
      elements.push($(arguments[i]));
    return elements;
  }
  if (Object.isString(element))
    element = document.getElementById(element);
  return Element.extend(element);
}

if (Prototype.BrowserFeatures.XPath) {
  document._getElementsByXPath = function(expression, parentElement) {
    var results = [];
    var query = document.evaluate(expression, $(parentElement) || document,
      null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0, length = query.snapshotLength; i < length; i++)
      results.push(Element.extend(query.snapshotItem(i)));
    return results;
  };
}

/*--------------------------------------------------------------------------*/

if (!window.Node) var Node = { };

if (!Node.ELEMENT_NODE) {
  // DOM level 2 ECMAScript Language Binding
  Object.extend(Node, {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12
  });
}

(function() {
  var element = this.Element;
  this.Element = function(tagName, attributes) {
    attributes = attributes || { };
    tagName = tagName.toLowerCase();
    var cache = Element.cache;
    if (Prototype.Browser.IE && attributes.name) {
      tagName = '<' + tagName + ' name="' + attributes.name + '">';
      delete attributes.name;
      return Element.writeAttribute(document.createElement(tagName), attributes);
    }
    if (!cache[tagName]) cache[tagName] = Element.extend(document.createElement(tagName));
    return Element.writeAttribute(cache[tagName].cloneNode(false), attributes);
  };
  Object.extend(this.Element, element || { });
}).call(window);

Element.cache = { };

Element.Methods = {
  visible: function(element) {
    return $(element).style.display != 'none';
  },

  toggle: function(element) {
    element = $(element);
    Element[Element.visible(element) ? 'hide' : 'show'](element);
    return element;
  },

  hide: function(element) {
    $(element).style.display = 'none';
    return element;
  },

  show: function(element) {
    $(element).style.display = '';
    return element;
  },

  remove: function(element) {
    element = $(element);
    element.parentNode.removeChild(element);
    return element;
  },

  update: function(element, content) {
    element = $(element);
    if (content && content.toElement) content = content.toElement();
    if (Object.isElement(content)) return element.update().insert(content);
    content = Object.toHTML(content);
    element.innerHTML = content.stripScripts();
    content.evalScripts.bind(content).defer();
    return element;
  },

  replace: function(element, content) {
    element = $(element);
    if (content && content.toElement) content = content.toElement();
    else if (!Object.isElement(content)) {
      content = Object.toHTML(content);
      var range = element.ownerDocument.createRange();
      range.selectNode(element);
      content.evalScripts.bind(content).defer();
      content = range.createContextualFragment(content.stripScripts());
    }
    element.parentNode.replaceChild(content, element);
    return element;
  },

  insert: function(element, insertions) {
    element = $(element);

    if (Object.isString(insertions) || Object.isNumber(insertions) ||
        Object.isElement(insertions) || (insertions && (insertions.toElement || insertions.toHTML)))
          insertions = {bottom:insertions};

    var content, insert, tagName, childNodes;

    for (var position in insertions) {
      content  = insertions[position];
      position = position.toLowerCase();
      insert = Element._insertionTranslations[position];

      if (content && content.toElement) content = content.toElement();
      if (Object.isElement(content)) {
        insert(element, content);
        continue;
      }

      content = Object.toHTML(content);

      tagName = ((position == 'before' || position == 'after')
        ? element.parentNode : element).tagName.toUpperCase();

      childNodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts());

      if (position == 'top' || position == 'after') childNodes.reverse();
      childNodes.each(insert.curry(element));

      content.evalScripts.bind(content).defer();
    }

    return element;
  },

  wrap: function(element, wrapper, attributes) {
    element = $(element);
    if (Object.isElement(wrapper))
      $(wrapper).writeAttribute(attributes || { });
    else if (Object.isString(wrapper)) wrapper = new Element(wrapper, attributes);
    else wrapper = new Element('div', wrapper);
    if (element.parentNode)
      element.parentNode.replaceChild(wrapper, element);
    wrapper.appendChild(element);
    return wrapper;
  },

  inspect: function(element) {
    element = $(element);
    var result = '<' + element.tagName.toLowerCase();
    $H({'id': 'id', 'className': 'class'}).each(function(pair) {
      var property = pair.first(), attribute = pair.last();
      var value = (element[property] || '').toString();
      if (value) result += ' ' + attribute + '=' + value.inspect(true);
    });
    return result + '>';
  },

  recursivelyCollect: function(element, property) {
    element = $(element);
    var elements = [];
    while (element = element[property])
      if (element.nodeType == 1)
        elements.push(Element.extend(element));
    return elements;
  },

  ancestors: function(element) {
    return $(element).recursivelyCollect('parentNode');
  },

  descendants: function(element) {
    return $(element).select("*");
  },

  firstDescendant: function(element) {
    element = $(element).firstChild;
    while (element && element.nodeType != 1) element = element.nextSibling;
    return $(element);
  },

  immediateDescendants: function(element) {
    if (!(element = $(element).firstChild)) return [];
    while (element && element.nodeType != 1) element = element.nextSibling;
    if (element) return [element].concat($(element).nextSiblings());
    return [];
  },

  previousSiblings: function(element) {
    return $(element).recursivelyCollect('previousSibling');
  },

  nextSiblings: function(element) {
    return $(element).recursivelyCollect('nextSibling');
  },

  siblings: function(element) {
    element = $(element);
    return element.previousSiblings().reverse().concat(element.nextSiblings());
  },

  match: function(element, selector) {
    if (Object.isString(selector))
      selector = new Selector(selector);
    return selector.match($(element));
  },

  up: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(element.parentNode);
    var ancestors = element.ancestors();
    return Object.isNumber(expression) ? ancestors[expression] :
      Selector.findElement(ancestors, expression, index);
  },

  down: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return element.firstDescendant();
    return Object.isNumber(expression) ? element.descendants()[expression] :
      element.select(expression)[index || 0];
  },

  previous: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(Selector.handlers.previousElementSibling(element));
    var previousSiblings = element.previousSiblings();
    return Object.isNumber(expression) ? previousSiblings[expression] :
      Selector.findElement(previousSiblings, expression, index);
  },

  next: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(Selector.handlers.nextElementSibling(element));
    var nextSiblings = element.nextSiblings();
    return Object.isNumber(expression) ? nextSiblings[expression] :
      Selector.findElement(nextSiblings, expression, index);
  },

  select: function() {
    var args = $A(arguments), element = $(args.shift());
    return Selector.findChildElements(element, args);
  },

  adjacent: function() {
    var args = $A(arguments), element = $(args.shift());
    return Selector.findChildElements(element.parentNode, args).without(element);
  },

  identify: function(element) {
    element = $(element);
    var id = element.readAttribute('id'), self = arguments.callee;
    if (id) return id;
    do { id = 'anonymous_element_' + self.counter++ } while ($(id));
    element.writeAttribute('id', id);
    return id;
  },

  readAttribute: function(element, name) {
    element = $(element);
    if (Prototype.Browser.IE) {
      var t = Element._attributeTranslations.read;
      if (t.values[name]) return t.values[name](element, name);
      if (t.names[name]) name = t.names[name];
      if (name.include(':')) {
        return (!element.attributes || !element.attributes[name]) ? null :
         element.attributes[name].value;
      }
    }
    return element.getAttribute(name);
  },

  writeAttribute: function(element, name, value) {
    element = $(element);
    var attributes = { }, t = Element._attributeTranslations.write;

    if (typeof name == 'object') attributes = name;
    else attributes[name] = Object.isUndefined(value) ? true : value;

    for (var attr in attributes) {
      name = t.names[attr] || attr;
      value = attributes[attr];
      if (t.values[attr]) name = t.values[attr](element, value);
      if (value === false || value === null)
        element.removeAttribute(name);
      else if (value === true)
        element.setAttribute(name, name);
      else element.setAttribute(name, value);
    }
    return element;
  },

  getHeight: function(element) {
    return $(element).getDimensions().height;
  },

  getWidth: function(element) {
    return $(element).getDimensions().width;
  },

  classNames: function(element) {
    return new Element.ClassNames(element);
  },

  hasClassName: function(element, className) {
    if (!(element = $(element))) return;
    var elementClassName = element.className;
    return (elementClassName.length > 0 && (elementClassName == className ||
      new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
  },

  addClassName: function(element, className) {
    if (!(element = $(element))) return;
    if (!element.hasClassName(className))
      element.className += (element.className ? ' ' : '') + className;
    return element;
  },

  removeClassName: function(element, className) {
    if (!(element = $(element))) return;
    element.className = element.className.replace(
      new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ').strip();
    return element;
  },

  toggleClassName: function(element, className) {
    if (!(element = $(element))) return;
    return element[element.hasClassName(className) ?
      'removeClassName' : 'addClassName'](className);
  },

  // removes whitespace-only text node children
  cleanWhitespace: function(element) {
    element = $(element);
    var node = element.firstChild;
    while (node) {
      var nextNode = node.nextSibling;
      if (node.nodeType == 3 && !/\S/.test(node.nodeValue))
        element.removeChild(node);
      node = nextNode;
    }
    return element;
  },

  empty: function(element) {
    return $(element).innerHTML.blank();
  },

  descendantOf: function(element, ancestor) {
    element = $(element), ancestor = $(ancestor);
    var originalAncestor = ancestor;

    if (element.compareDocumentPosition)
      return (element.compareDocumentPosition(ancestor) & 8) === 8;

    if (element.sourceIndex && !Prototype.Browser.Opera) {
      var e = element.sourceIndex, a = ancestor.sourceIndex,
       nextAncestor = ancestor.nextSibling;
      if (!nextAncestor) {
        do { ancestor = ancestor.parentNode; }
        while (!(nextAncestor = ancestor.nextSibling) && ancestor.parentNode);
      }
      if (nextAncestor && nextAncestor.sourceIndex)
       return (e > a && e < nextAncestor.sourceIndex);
    }

    while (element = element.parentNode)
      if (element == originalAncestor) return true;
    return false;
  },

  scrollTo: function(element) {
    element = $(element);
    var pos = element.cumulativeOffset();
    window.scrollTo(pos[0], pos[1]);
    return element;
  },

  getStyle: function(element, style) {
    element = $(element);
    style = style == 'float' ? 'cssFloat' : style.camelize();
    var value = element.style[style];
    if (!value) {
      var css = document.defaultView.getComputedStyle(element, null);
      value = css ? css[style] : null;
    }
    if (style == 'opacity') return value ? parseFloat(value) : 1.0;
    return value == 'auto' ? null : value;
  },

  getOpacity: function(element) {
    return $(element).getStyle('opacity');
  },

  setStyle: function(element, styles) {
    element = $(element);
    var elementStyle = element.style, match;
    if (Object.isString(styles)) {
      element.style.cssText += ';' + styles;
      return styles.include('opacity') ?
        element.setOpacity(styles.match(/opacity:\s*(\d?\.?\d*)/)[1]) : element;
    }
    for (var property in styles)
      if (property == 'opacity') element.setOpacity(styles[property]);
      else
        elementStyle[(property == 'float' || property == 'cssFloat') ?
          (Object.isUndefined(elementStyle.styleFloat) ? 'cssFloat' : 'styleFloat') :
            property] = styles[property];

    return element;
  },

  setOpacity: function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;
    return element;
  },

  getDimensions: function(element) {
    element = $(element);
    var display = $(element).getStyle('display');
    if (display != 'none' && display != null) // Safari bug
      return {width: element.offsetWidth, height: element.offsetHeight};

    // All *Width and *Height properties give 0 on elements with display none,
    // so enable the element temporarily
    var els = element.style;
    var originalVisibility = els.visibility;
    var originalPosition = els.position;
    var originalDisplay = els.display;
    els.visibility = 'hidden';
    els.position = 'absolute';
    els.display = 'block';
    var originalWidth = element.clientWidth;
    var originalHeight = element.clientHeight;
    els.display = originalDisplay;
    els.position = originalPosition;
    els.visibility = originalVisibility;
    return {width: originalWidth, height: originalHeight};
  },

  makePositioned: function(element) {
    element = $(element);
    var pos = Element.getStyle(element, 'position');
    if (pos == 'static' || !pos) {
      element._madePositioned = true;
      element.style.position = 'relative';
      // Opera returns the offset relative to the positioning context, when an
      // element is position relative but top and left have not been defined
      if (window.opera) {
        element.style.top = 0;
        element.style.left = 0;
      }
    }
    return element;
  },

  undoPositioned: function(element) {
    element = $(element);
    if (element._madePositioned) {
      element._madePositioned = undefined;
      element.style.position =
        element.style.top =
        element.style.left =
        element.style.bottom =
        element.style.right = '';
    }
    return element;
  },

  makeClipping: function(element) {
    element = $(element);
    if (element._overflow) return element;
    element._overflow = Element.getStyle(element, 'overflow') || 'auto';
    if (element._overflow !== 'hidden')
      element.style.overflow = 'hidden';
    return element;
  },

  undoClipping: function(element) {
    element = $(element);
    if (!element._overflow) return element;
    element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
    element._overflow = null;
    return element;
  },

  cumulativeOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
    } while (element);
    return Element._returnOffset(valueL, valueT);
  },

  positionedOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
      if (element) {
        if (element.tagName == 'BODY') break;
        var p = Element.getStyle(element, 'position');
        if (p !== 'static') break;
      }
    } while (element);
    return Element._returnOffset(valueL, valueT);
  },

  absolutize: function(element) {
    element = $(element);
    if (element.getStyle('position') == 'absolute') return;
    // Position.prepare(); // To be done manually by Scripty when it needs it.

    var offsets = element.positionedOffset();
    var top     = offsets[1];
    var left    = offsets[0];
    var width   = element.clientWidth;
    var height  = element.clientHeight;

    element._originalLeft   = left - parseFloat(element.style.left  || 0);
    element._originalTop    = top  - parseFloat(element.style.top || 0);
    element._originalWidth  = element.style.width;
    element._originalHeight = element.style.height;

    element.style.position = 'absolute';
    element.style.top    = top + 'px';
    element.style.left   = left + 'px';
    element.style.width  = width + 'px';
    element.style.height = height + 'px';
    return element;
  },

  relativize: function(element) {
    element = $(element);
    if (element.getStyle('position') == 'relative') return;
    // Position.prepare(); // To be done manually by Scripty when it needs it.

    element.style.position = 'relative';
    var top  = parseFloat(element.style.top  || 0) - (element._originalTop || 0);
    var left = parseFloat(element.style.left || 0) - (element._originalLeft || 0);

    element.style.top    = top + 'px';
    element.style.left   = left + 'px';
    element.style.height = element._originalHeight;
    element.style.width  = element._originalWidth;
    return element;
  },

  cumulativeScrollOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.scrollTop  || 0;
      valueL += element.scrollLeft || 0;
      element = element.parentNode;
    } while (element);
    return Element._returnOffset(valueL, valueT);
  },

  getOffsetParent: function(element) {
    if (element.offsetParent) return $(element.offsetParent);
    if (element == document.body) return $(element);

    while ((element = element.parentNode) && element != document.body)
      if (Element.getStyle(element, 'position') != 'static')
        return $(element);

    return $(document.body);
  },

  viewportOffset: function(forElement) {
    var valueT = 0, valueL = 0;

    var element = forElement;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;

      // Safari fix
      if (element.offsetParent == document.body &&
        Element.getStyle(element, 'position') == 'absolute') break;

    } while (element = element.offsetParent);

    element = forElement;
    do {
      if (!Prototype.Browser.Opera || element.tagName == 'BODY') {
        valueT -= element.scrollTop  || 0;
        valueL -= element.scrollLeft || 0;
      }
    } while (element = element.parentNode);

    return Element._returnOffset(valueL, valueT);
  },

  clonePosition: function(element, source) {
    var options = Object.extend({
      setLeft:    true,
      setTop:     true,
      setWidth:   true,
      setHeight:  true,
      offsetTop:  0,
      offsetLeft: 0
    }, arguments[2] || { });

    // find page position of source
    source = $(source);
    var p = source.viewportOffset();

    // find coordinate system to use
    element = $(element);
    var delta = [0, 0];
    var parent = null;
    // delta [0,0] will do fine with position: fixed elements,
    // position:absolute needs offsetParent deltas
    if (Element.getStyle(element, 'position') == 'absolute') {
      parent = element.getOffsetParent();
      delta = parent.viewportOffset();
    }

    // correct by body offsets (fixes Safari)
    if (parent == document.body) {
      delta[0] -= document.body.offsetLeft;
      delta[1] -= document.body.offsetTop;
    }

    // set position
    if (options.setLeft)   element.style.left  = (p[0] - delta[0] + options.offsetLeft) + 'px';
    if (options.setTop)    element.style.top   = (p[1] - delta[1] + options.offsetTop) + 'px';
    if (options.setWidth)  element.style.width = source.offsetWidth + 'px';
    if (options.setHeight) element.style.height = source.offsetHeight + 'px';
    return element;
  }
};

Element.Methods.identify.counter = 1;

Object.extend(Element.Methods, {
  getElementsBySelector: Element.Methods.select,
  childElements: Element.Methods.immediateDescendants
});

Element._attributeTranslations = {
  write: {
    names: {
      className: 'class',
      htmlFor:   'for'
    },
    values: { }
  }
};

if (Prototype.Browser.Opera) {
  Element.Methods.getStyle = Element.Methods.getStyle.wrap(
    function(proceed, element, style) {
      switch (style) {
        case 'left': case 'top': case 'right': case 'bottom':
          if (proceed(element, 'position') === 'static') return null;
        case 'height': case 'width':
          // returns '0px' for hidden elements; we want it to return null
          if (!Element.visible(element)) return null;

          // returns the border-box dimensions rather than the content-box
          // dimensions, so we subtract padding and borders from the value
          var dim = parseInt(proceed(element, style), 10);

          if (dim !== element['offset' + style.capitalize()])
            return dim + 'px';

          var properties;
          if (style === 'height') {
            properties = ['border-top-width', 'padding-top',
             'padding-bottom', 'border-bottom-width'];
          }
          else {
            properties = ['border-left-width', 'padding-left',
             'padding-right', 'border-right-width'];
          }
          return properties.inject(dim, function(memo, property) {
            var val = proceed(element, property);
            return val === null ? memo : memo - parseInt(val, 10);
          }) + 'px';
        default: return proceed(element, style);
      }
    }
  );

  Element.Methods.readAttribute = Element.Methods.readAttribute.wrap(
    function(proceed, element, attribute) {
      if (attribute === 'title') return element.title;
      return proceed(element, attribute);
    }
  );
}

else if (Prototype.Browser.IE) {
  // IE doesn't report offsets correctly for static elements, so we change them
  // to "relative" to get the values, then change them back.
  Element.Methods.getOffsetParent = Element.Methods.getOffsetParent.wrap(
    function(proceed, element) {
      element = $(element);
      var position = element.getStyle('position');
      if (position !== 'static') return proceed(element);
      element.setStyle({ position: 'relative' });
      var value = proceed(element);
      element.setStyle({ position: position });
      return value;
    }
  );

  $w('positionedOffset viewportOffset').each(function(method) {
    Element.Methods[method] = Element.Methods[method].wrap(
      function(proceed, element) {
        element = $(element);
        var position = element.getStyle('position');
        if (position !== 'static') return proceed(element);
        // Trigger hasLayout on the offset parent so that IE6 reports
        // accurate offsetTop and offsetLeft values for position: fixed.
        var offsetParent = element.getOffsetParent();
        if (offsetParent && offsetParent.getStyle('position') === 'fixed')
          offsetParent.setStyle({ zoom: 1 });
        element.setStyle({ position: 'relative' });
        var value = proceed(element);
        element.setStyle({ position: position });
        return value;
      }
    );
  });

  Element.Methods.getStyle = function(element, style) {
    element = $(element);
    style = (style == 'float' || style == 'cssFloat') ? 'styleFloat' : style.camelize();
    var value = element.style[style];
    if (!value && element.currentStyle) value = element.currentStyle[style];

    if (style == 'opacity') {
      if (value = (element.getStyle('filter') || '').match(/alpha\(opacity=(.*)\)/))
        if (value[1]) return parseFloat(value[1]) / 100;
      return 1.0;
    }

    if (value == 'auto') {
      if ((style == 'width' || style == 'height') && (element.getStyle('display') != 'none'))
        return element['offset' + style.capitalize()] + 'px';
      return null;
    }
    return value;
  };

  Element.Methods.setOpacity = function(element, value) {
    function stripAlpha(filter){
      return filter.replace(/alpha\([^\)]*\)/gi,'');
    }
    element = $(element);
    var currentStyle = element.currentStyle;
    if ((currentStyle && !currentStyle.hasLayout) ||
      (!currentStyle && element.style.zoom == 'normal'))
        element.style.zoom = 1;

    var filter = element.getStyle('filter'), style = element.style;
    if (value == 1 || value === '') {
      (filter = stripAlpha(filter)) ?
        style.filter = filter : style.removeAttribute('filter');
      return element;
    } else if (value < 0.00001) value = 0;
    style.filter = stripAlpha(filter) +
      'alpha(opacity=' + (value * 100) + ')';
    return element;
  };

  Element._attributeTranslations = {
    read: {
      names: {
        'class': 'className',
        'for':   'htmlFor'
      },
      values: {
        _getAttr: function(element, attribute) {
          return element.getAttribute(attribute, 2);
        },
        _getAttrNode: function(element, attribute) {
          var node = element.getAttributeNode(attribute);
          return node ? node.value : "";
        },
        _getEv: function(element, attribute) {
          attribute = element.getAttribute(attribute);
          return attribute ? attribute.toString().slice(23, -2) : null;
        },
        _flag: function(element, attribute) {
          return $(element).hasAttribute(attribute) ? attribute : null;
        },
        style: function(element) {
          return element.style.cssText.toLowerCase();
        },
        title: function(element) {
          return element.title;
        }
      }
    }
  };

  Element._attributeTranslations.write = {
    names: Object.extend({
      cellpadding: 'cellPadding',
      cellspacing: 'cellSpacing'
    }, Element._attributeTranslations.read.names),
    values: {
      checked: function(element, value) {
        element.checked = !!value;
      },

      style: function(element, value) {
        element.style.cssText = value ? value : '';
      }
    }
  };

  Element._attributeTranslations.has = {};

  $w('colSpan rowSpan vAlign dateTime accessKey tabIndex ' +
      'encType maxLength readOnly longDesc').each(function(attr) {
    Element._attributeTranslations.write.names[attr.toLowerCase()] = attr;
    Element._attributeTranslations.has[attr.toLowerCase()] = attr;
  });

  (function(v) {
    Object.extend(v, {
      href:        v._getAttr,
      src:         v._getAttr,
      type:        v._getAttr,
      action:      v._getAttrNode,
      disabled:    v._flag,
      checked:     v._flag,
      readonly:    v._flag,
      multiple:    v._flag,
      onload:      v._getEv,
      onunload:    v._getEv,
      onclick:     v._getEv,
      ondblclick:  v._getEv,
      onmousedown: v._getEv,
      onmouseup:   v._getEv,
      onmouseover: v._getEv,
      onmousemove: v._getEv,
      onmouseout:  v._getEv,
      onfocus:     v._getEv,
      onblur:      v._getEv,
      onkeypress:  v._getEv,
      onkeydown:   v._getEv,
      onkeyup:     v._getEv,
      onsubmit:    v._getEv,
      onreset:     v._getEv,
      onselect:    v._getEv,
      onchange:    v._getEv
    });
  })(Element._attributeTranslations.read.values);
}

else if (Prototype.Browser.Gecko && /rv:1\.8\.0/.test(navigator.userAgent)) {
  Element.Methods.setOpacity = function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1) ? 0.999999 :
      (value === '') ? '' : (value < 0.00001) ? 0 : value;
    return element;
  };
}

else if (Prototype.Browser.WebKit) {
  Element.Methods.setOpacity = function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;

    if (value == 1)
      if(element.tagName == 'IMG' && element.width) {
        element.width++; element.width--;
      } else try {
        var n = document.createTextNode(' ');
        element.appendChild(n);
        element.removeChild(n);
      } catch (e) { }

    return element;
  };

  // Safari returns margins on body which is incorrect if the child is absolutely
  // positioned.  For performance reasons, redefine Element#cumulativeOffset for
  // KHTML/WebKit only.
  Element.Methods.cumulativeOffset = function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      if (element.offsetParent == document.body)
        if (Element.getStyle(element, 'position') == 'absolute') break;

      element = element.offsetParent;
    } while (element);

    return Element._returnOffset(valueL, valueT);
  };
}

if (Prototype.Browser.IE || Prototype.Browser.Opera) {
  // IE and Opera are missing .innerHTML support for TABLE-related and SELECT elements
  Element.Methods.update = function(element, content) {
    element = $(element);

    if (content && content.toElement) content = content.toElement();
    if (Object.isElement(content)) return element.update().insert(content);

    content = Object.toHTML(content);
    var tagName = element.tagName.toUpperCase();

    if (tagName in Element._insertionTranslations.tags) {
      $A(element.childNodes).each(function(node) { element.removeChild(node) });
      Element._getContentFromAnonymousElement(tagName, content.stripScripts())
        .each(function(node) { element.appendChild(node) });
    }
    else element.innerHTML = content.stripScripts();

    content.evalScripts.bind(content).defer();
    return element;
  };
}

if ('outerHTML' in document.createElement('div')) {
  Element.Methods.replace = function(element, content) {
    element = $(element);

    if (content && content.toElement) content = content.toElement();
    if (Object.isElement(content)) {
      element.parentNode.replaceChild(content, element);
      return element;
    }

    content = Object.toHTML(content);
    var parent = element.parentNode, tagName = parent.tagName.toUpperCase();

    if (Element._insertionTranslations.tags[tagName]) {
      var nextSibling = element.next();
      var fragments = Element._getContentFromAnonymousElement(tagName, content.stripScripts());
      parent.removeChild(element);
      if (nextSibling)
        fragments.each(function(node) { parent.insertBefore(node, nextSibling) });
      else
        fragments.each(function(node) { parent.appendChild(node) });
    }
    else element.outerHTML = content.stripScripts();

    content.evalScripts.bind(content).defer();
    return element;
  };
}

Element._returnOffset = function(l, t) {
  var result = [l, t];
  result.left = l;
  result.top = t;
  return result;
};

Element._getContentFromAnonymousElement = function(tagName, html) {
  var div = new Element('div'), t = Element._insertionTranslations.tags[tagName];
  if (t) {
    div.innerHTML = t[0] + html + t[1];
    t[2].times(function() { div = div.firstChild });
  } else div.innerHTML = html;
  return $A(div.childNodes);
};

Element._insertionTranslations = {
  before: function(element, node) {
    element.parentNode.insertBefore(node, element);
  },
  top: function(element, node) {
    element.insertBefore(node, element.firstChild);
  },
  bottom: function(element, node) {
    element.appendChild(node);
  },
  after: function(element, node) {
    element.parentNode.insertBefore(node, element.nextSibling);
  },
  tags: {
    TABLE:  ['<table>',                '</table>',                   1],
    TBODY:  ['<table><tbody>',         '</tbody></table>',           2],
    TR:     ['<table><tbody><tr>',     '</tr></tbody></table>',      3],
    TD:     ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
    SELECT: ['<select>',               '</select>',                  1]
  }
};

(function() {
  Object.extend(this.tags, {
    THEAD: this.tags.TBODY,
    TFOOT: this.tags.TBODY,
    TH:    this.tags.TD
  });
}).call(Element._insertionTranslations);

Element.Methods.Simulated = {
  hasAttribute: function(element, attribute) {
    attribute = Element._attributeTranslations.has[attribute] || attribute;
    var node = $(element).getAttributeNode(attribute);
    return node && node.specified;
  }
};

Element.Methods.ByTag = { };

Object.extend(Element, Element.Methods);

if (!Prototype.BrowserFeatures.ElementExtensions &&
    document.createElement('div').__proto__) {
  window.HTMLElement = { };
  window.HTMLElement.prototype = document.createElement('div').__proto__;
  Prototype.BrowserFeatures.ElementExtensions = true;
}

Element.extend = (function() {
  if (Prototype.BrowserFeatures.SpecificElementExtensions)
    return Prototype.K;

  var Methods = { }, ByTag = Element.Methods.ByTag;

  var extend = Object.extend(function(element) {
    if (!element || element._extendedByPrototype ||
        element.nodeType != 1 || element == window) return element;

    var methods = Object.clone(Methods),
      tagName = element.tagName, property, value;

    // extend methods for specific tags
    if (ByTag[tagName]) Object.extend(methods, ByTag[tagName]);

    for (property in methods) {
      value = methods[property];
      if (Object.isFunction(value) && !(property in element))
        element[property] = value.methodize();
    }

    element._extendedByPrototype = Prototype.emptyFunction;
    return element;

  }, {
    refresh: function() {
      // extend methods for all tags (Safari doesn't need this)
      if (!Prototype.BrowserFeatures.ElementExtensions) {
        Object.extend(Methods, Element.Methods);
        Object.extend(Methods, Element.Methods.Simulated);
      }
    }
  });

  extend.refresh();
  return extend;
})();

Element.hasAttribute = function(element, attribute) {
  if (element.hasAttribute) return element.hasAttribute(attribute);
  return Element.Methods.Simulated.hasAttribute(element, attribute);
};

Element.addMethods = function(methods) {
  var F = Prototype.BrowserFeatures, T = Element.Methods.ByTag;

  if (!methods) {
    Object.extend(Form, Form.Methods);
    Object.extend(Form.Element, Form.Element.Methods);
    Object.extend(Element.Methods.ByTag, {
      "FORM":     Object.clone(Form.Methods),
      "INPUT":    Object.clone(Form.Element.Methods),
      "SELECT":   Object.clone(Form.Element.Methods),
      "TEXTAREA": Object.clone(Form.Element.Methods)
    });
  }

  if (arguments.length == 2) {
    var tagName = methods;
    methods = arguments[1];
  }

  if (!tagName) Object.extend(Element.Methods, methods || { });
  else {
    if (Object.isArray(tagName)) tagName.each(extend);
    else extend(tagName);
  }

  function extend(tagName) {
    tagName = tagName.toUpperCase();
    if (!Element.Methods.ByTag[tagName])
      Element.Methods.ByTag[tagName] = { };
    Object.extend(Element.Methods.ByTag[tagName], methods);
  }

  function copy(methods, destination, onlyIfAbsent) {
    onlyIfAbsent = onlyIfAbsent || false;
    for (var property in methods) {
      var value = methods[property];
      if (!Object.isFunction(value)) continue;
      if (!onlyIfAbsent || !(property in destination))
        destination[property] = value.methodize();
    }
  }

  function findDOMClass(tagName) {
    var klass;
    var trans = {
      "OPTGROUP": "OptGroup", "TEXTAREA": "TextArea", "P": "Paragraph",
      "FIELDSET": "FieldSet", "UL": "UList", "OL": "OList", "DL": "DList",
      "DIR": "Directory", "H1": "Heading", "H2": "Heading", "H3": "Heading",
      "H4": "Heading", "H5": "Heading", "H6": "Heading", "Q": "Quote",
      "INS": "Mod", "DEL": "Mod", "A": "Anchor", "IMG": "Image", "CAPTION":
      "TableCaption", "COL": "TableCol", "COLGROUP": "TableCol", "THEAD":
      "TableSection", "TFOOT": "TableSection", "TBODY": "TableSection", "TR":
      "TableRow", "TH": "TableCell", "TD": "TableCell", "FRAMESET":
      "FrameSet", "IFRAME": "IFrame"
    };
    if (trans[tagName]) klass = 'HTML' + trans[tagName] + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName.capitalize() + 'Element';
    if (window[klass]) return window[klass];

    window[klass] = { };
    window[klass].prototype = document.createElement(tagName).__proto__;
    return window[klass];
  }

  if (F.ElementExtensions) {
    copy(Element.Methods, HTMLElement.prototype);
    copy(Element.Methods.Simulated, HTMLElement.prototype, true);
  }

  if (F.SpecificElementExtensions) {
    for (var tag in Element.Methods.ByTag) {
      var klass = findDOMClass(tag);
      if (Object.isUndefined(klass)) continue;
      copy(T[tag], klass.prototype);
    }
  }

  Object.extend(Element, Element.Methods);
  delete Element.ByTag;

  if (Element.extend.refresh) Element.extend.refresh();
  Element.cache = { };
};

document.viewport = {
  getDimensions: function() {
    var dimensions = { };
    var B = Prototype.Browser;
    $w('width height').each(function(d) {
      var D = d.capitalize();
      dimensions[d] = (B.WebKit && !document.evaluate) ? self['inner' + D] :
        (B.Opera) ? document.body['client' + D] : document.documentElement['client' + D];
    });
    return dimensions;
  },

  getWidth: function() {
    return this.getDimensions().width;
  },

  getHeight: function() {
    return this.getDimensions().height;
  },

  getScrollOffsets: function() {
    return Element._returnOffset(
      window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
      window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop);
  }
};
/* Portions of the Selector class are derived from Jack Slocum‰Ûªs DomQuery,
 * part of YUI-Ext version 0.40, distributed under the terms of an MIT-style
 * license.  Please see http://www.yui-ext.com/ for more information. */

var Selector = Class.create({
  initialize: function(expression) {
    this.expression = expression.strip();
    this.compileMatcher();
  },

  shouldUseXPath: function() {
    if (!Prototype.BrowserFeatures.XPath) return false;

    var e = this.expression;

    // Safari 3 chokes on :*-of-type and :empty
    if (Prototype.Browser.WebKit &&
     (e.include("-of-type") || e.include(":empty")))
      return false;

    // XPath can't do namespaced attributes, nor can it read
    // the "checked" property from DOM nodes
    if ((/(\[[\w-]*?:|:checked)/).test(this.expression))
      return false;

    return true;
  },

  compileMatcher: function() {
    if (this.shouldUseXPath())
      return this.compileXPathMatcher();

    var e = this.expression, ps = Selector.patterns, h = Selector.handlers,
        c = Selector.criteria, le, p, m;

    if (Selector._cache[e]) {
      this.matcher = Selector._cache[e];
      return;
    }

    this.matcher = ["this.matcher = function(root) {",
                    "var r = root, h = Selector.handlers, c = false, n;"];

    while (e && le != e && (/\S/).test(e)) {
      le = e;
      for (var i in ps) {
        p = ps[i];
        if (m = e.match(p)) {
          this.matcher.push(Object.isFunction(c[i]) ? c[i](m) :
    	      new Template(c[i]).evaluate(m));
          e = e.replace(m[0], '');
          break;
        }
      }
    }

    this.matcher.push("return h.unique(n);\n}");
    eval(this.matcher.join('\n'));
    Selector._cache[this.expression] = this.matcher;
  },

  compileXPathMatcher: function() {
    var e = this.expression, ps = Selector.patterns,
        x = Selector.xpath, le, m;

    if (Selector._cache[e]) {
      this.xpath = Selector._cache[e]; return;
    }

    this.matcher = ['.//*'];
    while (e && le != e && (/\S/).test(e)) {
      le = e;
      for (var i in ps) {
        if (m = e.match(ps[i])) {
          this.matcher.push(Object.isFunction(x[i]) ? x[i](m) :
            new Template(x[i]).evaluate(m));
          e = e.replace(m[0], '');
          break;
        }
      }
    }

    this.xpath = this.matcher.join('');
    Selector._cache[this.expression] = this.xpath;
  },

  findElements: function(root) {
    root = root || document;
    if (this.xpath) return document._getElementsByXPath(this.xpath, root);
    return this.matcher(root);
  },

  match: function(element) {
    this.tokens = [];

    var e = this.expression, ps = Selector.patterns, as = Selector.assertions;
    var le, p, m;

    while (e && le !== e && (/\S/).test(e)) {
      le = e;
      for (var i in ps) {
        p = ps[i];
        if (m = e.match(p)) {
          // use the Selector.assertions methods unless the selector
          // is too complex.
          if (as[i]) {
            this.tokens.push([i, Object.clone(m)]);
            e = e.replace(m[0], '');
          } else {
            // reluctantly do a document-wide search
            // and look for a match in the array
            return this.findElements(document).include(element);
          }
        }
      }
    }

    var match = true, name, matches;
    for (var i = 0, token; token = this.tokens[i]; i++) {
      name = token[0], matches = token[1];
      if (!Selector.assertions[name](element, matches)) {
        match = false; break;
      }
    }

    return match;
  },

  toString: function() {
    return this.expression;
  },

  inspect: function() {
    return "#<Selector:" + this.expression.inspect() + ">";
  }
});

Object.extend(Selector, {
  _cache: { },

  xpath: {
    descendant:   "//*",
    child:        "/*",
    adjacent:     "/following-sibling::*[1]",
    laterSibling: '/following-sibling::*',
    tagName:      function(m) {
      if (m[1] == '*') return '';
      return "[local-name()='" + m[1].toLowerCase() +
             "' or local-name()='" + m[1].toUpperCase() + "']";
    },
    className:    "[contains(concat(' ', @class, ' '), ' #{1} ')]",
    id:           "[@id='#{1}']",
    attrPresence: function(m) {
      m[1] = m[1].toLowerCase();
      return new Template("[@#{1}]").evaluate(m);
    },
    attr: function(m) {
      m[1] = m[1].toLowerCase();
      m[3] = m[5] || m[6];
      return new Template(Selector.xpath.operators[m[2]]).evaluate(m);
    },
    pseudo: function(m) {
      var h = Selector.xpath.pseudos[m[1]];
      if (!h) return '';
      if (Object.isFunction(h)) return h(m);
      return new Template(Selector.xpath.pseudos[m[1]]).evaluate(m);
    },
    operators: {
      '=':  "[@#{1}='#{3}']",
      '!=': "[@#{1}!='#{3}']",
      '^=': "[starts-with(@#{1}, '#{3}')]",
      '$=': "[substring(@#{1}, (string-length(@#{1}) - string-length('#{3}') + 1))='#{3}']",
      '*=': "[contains(@#{1}, '#{3}')]",
      '~=': "[contains(concat(' ', @#{1}, ' '), ' #{3} ')]",
      '|=': "[contains(concat('-', @#{1}, '-'), '-#{3}-')]"
    },
    pseudos: {
      'first-child': '[not(preceding-sibling::*)]',
      'last-child':  '[not(following-sibling::*)]',
      'only-child':  '[not(preceding-sibling::* or following-sibling::*)]',
      'empty':       "[count(*) = 0 and (count(text()) = 0 or translate(text(), ' \t\r\n', '') = '')]",
      'checked':     "[@checked]",
      'disabled':    "[@disabled]",
      'enabled':     "[not(@disabled)]",
      'not': function(m) {
        var e = m[6], p = Selector.patterns,
            x = Selector.xpath, le, v;

        var exclusion = [];
        while (e && le != e && (/\S/).test(e)) {
          le = e;
          for (var i in p) {
            if (m = e.match(p[i])) {
              v = Object.isFunction(x[i]) ? x[i](m) : new Template(x[i]).evaluate(m);
              exclusion.push("(" + v.substring(1, v.length - 1) + ")");
              e = e.replace(m[0], '');
              break;
            }
          }
        }
        return "[not(" + exclusion.join(" and ") + ")]";
      },
      'nth-child':      function(m) {
        return Selector.xpath.pseudos.nth("(count(./preceding-sibling::*) + 1) ", m);
      },
      'nth-last-child': function(m) {
        return Selector.xpath.pseudos.nth("(count(./following-sibling::*) + 1) ", m);
      },
      'nth-of-type':    function(m) {
        return Selector.xpath.pseudos.nth("position() ", m);
      },
      'nth-last-of-type': function(m) {
        return Selector.xpath.pseudos.nth("(last() + 1 - position()) ", m);
      },
      'first-of-type':  function(m) {
        m[6] = "1"; return Selector.xpath.pseudos['nth-of-type'](m);
      },
      'last-of-type':   function(m) {
        m[6] = "1"; return Selector.xpath.pseudos['nth-last-of-type'](m);
      },
      'only-of-type':   function(m) {
        var p = Selector.xpath.pseudos; return p['first-of-type'](m) + p['last-of-type'](m);
      },
      nth: function(fragment, m) {
        var mm, formula = m[6], predicate;
        if (formula == 'even') formula = '2n+0';
        if (formula == 'odd')  formula = '2n+1';
        if (mm = formula.match(/^(\d+)$/)) // digit only
          return '[' + fragment + "= " + mm[1] + ']';
        if (mm = formula.match(/^(-?\d*)?n(([+-])(\d+))?/)) { // an+b
          if (mm[1] == "-") mm[1] = -1;
          var a = mm[1] ? Number(mm[1]) : 1;
          var b = mm[2] ? Number(mm[2]) : 0;
          predicate = "[((#{fragment} - #{b}) mod #{a} = 0) and " +
          "((#{fragment} - #{b}) div #{a} >= 0)]";
          return new Template(predicate).evaluate({
            fragment: fragment, a: a, b: b });
        }
      }
    }
  },

  criteria: {
    tagName:      'n = h.tagName(n, r, "#{1}", c);      c = false;',
    className:    'n = h.className(n, r, "#{1}", c);    c = false;',
    id:           'n = h.id(n, r, "#{1}", c);           c = false;',
    attrPresence: 'n = h.attrPresence(n, r, "#{1}", c); c = false;',
    attr: function(m) {
      m[3] = (m[5] || m[6]);
      return new Template('n = h.attr(n, r, "#{1}", "#{3}", "#{2}", c); c = false;').evaluate(m);
    },
    pseudo: function(m) {
      if (m[6]) m[6] = m[6].replace(/"/g, '\\"');
      return new Template('n = h.pseudo(n, "#{1}", "#{6}", r, c); c = false;').evaluate(m);
    },
    descendant:   'c = "descendant";',
    child:        'c = "child";',
    adjacent:     'c = "adjacent";',
    laterSibling: 'c = "laterSibling";'
  },

  patterns: {
    // combinators must be listed first
    // (and descendant needs to be last combinator)
    laterSibling: /^\s*~\s*/,
    child:        /^\s*>\s*/,
    adjacent:     /^\s*\+\s*/,
    descendant:   /^\s/,

    // selectors follow
    tagName:      /^\s*(\*|[\w\-]+)(\b|$)?/,
    id:           /^#([\w\-\*]+)(\b|$)/,
    className:    /^\.([\w\-\*]+)(\b|$)/,
    pseudo:
/^:((first|last|nth|nth-last|only)(-child|-of-type)|empty|checked|(en|dis)abled|not)(\((.*?)\))?(\b|$|(?=\s|[:+~>]))/,
    attrPresence: /^\[([\w]+)\]/,
    attr:         /\[((?:[\w-]*:)?[\w-]+)\s*(?:([!^$*~|]?=)\s*((['"])([^\4]*?)\4|([^'"][^\]]*?)))?\]/
  },

  // for Selector.match and Element#match
  assertions: {
    tagName: function(element, matches) {
      return matches[1].toUpperCase() == element.tagName.toUpperCase();
    },

    className: function(element, matches) {
      return Element.hasClassName(element, matches[1]);
    },

    id: function(element, matches) {
      return element.id === matches[1];
    },

    attrPresence: function(element, matches) {
      return Element.hasAttribute(element, matches[1]);
    },

    attr: function(element, matches) {
      var nodeValue = Element.readAttribute(element, matches[1]);
      return nodeValue && Selector.operators[matches[2]](nodeValue, matches[5] || matches[6]);
    }
  },

  handlers: {
    // UTILITY FUNCTIONS
    // joins two collections
    concat: function(a, b) {
      for (var i = 0, node; node = b[i]; i++)
        a.push(node);
      return a;
    },

    // marks an array of nodes for counting
    mark: function(nodes) {
      var _true = Prototype.emptyFunction;
      for (var i = 0, node; node = nodes[i]; i++)
        node._countedByPrototype = _true;
      return nodes;
    },

    unmark: function(nodes) {
      for (var i = 0, node; node = nodes[i]; i++)
        node._countedByPrototype = undefined;
      return nodes;
    },

    // mark each child node with its position (for nth calls)
    // "ofType" flag indicates whether we're indexing for nth-of-type
    // rather than nth-child
    index: function(parentNode, reverse, ofType) {
      parentNode._countedByPrototype = Prototype.emptyFunction;
      if (reverse) {
        for (var nodes = parentNode.childNodes, i = nodes.length - 1, j = 1; i >= 0; i--) {
          var node = nodes[i];
          if (node.nodeType == 1 && (!ofType || node._countedByPrototype)) node.nodeIndex = j++;
        }
      } else {
        for (var i = 0, j = 1, nodes = parentNode.childNodes; node = nodes[i]; i++)
          if (node.nodeType == 1 && (!ofType || node._countedByPrototype)) node.nodeIndex = j++;
      }
    },

    // filters out duplicates and extends all nodes
    unique: function(nodes) {
      if (nodes.length == 0) return nodes;
      var results = [], n;
      for (var i = 0, l = nodes.length; i < l; i++)
        if (!(n = nodes[i])._countedByPrototype) {
          n._countedByPrototype = Prototype.emptyFunction;
          results.push(Element.extend(n));
        }
      return Selector.handlers.unmark(results);
    },

    // COMBINATOR FUNCTIONS
    descendant: function(nodes) {
      var h = Selector.handlers;
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        h.concat(results, node.getElementsByTagName('*'));
      return results;
    },

    child: function(nodes) {
      var h = Selector.handlers;
      for (var i = 0, results = [], node; node = nodes[i]; i++) {
        for (var j = 0, child; child = node.childNodes[j]; j++)
          if (child.nodeType == 1 && child.tagName != '!') results.push(child);
      }
      return results;
    },

    adjacent: function(nodes) {
      for (var i = 0, results = [], node; node = nodes[i]; i++) {
        var next = this.nextElementSibling(node);
        if (next) results.push(next);
      }
      return results;
    },

    laterSibling: function(nodes) {
      var h = Selector.handlers;
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        h.concat(results, Element.nextSiblings(node));
      return results;
    },

    nextElementSibling: function(node) {
      while (node = node.nextSibling)
	      if (node.nodeType == 1) return node;
      return null;
    },

    previousElementSibling: function(node) {
      while (node = node.previousSibling)
        if (node.nodeType == 1) return node;
      return null;
    },

    // TOKEN FUNCTIONS
    tagName: function(nodes, root, tagName, combinator) {
      var uTagName = tagName.toUpperCase();
      var results = [], h = Selector.handlers;
      if (nodes) {
        if (combinator) {
          // fastlane for ordinary descendant combinators
          if (combinator == "descendant") {
            for (var i = 0, node; node = nodes[i]; i++)
              h.concat(results, node.getElementsByTagName(tagName));
            return results;
          } else nodes = this[combinator](nodes);
          if (tagName == "*") return nodes;
        }
        for (var i = 0, node; node = nodes[i]; i++)
          if (node.tagName.toUpperCase() === uTagName) results.push(node);
        return results;
      } else return root.getElementsByTagName(tagName);
    },

    id: function(nodes, root, id, combinator) {
      var targetNode = $(id), h = Selector.handlers;
      if (!targetNode) return [];
      if (!nodes && root == document) return [targetNode];
      if (nodes) {
        if (combinator) {
          if (combinator == 'child') {
            for (var i = 0, node; node = nodes[i]; i++)
              if (targetNode.parentNode == node) return [targetNode];
          } else if (combinator == 'descendant') {
            for (var i = 0, node; node = nodes[i]; i++)
              if (Element.descendantOf(targetNode, node)) return [targetNode];
          } else if (combinator == 'adjacent') {
            for (var i = 0, node; node = nodes[i]; i++)
              if (Selector.handlers.previousElementSibling(targetNode) == node)
                return [targetNode];
          } else nodes = h[combinator](nodes);
        }
        for (var i = 0, node; node = nodes[i]; i++)
          if (node == targetNode) return [targetNode];
        return [];
      }
      return (targetNode && Element.descendantOf(targetNode, root)) ? [targetNode] : [];
    },

    className: function(nodes, root, className, combinator) {
      if (nodes && combinator) nodes = this[combinator](nodes);
      return Selector.handlers.byClassName(nodes, root, className);
    },

    byClassName: function(nodes, root, className) {
      if (!nodes) nodes = Selector.handlers.descendant([root]);
      var needle = ' ' + className + ' ';
      for (var i = 0, results = [], node, nodeClassName; node = nodes[i]; i++) {
        nodeClassName = node.className;
        if (nodeClassName.length == 0) continue;
        if (nodeClassName == className || (' ' + nodeClassName + ' ').include(needle))
          results.push(node);
      }
      return results;
    },

    attrPresence: function(nodes, root, attr, combinator) {
      if (!nodes) nodes = root.getElementsByTagName("*");
      if (nodes && combinator) nodes = this[combinator](nodes);
      var results = [];
      for (var i = 0, node; node = nodes[i]; i++)
        if (Element.hasAttribute(node, attr)) results.push(node);
      return results;
    },

    attr: function(nodes, root, attr, value, operator, combinator) {
      if (!nodes) nodes = root.getElementsByTagName("*");
      if (nodes && combinator) nodes = this[combinator](nodes);
      var handler = Selector.operators[operator], results = [];
      for (var i = 0, node; node = nodes[i]; i++) {
        var nodeValue = Element.readAttribute(node, attr);
        if (nodeValue === null) continue;
        if (handler(nodeValue, value)) results.push(node);
      }
      return results;
    },

    pseudo: function(nodes, name, value, root, combinator) {
      if (nodes && combinator) nodes = this[combinator](nodes);
      if (!nodes) nodes = root.getElementsByTagName("*");
      return Selector.pseudos[name](nodes, value, root);
    }
  },

  pseudos: {
    'first-child': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++) {
        if (Selector.handlers.previousElementSibling(node)) continue;
          results.push(node);
      }
      return results;
    },
    'last-child': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++) {
        if (Selector.handlers.nextElementSibling(node)) continue;
          results.push(node);
      }
      return results;
    },
    'only-child': function(nodes, value, root) {
      var h = Selector.handlers;
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        if (!h.previousElementSibling(node) && !h.nextElementSibling(node))
          results.push(node);
      return results;
    },
    'nth-child':        function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, formula, root);
    },
    'nth-last-child':   function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, formula, root, true);
    },
    'nth-of-type':      function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, formula, root, false, true);
    },
    'nth-last-of-type': function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, formula, root, true, true);
    },
    'first-of-type':    function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, "1", root, false, true);
    },
    'last-of-type':     function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, "1", root, true, true);
    },
    'only-of-type':     function(nodes, formula, root) {
      var p = Selector.pseudos;
      return p['last-of-type'](p['first-of-type'](nodes, formula, root), formula, root);
    },

    // handles the an+b logic
    getIndices: function(a, b, total) {
      if (a == 0) return b > 0 ? [b] : [];
      return $R(1, total).inject([], function(memo, i) {
        if (0 == (i - b) % a && (i - b) / a >= 0) memo.push(i);
        return memo;
      });
    },

    // handles nth(-last)-child, nth(-last)-of-type, and (first|last)-of-type
    nth: function(nodes, formula, root, reverse, ofType) {
      if (nodes.length == 0) return [];
      if (formula == 'even') formula = '2n+0';
      if (formula == 'odd')  formula = '2n+1';
      var h = Selector.handlers, results = [], indexed = [], m;
      h.mark(nodes);
      for (var i = 0, node; node = nodes[i]; i++) {
        if (!node.parentNode._countedByPrototype) {
          h.index(node.parentNode, reverse, ofType);
          indexed.push(node.parentNode);
        }
      }
      if (formula.match(/^\d+$/)) { // just a number
        formula = Number(formula);
        for (var i = 0, node; node = nodes[i]; i++)
          if (node.nodeIndex == formula) results.push(node);
      } else if (m = formula.match(/^(-?\d*)?n(([+-])(\d+))?/)) { // an+b
        if (m[1] == "-") m[1] = -1;
        var a = m[1] ? Number(m[1]) : 1;
        var b = m[2] ? Number(m[2]) : 0;
        var indices = Selector.pseudos.getIndices(a, b, nodes.length);
        for (var i = 0, node, l = indices.length; node = nodes[i]; i++) {
          for (var j = 0; j < l; j++)
            if (node.nodeIndex == indices[j]) results.push(node);
        }
      }
      h.unmark(nodes);
      h.unmark(indexed);
      return results;
    },

    'empty': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++) {
        // IE treats comments as element nodes
        if (node.tagName == '!' || (node.firstChild && !node.innerHTML.match(/^\s*$/))) continue;
        results.push(node);
      }
      return results;
    },

    'not': function(nodes, selector, root) {
      var h = Selector.handlers, selectorType, m;
      var exclusions = new Selector(selector).findElements(root);
      h.mark(exclusions);
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        if (!node._countedByPrototype) results.push(node);
      h.unmark(exclusions);
      return results;
    },

    'enabled': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        if (!node.disabled) results.push(node);
      return results;
    },

    'disabled': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        if (node.disabled) results.push(node);
      return results;
    },

    'checked': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        if (node.checked) results.push(node);
      return results;
    }
  },

  operators: {
    '=':  function(nv, v) { return nv == v; },
    '!=': function(nv, v) { return nv != v; },
    '^=': function(nv, v) { return nv.startsWith(v); },
    '$=': function(nv, v) { return nv.endsWith(v); },
    '*=': function(nv, v) { return nv.include(v); },
    '~=': function(nv, v) { return (' ' + nv + ' ').include(' ' + v + ' '); },
    '|=': function(nv, v) { return ('-' + nv.toUpperCase() + '-').include('-' + v.toUpperCase() + '-'); }
  },

  split: function(expression) {
    var expressions = [];
    expression.scan(/(([\w#:.~>+()\s-]+|\*|\[.*?\])+)\s*(,|$)/, function(m) {
      expressions.push(m[1].strip());
    });
    return expressions;
  },

  matchElements: function(elements, expression) {
    var matches = $$(expression), h = Selector.handlers;
    h.mark(matches);
    for (var i = 0, results = [], element; element = elements[i]; i++)
      if (element._countedByPrototype) results.push(element);
    h.unmark(matches);
    return results;
  },

  findElement: function(elements, expression, index) {
    if (Object.isNumber(expression)) {
      index = expression; expression = false;
    }
    return Selector.matchElements(elements, expression || '*')[index || 0];
  },

  findChildElements: function(element, expressions) {
    expressions = Selector.split(expressions.join(','));
    var results = [], h = Selector.handlers;
    for (var i = 0, l = expressions.length, selector; i < l; i++) {
      selector = new Selector(expressions[i].strip());
      h.concat(results, selector.findElements(element));
    }
    return (l > 1) ? h.unique(results) : results;
  }
});

if (Prototype.Browser.IE) {
  Object.extend(Selector.handlers, {
    // IE returns comment nodes on getElementsByTagName("*").
    // Filter them out.
    concat: function(a, b) {
      for (var i = 0, node; node = b[i]; i++)
        if (node.tagName !== "!") a.push(node);
      return a;
    },

    // IE improperly serializes _countedByPrototype in (inner|outer)HTML.
    unmark: function(nodes) {
      for (var i = 0, node; node = nodes[i]; i++)
        node.removeAttribute('_countedByPrototype');
      return nodes;
    }
  });
}

function $$() {
  return Selector.findChildElements(document, $A(arguments));
}
var Form = {
  reset: function(form) {
    $(form).reset();
    return form;
  },

  serializeElements: function(elements, options) {
    if (typeof options != 'object') options = { hash: !!options };
    else if (Object.isUndefined(options.hash)) options.hash = true;
    var key, value, submitted = false, submit = options.submit;

    var data = elements.inject({ }, function(result, element) {
      if (!element.disabled && element.name) {
        key = element.name; value = $(element).getValue();
        if (value != null && (element.type != 'submit' || (!submitted &&
            submit !== false && (!submit || key == submit) && (submitted = true)))) {
          if (key in result) {
            // a key is already present; construct an array of values
            if (!Object.isArray(result[key])) result[key] = [result[key]];
            result[key].push(value);
          }
          else result[key] = value;
        }
      }
      return result;
    });

    return options.hash ? data : Object.toQueryString(data);
  }
};

Form.Methods = {
  serialize: function(form, options) {
    return Form.serializeElements(Form.getElements(form), options);
  },

  getElements: function(form) {
    return $A($(form).getElementsByTagName('*')).inject([],
      function(elements, child) {
        if (Form.Element.Serializers[child.tagName.toLowerCase()])
          elements.push(Element.extend(child));
        return elements;
      }
    );
  },

  getInputs: function(form, typeName, name) {
    form = $(form);
    var inputs = form.getElementsByTagName('input');

    if (!typeName && !name) return $A(inputs).map(Element.extend);

    for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
      var input = inputs[i];
      if ((typeName && input.type != typeName) || (name && input.name != name))
        continue;
      matchingInputs.push(Element.extend(input));
    }

    return matchingInputs;
  },

  disable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('disable');
    return form;
  },

  enable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('enable');
    return form;
  },

  findFirstElement: function(form) {
    var elements = $(form).getElements().findAll(function(element) {
      return 'hidden' != element.type && !element.disabled;
    });
    var firstByIndex = elements.findAll(function(element) {
      return element.hasAttribute('tabIndex') && element.tabIndex >= 0;
    }).sortBy(function(element) { return element.tabIndex }).first();

    return firstByIndex ? firstByIndex : elements.find(function(element) {
      return ['input', 'select', 'textarea'].include(element.tagName.toLowerCase());
    });
  },

  focusFirstElement: function(form) {
    form = $(form);
    form.findFirstElement().activate();
    return form;
  },

  request: function(form, options) {
    form = $(form), options = Object.clone(options || { });

    var params = options.parameters, action = form.readAttribute('action') || '';
    if (action.blank()) action = window.location.href;
    options.parameters = form.serialize(true);

    if (params) {
      if (Object.isString(params)) params = params.toQueryParams();
      Object.extend(options.parameters, params);
    }

    if (form.hasAttribute('method') && !options.method)
      options.method = form.method;

    return new Ajax.Request(action, options);
  }
};

/*--------------------------------------------------------------------------*/

Form.Element = {
  focus: function(element) {
    $(element).focus();
    return element;
  },

  select: function(element) {
    $(element).select();
    return element;
  }
};

Form.Element.Methods = {
  serialize: function(element) {
    element = $(element);
    if (!element.disabled && element.name) {
      var value = element.getValue();
      if (value != undefined) {
        var pair = { };
        pair[element.name] = value;
        return Object.toQueryString(pair);
      }
    }
    return '';
  },

  getValue: function(element) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    return Form.Element.Serializers[method](element);
  },

  setValue: function(element, value) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    Form.Element.Serializers[method](element, value);
    return element;
  },

  clear: function(element) {
    $(element).value = '';
    return element;
  },

  present: function(element) {
    return $(element).value != '';
  },

  activate: function(element) {
    element = $(element);
    try {
      element.focus();
      if (element.select && (element.tagName.toLowerCase() != 'input' ||
          !['button', 'reset', 'submit'].include(element.type)))
        element.select();
    } catch (e) { }
    return element;
  },

  disable: function(element) {
    element = $(element);
    element.blur();
    element.disabled = true;
    return element;
  },

  enable: function(element) {
    element = $(element);
    element.disabled = false;
    return element;
  }
};

/*--------------------------------------------------------------------------*/

var Field = Form.Element;
var $F = Form.Element.Methods.getValue;

/*--------------------------------------------------------------------------*/

Form.Element.Serializers = {
  input: function(element, value) {
    switch (element.type.toLowerCase()) {
      case 'checkbox':
      case 'radio':
        return Form.Element.Serializers.inputSelector(element, value);
      default:
        return Form.Element.Serializers.textarea(element, value);
    }
  },

  inputSelector: function(element, value) {
    if (Object.isUndefined(value)) return element.checked ? element.value : null;
    else element.checked = !!value;
  },

  textarea: function(element, value) {
    if (Object.isUndefined(value)) return element.value;
    else element.value = value;
  },

  select: function(element, index) {
    if (Object.isUndefined(index))
      return this[element.type == 'select-one' ?
        'selectOne' : 'selectMany'](element);
    else {
      var opt, value, single = !Object.isArray(index);
      for (var i = 0, length = element.length; i < length; i++) {
        opt = element.options[i];
        value = this.optionValue(opt);
        if (single) {
          if (value == index) {
            opt.selected = true;
            return;
          }
        }
        else opt.selected = index.include(value);
      }
    }
  },

  selectOne: function(element) {
    var index = element.selectedIndex;
    return index >= 0 ? this.optionValue(element.options[index]) : null;
  },

  selectMany: function(element) {
    var values, length = element.length;
    if (!length) return null;

    for (var i = 0, values = []; i < length; i++) {
      var opt = element.options[i];
      if (opt.selected) values.push(this.optionValue(opt));
    }
    return values;
  },

  optionValue: function(opt) {
    // extend element because hasAttribute may not be native
    return Element.extend(opt).hasAttribute('value') ? opt.value : opt.text;
  }
};

/*--------------------------------------------------------------------------*/

Abstract.TimedObserver = Class.create(PeriodicalExecuter, {
  initialize: function($super, element, frequency, callback) {
    $super(callback, frequency);
    this.element   = $(element);
    this.lastValue = this.getValue();
  },

  execute: function() {
    var value = this.getValue();
    if (Object.isString(this.lastValue) && Object.isString(value) ?
        this.lastValue != value : String(this.lastValue) != String(value)) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  }
});

Form.Element.Observer = Class.create(Abstract.TimedObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.Observer = Class.create(Abstract.TimedObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});

/*--------------------------------------------------------------------------*/

Abstract.EventObserver = Class.create({
  initialize: function(element, callback) {
    this.element  = $(element);
    this.callback = callback;

    this.lastValue = this.getValue();
    if (this.element.tagName.toLowerCase() == 'form')
      this.registerFormCallbacks();
    else
      this.registerCallback(this.element);
  },

  onElementEvent: function() {
    var value = this.getValue();
    if (this.lastValue != value) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  },

  registerFormCallbacks: function() {
    Form.getElements(this.element).each(this.registerCallback, this);
  },

  registerCallback: function(element) {
    if (element.type) {
      switch (element.type.toLowerCase()) {
        case 'checkbox':
        case 'radio':
          Event.observe(element, 'click', this.onElementEvent.bind(this));
          break;
        default:
          Event.observe(element, 'change', this.onElementEvent.bind(this));
          break;
      }
    }
  }
});

Form.Element.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});
if (!window.Event) var Event = { };

Object.extend(Event, {
  KEY_BACKSPACE: 8,
  KEY_TAB:       9,
  KEY_RETURN:   13,
  KEY_ESC:      27,
  KEY_LEFT:     37,
  KEY_UP:       38,
  KEY_RIGHT:    39,
  KEY_DOWN:     40,
  KEY_DELETE:   46,
  KEY_HOME:     36,
  KEY_END:      35,
  KEY_PAGEUP:   33,
  KEY_PAGEDOWN: 34,
  KEY_INSERT:   45,

  cache: { },

  relatedTarget: function(event) {
    var element;
    switch(event.type) {
      case 'mouseover': element = event.fromElement; break;
      case 'mouseout':  element = event.toElement;   break;
      default: return null;
    }
    return Element.extend(element);
  }
});

Event.Methods = (function() {
  var isButton;

  if (Prototype.Browser.IE) {
    var buttonMap = { 0: 1, 1: 4, 2: 2 };
    isButton = function(event, code) {
      return event.button == buttonMap[code];
    };

  } else if (Prototype.Browser.WebKit) {
    isButton = function(event, code) {
      switch (code) {
        case 0: return event.which == 1 && !event.metaKey;
        case 1: return event.which == 1 && event.metaKey;
        default: return false;
      }
    };

  } else {
    isButton = function(event, code) {
      return event.which ? (event.which === code + 1) : (event.button === code);
    };
  }

  return {
    isLeftClick:   function(event) { return isButton(event, 0) },
    isMiddleClick: function(event) { return isButton(event, 1) },
    isRightClick:  function(event) { return isButton(event, 2) },

    element: function(event) {
      var node = Event.extend(event).target;
      return Element.extend(node.nodeType == Node.TEXT_NODE ? node.parentNode : node);
    },

    findElement: function(event, expression) {
      var element = Event.element(event);
      if (!expression) return element;
      var elements = [element].concat(element.ancestors());
      return Selector.findElement(elements, expression, 0);
    },

    pointer: function(event) {
      return {
        x: event.pageX || (event.clientX +
          (document.documentElement.scrollLeft || document.body.scrollLeft)),
        y: event.pageY || (event.clientY +
          (document.documentElement.scrollTop || document.body.scrollTop))
      };
    },

    pointerX: function(event) { return Event.pointer(event).x },
    pointerY: function(event) { return Event.pointer(event).y },

    stop: function(event) {
      Event.extend(event);
      event.preventDefault();
      event.stopPropagation();
      event.stopped = true;
    }
  };
})();

Event.extend = (function() {
  var methods = Object.keys(Event.Methods).inject({ }, function(m, name) {
    m[name] = Event.Methods[name].methodize();
    return m;
  });

  if (Prototype.Browser.IE) {
    Object.extend(methods, {
      stopPropagation: function() { this.cancelBubble = true },
      preventDefault:  function() { this.returnValue = false },
      inspect: function() { return "[object Event]" }
    });

    return function(event) {
      if (!event) return false;
      if (event._extendedByPrototype) return event;

      event._extendedByPrototype = Prototype.emptyFunction;
      var pointer = Event.pointer(event);
      Object.extend(event, {
        target: event.srcElement,
        relatedTarget: Event.relatedTarget(event),
        pageX:  pointer.x,
        pageY:  pointer.y
      });
      return Object.extend(event, methods);
    };

  } else {
    Event.prototype = Event.prototype || document.createEvent("HTMLEvents").__proto__;
    Object.extend(Event.prototype, methods);
    return Prototype.K;
  }
})();

Object.extend(Event, (function() {
  var cache = Event.cache;

  function getEventID(element) {
    if (element._prototypeEventID) return element._prototypeEventID[0];
    arguments.callee.id = arguments.callee.id || 1;
    return element._prototypeEventID = [++arguments.callee.id];
  }

  function getDOMEventName(eventName) {
    if (eventName && eventName.include(':')) return "dataavailable";
    return eventName;
  }

  function getCacheForID(id) {
    return cache[id] = cache[id] || { };
  }

  function getWrappersForEventName(id, eventName) {
    var c = getCacheForID(id);
    return c[eventName] = c[eventName] || [];
  }

  function createWrapper(element, eventName, handler) {
    var id = getEventID(element);
    var c = getWrappersForEventName(id, eventName);
    if (c.pluck("handler").include(handler)) return false;

    var wrapper = function(event) {
      if (!Event || !Event.extend ||
        (event.eventName && event.eventName != eventName))
          return false;

      Event.extend(event);
      handler.call(element, event);
    };

    wrapper.handler = handler;
    c.push(wrapper);
    return wrapper;
  }

  function findWrapper(id, eventName, handler) {
    var c = getWrappersForEventName(id, eventName);
    return c.find(function(wrapper) { return wrapper.handler == handler });
  }

  function destroyWrapper(id, eventName, handler) {
    var c = getCacheForID(id);
    if (!c[eventName]) return false;
    c[eventName] = c[eventName].without(findWrapper(id, eventName, handler));
  }

  function destroyCache() {
    for (var id in cache)
      for (var eventName in cache[id])
        cache[id][eventName] = null;
  }

  if (window.attachEvent) {
    window.attachEvent("onunload", destroyCache);
  }

  return {
    observe: function(element, eventName, handler) {
      element = $(element);
      var name = getDOMEventName(eventName);

      var wrapper = createWrapper(element, eventName, handler);
      if (!wrapper) return element;

      if (element.addEventListener) {
        element.addEventListener(name, wrapper, false);
      } else {
        element.attachEvent("on" + name, wrapper);
      }

      return element;
    },

    stopObserving: function(element, eventName, handler) {
      element = $(element);
      var id = getEventID(element), name = getDOMEventName(eventName);

      if (!handler && eventName) {
        getWrappersForEventName(id, eventName).each(function(wrapper) {
          element.stopObserving(eventName, wrapper.handler);
        });
        return element;

      } else if (!eventName) {
        Object.keys(getCacheForID(id)).each(function(eventName) {
          element.stopObserving(eventName);
        });
        return element;
      }

      var wrapper = findWrapper(id, eventName, handler);
      if (!wrapper) return element;

      if (element.removeEventListener) {
        element.removeEventListener(name, wrapper, false);
      } else {
        element.detachEvent("on" + name, wrapper);
      }

      destroyWrapper(id, eventName, handler);

      return element;
    },

    fire: function(element, eventName, memo) {
      element = $(element);
      if (element == document && document.createEvent && !element.dispatchEvent)
        element = document.documentElement;

      var event;
      if (document.createEvent) {
        event = document.createEvent("HTMLEvents");
        event.initEvent("dataavailable", true, true);
      } else {
        event = document.createEventObject();
        event.eventType = "ondataavailable";
      }

      event.eventName = eventName;
      event.memo = memo || { };

      if (document.createEvent) {
        element.dispatchEvent(event);
      } else {
        element.fireEvent(event.eventType, event);
      }

      return Event.extend(event);
    }
  };
})());

Object.extend(Event, Event.Methods);

Element.addMethods({
  fire:          Event.fire,
  observe:       Event.observe,
  stopObserving: Event.stopObserving
});

Object.extend(document, {
  fire:          Element.Methods.fire.methodize(),
  observe:       Element.Methods.observe.methodize(),
  stopObserving: Element.Methods.stopObserving.methodize(),
  loaded:        false
});

(function() {
  /* Support for the DOMContentLoaded event is based on work by Dan Webb,
     Matthias Miller, Dean Edwards and John Resig. */

  var timer;

  function fireContentLoadedEvent() {
    if (document.loaded) return;
    if (timer) window.clearInterval(timer);
    document.fire("dom:loaded");
    document.loaded = true;
  }

  if (document.addEventListener) {
    if (Prototype.Browser.WebKit) {
      timer = window.setInterval(function() {
        if (/loaded|complete/.test(document.readyState))
          fireContentLoadedEvent();
      }, 0);

      Event.observe(window, "load", fireContentLoadedEvent);

    } else {
      document.addEventListener("DOMContentLoaded",
        fireContentLoadedEvent, false);
    }

  } else {
    document.write("<script id=__onDOMContentLoaded defer src=//:><\/script>");
    $("__onDOMContentLoaded").onreadystatechange = function() {
      if (this.readyState == "complete") {
        this.onreadystatechange = null;
        fireContentLoadedEvent();
      }
    };
  }
})();
/*------------------------------- DEPRECATED -------------------------------*/

Hash.toQueryString = Object.toQueryString;

var Toggle = { display: Element.toggle };

Element.Methods.childOf = Element.Methods.descendantOf;

var Insertion = {
  Before: function(element, content) {
    return Element.insert(element, {before:content});
  },

  Top: function(element, content) {
    return Element.insert(element, {top:content});
  },

  Bottom: function(element, content) {
    return Element.insert(element, {bottom:content});
  },

  After: function(element, content) {
    return Element.insert(element, {after:content});
  }
};

var $continue = new Error('"throw $continue" is deprecated, use "return" instead');

// This should be moved to script.aculo.us; notice the deprecated methods
// further below, that map to the newer Element methods.
var Position = {
  // set to true if needed, warning: firefox performance problems
  // NOT neeeded for page scrolling, only if draggable contained in
  // scrollable elements
  includeScrollOffsets: false,

  // must be called before calling withinIncludingScrolloffset, every time the
  // page is scrolled
  prepare: function() {
    this.deltaX =  window.pageXOffset
                || document.documentElement.scrollLeft
                || document.body.scrollLeft
                || 0;
    this.deltaY =  window.pageYOffset
                || document.documentElement.scrollTop
                || document.body.scrollTop
                || 0;
  },

  // caches x/y coordinate pair to use with overlap
  within: function(element, x, y) {
    if (this.includeScrollOffsets)
      return this.withinIncludingScrolloffsets(element, x, y);
    this.xcomp = x;
    this.ycomp = y;
    this.offset = Element.cumulativeOffset(element);

    return (y >= this.offset[1] &&
            y <  this.offset[1] + element.offsetHeight &&
            x >= this.offset[0] &&
            x <  this.offset[0] + element.offsetWidth);
  },

  withinIncludingScrolloffsets: function(element, x, y) {
    var offsetcache = Element.cumulativeScrollOffset(element);

    this.xcomp = x + offsetcache[0] - this.deltaX;
    this.ycomp = y + offsetcache[1] - this.deltaY;
    this.offset = Element.cumulativeOffset(element);

    return (this.ycomp >= this.offset[1] &&
            this.ycomp <  this.offset[1] + element.offsetHeight &&
            this.xcomp >= this.offset[0] &&
            this.xcomp <  this.offset[0] + element.offsetWidth);
  },

  // within must be called directly before
  overlap: function(mode, element) {
    if (!mode) return 0;
    if (mode == 'vertical')
      return ((this.offset[1] + element.offsetHeight) - this.ycomp) /
        element.offsetHeight;
    if (mode == 'horizontal')
      return ((this.offset[0] + element.offsetWidth) - this.xcomp) /
        element.offsetWidth;
  },

  // Deprecation layer -- use newer Element methods now (1.5.2).

  cumulativeOffset: Element.Methods.cumulativeOffset,

  positionedOffset: Element.Methods.positionedOffset,

  absolutize: function(element) {
    Position.prepare();
    return Element.absolutize(element);
  },

  relativize: function(element) {
    Position.prepare();
    return Element.relativize(element);
  },

  realOffset: Element.Methods.cumulativeScrollOffset,

  offsetParent: Element.Methods.getOffsetParent,

  page: Element.Methods.viewportOffset,

  clone: function(source, target, options) {
    options = options || { };
    return Element.clonePosition(target, source, options);
  }
};

/*--------------------------------------------------------------------------*/

if (!document.getElementsByClassName) document.getElementsByClassName = function(instanceMethods){
  function iter(name) {
    return name.blank() ? null : "[contains(concat(' ', @class, ' '), ' " + name + " ')]";
  }

  instanceMethods.getElementsByClassName = Prototype.BrowserFeatures.XPath ?
  function(element, className) {
    className = className.toString().strip();
    var cond = /\s/.test(className) ? $w(className).map(iter).join('') : iter(className);
    return cond ? document._getElementsByXPath('.//*' + cond, element) : [];
  } : function(element, className) {
    className = className.toString().strip();
    var elements = [], classNames = (/\s/.test(className) ? $w(className) : null);
    if (!classNames && !className) return elements;

    var nodes = $(element).getElementsByTagName('*');
    className = ' ' + className + ' ';

    for (var i = 0, child, cn; child = nodes[i]; i++) {
      if (child.className && (cn = ' ' + child.className + ' ') && (cn.include(className) ||
          (classNames && classNames.all(function(name) {
            return !name.toString().blank() && cn.include(' ' + name + ' ');
          }))))
        elements.push(Element.extend(child));
    }
    return elements;
  };

  return function(className, parentElement) {
    return $(parentElement || document.body).getElementsByClassName(className);
  };
}(Element.Methods);

/*--------------------------------------------------------------------------*/

Element.ClassNames = Class.create();
Element.ClassNames.prototype = {
  initialize: function(element) {
    this.element = $(element);
  },

  _each: function(iterator) {
    this.element.className.split(/\s+/).select(function(name) {
      return name.length > 0;
    })._each(iterator);
  },

  set: function(className) {
    this.element.className = className;
  },

  add: function(classNameToAdd) {
    if (this.include(classNameToAdd)) return;
    this.set($A(this).concat(classNameToAdd).join(' '));
  },

  remove: function(classNameToRemove) {
    if (!this.include(classNameToRemove)) return;
    this.set($A(this).without(classNameToRemove).join(' '));
  },

  toString: function() {
    return $A(this).join(' ');
  }
};

Object.extend(Element.ClassNames.prototype, Enumerable);

/*--------------------------------------------------------------------------*/

Element.addMethods();



if (Garmin == undefined) var Garmin = {};
/**
 * Copyright &copy; 2007-2010 Garmin Ltd. or its subsidiaries.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * @fileoverview Garmin.Broadcaster is for registering listeners and dispatching call-back metheds.
 * @version 1.8
 */
/** 
 * @class Broadcaster
 * Acts as an event broadcaster.  Code is pretty similar to Ajax.Responders, 
 * but doesn't need to extend Enumerable.  
 * <br><br>
 * To use, register an object, then dispatch methods.<br>
 * var toBeAlerted = new AlertedDude();<br>
 * var broadcaster = new Broadcaster();<br>
 * <br>
 * broadcaster.register(toBeAlerterd);<br>
 * broadcaster.dispatch("alerting");<br>
 * 
 * that will call toBeAlerted.alerting();<br>
 * if you pass an object w/ the dispatch call the object will be passed as well.<br>
 * Most calls are implemented using JSON, with controller as the owning broadcaster
 * object.<br>
 * so ... <br>
 * broadcaster.dispatch("alerting", {message: "howdy", controller: this});<br>
 * toBeAlerted.alerting({message: 'howdy', controller: broadcaster})
 * @constructor 
 */
Garmin.Broadcaster = function(){}; //just here for jsdoc
Garmin.Broadcaster = Class.create();
Garmin.Broadcaster.prototype = {
	initialize: function() {
	    this.responders = new Array();
	},

	/**
     * Register an object to listen for events
     * 
     * @param {Object} responder
     * @member Garmin.Broadcaster
     */
	register: function(responderToAdd) {
	  if (!this.responders.include(responderToAdd))
	    this.responders.push(responderToAdd);
	},

	/**
     * Unregister an object that is listening
     * 
     * @param {Object} responder
     * @member Garmin.Broadcaster
     */
	unregister: function(responderToRemove) {
	  this.responders = this.responders.without(responderToRemove);
	},

	/**
     * Dispatch an event to all listeners
     * 
     * @param {String} callback
     * @param {Object} json
     * @member Garmin.Broadcaster
     */
	dispatch: function(callback, json) {
	  this.responders.each(function(responder) {
	    if (responder[callback] && typeof responder[callback] == 'function') {
	      try {
	        responder[callback].apply(responder, [json]);
	      } catch (e) { alert(e) }
	    }
	  });
	}
};




if (Garmin == undefined) var Garmin = {};
/**
 * @fileoverview BrowserDetect from http://www.quirksmode.org/js/detect.html. Not API.
 */
/**
 * @class BrowserDetect
 * A library for detecting the user's browser and OS
 * Found at http://www.quirksmode.org/js/detect.html
 */
var BrowserDetect = {
	init: function () {
		this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
		this.version = this.searchVersion(navigator.userAgent)
			|| this.searchVersion(navigator.appVersion)
			|| "an unknown version";
		this.OS = this.searchString(this.dataOS) || "an unknown OS";
	},
	searchString: function (data) {
		for (var i=0;i<data.length;i++)	{
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (dataString.indexOf(data[i].subString) != -1)
					return data[i].identity;
			}
			else if (dataProp)
				return data[i].identity;
		}
	},
	searchVersion: function (dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if (index == -1) return;
		return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
	},
	dataBrowser: [
		{ 	string: navigator.userAgent,
			subString: "OmniWeb",
			versionSearch: "OmniWeb/",
			identity: "OmniWeb"
		},
		{
			string: navigator.vendor,
			subString: "Apple",
			identity: "Safari"
		},
		{
			prop: window.opera,
			identity: "Opera"
		},
		{
			string: navigator.vendor,
			subString: "iCab",
			identity: "iCab"
		},
		{
			string: navigator.vendor,
			subString: "KDE",
			identity: "Konqueror"
		},
		{
			string: navigator.userAgent,
			subString: "Firefox",
			identity: "Firefox"
		},
		{
			string: navigator.vendor,
			subString: "Camino",
			identity: "Camino"
		},
		{		// for newer Netscapes (6+)
			string: navigator.userAgent,
			subString: "Netscape",
			identity: "Netscape"
		},
		{
			string: navigator.userAgent,
			subString: "MSIE",
			identity: "Explorer",
			versionSearch: "MSIE"
		},
		{
			string: navigator.userAgent,
			subString: "Gecko",
			identity: "Mozilla",
			versionSearch: "rv"
		},
		{ 		// for older Netscapes (4-)
			string: navigator.userAgent,
			subString: "Mozilla",
			identity: "Netscape",
			versionSearch: "Mozilla"
		}
	],
	dataOS : [
		{
			string: navigator.platform,
			subString: "Win",
			identity: "Windows"
		},
		{
			string: navigator.platform,
			subString: "Mac",
			identity: "Mac"
		},
		{
			string: navigator.platform,
			subString: "Linux",
			identity: "Linux"
		}
	]

};
BrowserDetect.init();




if (Garmin == undefined) var Garmin = {};
/**
 * Copyright &copy; 2007-2010 Garmin Ltd. or its subsidiaries.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * @fileoverview Garmin.DateTimeFormat Utility class for parsing GPX dates and other date support functions.
 * @version 1.8
 */
/**
 * @class Garmin.DateTimeFormat
 * @constructor 
 */
Garmin.DateTimeFormat = function(){}; //just here for jsdoc
Garmin.DateTimeFormat = Class.create();
Garmin.DateTimeFormat.prototype = {

	initialize: function() {
		this.hoursInADay = 24;
	    this.minutesInAnHour = 60;
	    this.secondsInAMinute = 60;
	    this.millisecondsInASecond = 1000;
	    this.millisecondsInADay = this.hoursInADay * this.minutesInAnHour * this.secondsInAMinute * this.millisecondsInASecond;
	    this.millisecondsInAnHour = this.minutesInAnHour * this.secondsInAMinute * this.millisecondsInASecond;
	    this.millisecondsInAMinute = this.secondsInAMinute * this.millisecondsInASecond;

		this.xsdString = "";
		this.date = new Date();
	},

	/**
     * Get the date object associated with this object
     * 
     * @type Date
     * @return The Date object that 
     */
	getDate: function() {
		return this.date;
	},

	/**
     * Based on 2003-01-31T17:42:14.160Z (YYYY-MM-DDTHH:MM:SS.sssZ) date this will set this 
     * objects date after parsing the standard time string
     * 
     * @param {String} xsdDateTime
     * @type Garmin.DateTimeFormat
     * @return This object with the parsed date
     */
	parseXsdDateTime: function(xsdDateTime) {
		this.xsdString = xsdDateTime;
	    var pieces = xsdDateTime.split('T');
	    var datePiece = pieces[0];
	    var timePiece = pieces[1];
	    var offset = 0;
	
		// xsd:dateTime -> [-]CCYY-MM-DDThh:mm:ss[Z|(+|-)hh:mm]
	
	    // tear apart the date
	    var datePieces = datePiece.split('-');
	    
	    // parse the year
	    var year = parseInt(datePieces[0],10);
	    
	    // parsae the month, javascript month is 0-based
	    var month = parseInt(datePieces[1],10) -1;
	    
	    // parse the day
	    var dayOfMonth = parseInt(datePieces[2],10);
	    
	    // find the index in the timepiece where the offset piece begins
	    var offsetIndex;
	    if (timePiece.indexOf('Z') != -1) {
	    	offsetIndex = timePiece.indexOf('Z');
	    } else if (timePiece.indexOf('+') != -1) {
			offsetIndex = timePiece.indexOf('+');
	    } else if (timePiece.indexOf('-') != -1) {
			offsetIndex = timePiece.indexOf('-');
	    } else {
	    	offsetIndex = timePiece.length;
	    }
	    
	    // tear apart the offset piece
		var offsetPieces = timePiece.substring(offsetIndex).split(':');
		var offsetHour = 0;
		var offsetMinute = 0;
		
		// parse the offset hour and offset minute if they exist
		if (offsetPieces.length > 1) {
			offsetHour = parseInt(offsetPieces[0], 10);
			offsetMinute = parseInt(offsetPieces[1], 10); 
		}
		
		// figure out the time zone offset in milliseconds
		var offsetMilliseconds = ((((offsetHour * 60) + offsetMinute) * 60) * 1000);
		
	    // tear apart the time, exclude offset string
	    var timePieces = timePiece.substring(0, offsetIndex).split(':');
	    
	    // parse the hour
	    var hourBase24 = parseInt(timePieces[0],10);
	    
	    // parse the minute
	    var minute = parseInt(timePieces[1],10);
	    
	    // split the second up for milliseconds
	    var secondPieces = timePieces[2].split('.');
	    
	    // parse the second
	    var second = parseInt(secondPieces[0],10);
	    
	    // parse the millisecond
	    var millisecond = 0;
	    if(secondPieces.length > 1) {
	        millisecond = parseInt(secondPieces[1],10);
	    }
	    
	    // create the date object	    
	    var date = new Date();
	    date.setUTCFullYear(year);
	    date.setUTCMonth(month);
	    date.setUTCDate(dayOfMonth);
	    date.setUTCHours(hourBase24);
	    date.setUTCMinutes(minute);
	    date.setUTCSeconds(second);
	    date.setUTCMilliseconds(millisecond);
	    
	    // apply the time zone offset to the date object so its in utc time
		date.setTime(date.getTime() - offsetMilliseconds);
	    
	    this.date = date;
	    return this;
	},

	/**
     * Generate a duration string of the format hh:mm:ss
     * 
     * @param {Number} Number of milliseconds to convert
     * @type String
     * @return String of the format hh:mm:ss built from the number of milliseconds
     */
	formatDuration: function(milliseconds) {
	    var remaining = milliseconds;
	    var result = "";
	    var separator = ':';
	    var units = new Array(this.millisecondsInADay, this.millisecondsInAnHour, this.millisecondsInAMinute, this.millisecondsInASecond);
	    for(var whichUnit = 0; whichUnit < units.length; whichUnit++) {
	        var millisecondsInUnit = units[whichUnit];
	        var totalOfUnit = parseInt(remaining / millisecondsInUnit);
	        if(whichUnit != 0 || totalOfUnit != 0) {
	            if(totalOfUnit < 10)  result += "0";
	            result = result + totalOfUnit.toString();
	            if(whichUnit < units.length-1) result += separator;
	        }
	        remaining = remaining - (totalOfUnit * millisecondsInUnit);
	    }
	    return result;
	},

	/**
     * Get the duration from this date to another date in the future.
     * 
     * @param {Garmin.DateTimeFormat} The end date to get the duration to.
     * @type String
     * @return Duration string (hh:mm:ss)
     */
	getDurationTo: function(endDateTime) {
	    return this.formatDuration(endDateTime.getDate().getTime() - this.getDate().getTime());
	},

	/**
     * getDayOfYear
     * http://www.merlyn.demon.co.uk/js-date0.htm
     */
	getDayOfYear: function() {
	    with (this.getDate()) {
	        var Y = getFullYear(), M = getMonth(), D = getDate();
	    }
	    var K, N;
	    N = (Date.UTC(Y, M, D) - Date.UTC(Y, 0, 0)) / 86400000;
	
	    M++;
	    K = 2 - (Y % 4 == 0);
	    N = Math.floor(275 * M / 9) - K * (M > 2) + D - 30;
	
	    with (this.getDate()) {
	        K = valueOf();
	        setMonth(0);
	        setDate(0);
	        N = Math.round((K - valueOf()) / 86400000);
	    }
		return N;
	},

	/** Formats date.
	 * Uses Garmin.DateTimeFormat.FORMAT.date format string.
	 * @type String
	 * @return Date string of the format mm/dd/yyyy
     */
	getDateString: function() {
		return this.formatDate(true);
	},

	/** Formats timestamp using 12 hour clock.
	 * @type String
	 * @return formatted timestamp
     */
	getTimeString: function() {
		return this.format(Garmin.DateTimeFormat.FORMAT.timestamp12hour, true, true);
	},

	/**
	 * @type String
	 * @return Xsd date string of the format mm/dd/yyyy
     * @member Garmin.DateTimeFormat
     */
	getXsdString: function() {
		return this.xsdString;
	},

	/**
	 * @type String
	 * @return this.date.toString()
     */
	toString: function() {
		return this.date.toString();
	},
	
	/** Format date using Garmin.DateTimeFormat.FORMAT.date template. 
	 * @param {Boolean} if true single digits have a zero inserted on the left
	 * @type String
	 * @return formatted date
	 */
	formatDate: function(leftPad) {
		return this.format(Garmin.DateTimeFormat.FORMAT.date, leftPad);
	},
	
	/** Format time using Garmin.DateTimeFormat.FORMAT.time template. 
	 * @param {Boolean} if true single digits have a zero inserted on the left
	 * @type String
	 * @return formatted time
	 */
	formatTime: function(leftPad) {
		return this.format(Garmin.DateTimeFormat.FORMAT.time, leftPad);
	},
	
	/** Format timestamp using Garmin.DateTimeFormat.FORMAT.timestamp template. 
	 * @param {Boolean} if true single digits have a zero inserted on the left
	 * @type String
	 * @return formatted timestamp
	 */
	formatTimestamp: function(leftPad) {
		return this.format(Garmin.DateTimeFormat.FORMAT.timestamp, leftPad);
	},
	
	/** Applies template to date fields.  
	 * Valid fields are: month, day, year, hour, minute, second, millisecond and meridian (AM or PM)
	 * timezone is also available but is known to be unreliable.
	 * Uses prototype Template object.
	 * @param {String} template which specifies formatting
	 * @param {Boolean} leftPad if true single digits have a zero inserted on the left. Defaults to true.
	 * @param {Boolean} twelveHourClock if true set clock to 12 hour verses 24
	 * @type String
	 * @return formatted date
     */
	format: function(template, leftPad, twelveHourClock) {
		if (leftPad!=false)
			leftPad = true;
		var hours = this.date.getHours();
		var values = {
			meridian: this.date.getHours() >= 12 ? "PM" : "AM",
			month: this.leftPad(this.date.getMonth()+1, leftPad), 
			day: this.leftPad(this.date.getDate(), leftPad), 
			year: this.date.getFullYear(), 
			hour: this.leftPad( (twelveHourClock && hours > 12) ? hours - 12 : hours, leftPad), 
			minute: this.leftPad(this.date.getMinutes(), leftPad), 
			second: this.leftPad(this.date.getSeconds(), leftPad),
			millisecond: this.date.getMilliseconds(),
			timezone: this.date.getTimezoneOffset() / 60
		};
		return new Template(template).evaluate(values);
	},
	
	/** left pad integer if activate is true
	 * @param {Number} integer to left pad
	 * @param {Boolean} activate must be true or no padding is done
	 * @type String
	 */
	leftPad: function(integer, activate) {
		return (activate && integer < 10) ? "0" + integer : "" + integer;
	}
}

/** Internationalization constants for date/time formatting.
 */
Garmin.DateTimeFormat.FORMAT = {
	date: "#{month}/#{day}/#{year}",
	time: "#{hour}:#{minute}:#{second}",
	timestamp: "#{month}/#{day}/#{year} #{hour}:#{minute}:#{second}",
	timestamp12hour: "#{month}/#{day}/#{year} #{hour}:#{minute}:#{second} #{meridian}"
};





if (Garmin == undefined) var Garmin = {};
/** Copyright &copy; 2007-2010 Garmin Ltd. or its subsidiaries.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.

 * @fileoverview PluginDetect from http://developer.apple.com/internet/webcontent/detectplugins.html. Not API.
 * @version 1.8
 */
/** A library for detecting the browser's plugins, by Apple
 * Found at http://developer.apple.com/internet/webcontent/detectplugins.html
 *
 * Modification has been made to the original source.
 * @class PluginDetect
 */
var detectableWithVB = false;
var PluginDetect = {
	
	init: function() {
		// Here we write out the VBScript block for MSIE Windows
		if ((navigator.userAgent.indexOf('MSIE') != -1) 
			&& (navigator.userAgent.indexOf('Win') != -1)) {
		    document.writeln('<script language="VBscript">');
		
		    document.writeln('\'do a one-time test for a version of VBScript that can handle this code');
		    document.writeln('detectableWithVB = False');
		    document.writeln('If ScriptEngineMajorVersion >= 2 then');
		    document.writeln('  detectableWithVB = True');
		    document.writeln('End If');
		
		    document.writeln('\'this next function will detect most plugins');
		    document.writeln('Function detectActiveXControl(activeXControlName)');
		    document.writeln('  on error resume next');
		    document.writeln('  detectActiveXControl = False');
		    document.writeln('  If detectableWithVB Then');
		    document.writeln('     detectActiveXControl = IsObject(CreateObject(activeXControlName))');
		    document.writeln('  End If');
		    document.writeln('End Function');
		
		    document.writeln('</script>');
		}
	},
	
	canDetectPlugins: function() {
	    if( detectableWithVB || (navigator.plugins && navigator.plugins.length > 0) ) {
			return true;
	    } else {
			return false;
	    }			
	},
	
	detectFlash: function() {
	    var pluginFound = PluginDetect.detectPlugin('Shockwave','Flash'); 
	    // if not found, try to detect with VisualBasic
	    if(!pluginFound && detectableWithVB) {
			pluginFound = detectActiveXControl('ShockwaveFlash.ShockwaveFlash.1');
	    }
	    // check for redirection
	    return pluginFound;
	},
	
	detectGarminCommunicatorPlugin: function() {
	    var pluginFound = PluginDetect.detectPlugin('Garmin Communicator');
	    // if not found, try to detect with VisualBasic
	    if(!pluginFound && detectableWithVB) {
			pluginFound = detectActiveXControl('GARMINAXCONTROL.GarminAxControl_t.1');
	    }
	    return pluginFound;		
	},
	
	detectPlugin: function() {
	    // allow for multiple checks in a single pass
	    var daPlugins = PluginDetect.detectPlugin.arguments;
	    // consider pluginFound to be false until proven true
	    var pluginFound = false;
	    // if plugins array is there and not fake
	    if (navigator.plugins && navigator.plugins.length > 0) {
			var pluginsArrayLength = navigator.plugins.length;
			// for each plugin...
			for (pluginsArrayCounter=0; pluginsArrayCounter < pluginsArrayLength; pluginsArrayCounter++ ) {
			    // loop through all desired names and check each against the current plugin name
			    var numFound = 0;
			    for(namesCounter=0; namesCounter < daPlugins.length; namesCounter++) {
				// if desired plugin name is found in either plugin name or description
					if( (navigator.plugins[pluginsArrayCounter].name.indexOf(daPlugins[namesCounter]) >= 0) || 
					    (navigator.plugins[pluginsArrayCounter].description.indexOf(daPlugins[namesCounter]) >= 0) ) {
					    // this name was found
					    numFound++;
					}   
			    }
			    // now that we have checked all the required names against this one plugin,
			    // if the number we found matches the total number provided then we were successful
			    if(numFound == daPlugins.length) {
					pluginFound = true;
					// if we've found the plugin, we can stop looking through at the rest of the plugins
					break;
			    }
			}
	    }
	    return pluginFound;		
	}
}

PluginDetect.init();




if (Garmin == undefined) var Garmin = {};
/**
 * Copyright &copy; 2007-2010 Garmin Ltd. or its subsidiaries.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * @fileoverview Garmin.XmlConverter A class for converting between xml strings and DOM objects.
 * @version 1.8
 */
/**
 * @class Garmin.XmlConverter
 * Convert XML text to a DOM and back.
 * @constructor 
 */
Garmin.XmlConverter = function(){}; //just here for jsdoc
Garmin.XmlConverter = {
    /**
     * Returns an xml document based on the string passed in
     * @param {String} fromString is the xml string to convert
     * @returns {Document}
     * @member Garmin.XmlConverter
     */
    toDocument: function(fromString) {
        return Try.these(
            function() {
    		    var theDocument = new ActiveXObject("Microsoft.XMLDOM");
    		    theDocument.async = "false";
    		    theDocument.loadXML( fromString );
    		    return theDocument;
            },
            function() {
    		    return new DOMParser().parseFromString(fromString, "text/xml");
            }
        );        
    },
    
    /**
     * Converts a document to a string, and then returns the string
     * @param {Document} fromDocument is the DOM Object to convert
     * @returns {String}
     * @member Garmin.XmlConverter
     */  
    toString: function(fromDocument) {
		if( window.ActiveXObject ) {
			return fromDocument.xml
		}
		else {
			var theXmlSerializer = new XMLSerializer();
			return theXmlSerializer.serializeToString( fromDocument );
		}
    }
};




/**
 * Copyright &copy; 2007-2010 Garmin Ltd. or its subsidiaries.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * @fileoverview Generate and insert the object tag
 * only when the browser reports that the plugin is installed.
 * @version 1.8
 */

/**
 * This snippet of code is required to generate the object tag
 * only when the browser reports that the plugin is installed.
 * 
 * @requires PluginDetect, BrowserDetect
 */
if (PluginDetect.detectGarminCommunicatorPlugin()) {
	
	// Insert object tag based on browser
	switch(BrowserDetect.browser) {
	    // TODO pull these out into constants later, in BrowserDetect
	    case "Explorer":
            document.write('<object id="GarminActiveXControl" style="WIDTH: 0px; HEIGHT: 0px; visible: hidden" height="0" width="0" classid="CLSID:099B5A62-DE20-48C6-BF9E-290A9D1D8CB5">&#160;</object>');
            break;
	    case "Firefox":
	    case "Mozilla":
	    case "Safari":
        	// Outer div necessary for Safari and Chrome
        	// TODO try removing the divs to see if Safari 3+ has fixed their bug  
        	document.write('<div style="height:0px; width:0px;">');
        	document.write('<object id="GarminNetscapePlugin" type="application/vnd-garmin.mygarmin" width="0" height="0">&#160;</object>');
        	document.write('</div>');
            break;
	    default:
        	document.write('<div style="height:0px; width:0px;"><object id="GarminActiveXControl" style="WIDTH: 0px; HEIGHT: 0px; visible: hidden" height="0" width="0" classid="CLSID:099B5A62-DE20-48C6-BF9E-290A9D1D8CB5">');
        	document.write('	<object id="GarminNetscapePlugin" type="application/vnd-garmin.mygarmin" width="0" height="0">&#160;</object>');
        	document.write('</object></div>');
        	break;
	}
	
}




if (Garmin == undefined) var Garmin = {};
/**
 * Copyright &copy; 2007-2010 Garmin Ltd. or its subsidiaries.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * @fileoverview Garmin.Device A place-holder for Garmin device information. <br/>
 * Source: 
 * <a href="http://developer.garmin.com/web/communicator-api/garmin/device/GarminDevice.js">Hosted Distribution</a> &nbsp;
 * <a href="https://svn.garmindeveloper.com/web/trunk/communicator/communicator-api/src/main/webapp/garmin/device/GarminDevice.js">Source Control</a><br/>
 * @version 1.8
 */
 
/** Plugin-specific utility functions.
 *
 * @class Garmin.PluginUtils
 * @constructor 
 */
Garmin.PluginUtils = function(){}; //just here for jsdoc
Garmin.PluginUtils = {
//Garmin.PluginUtils.prototype = {

	initialize: function() {
	},
	
	/** Parse device xml string into device objects.  
	 * 
	 * Each device object contains the following:
	 * 1) device display name
	 * 2) device number
	 * 3) device XML as an XML document
	 *
	 * 
	 * @param garminPlugin - the GarminDevicePlugin object having access to the device XML data.
	 * @param getDetailedDeviceData - boolean indicating if you want to get the entire device XML 
	 *  as an XML document (rather than the few essentials)
	 * @returns {Array} an array of {@link Garmin.Device} objects
	 */ 
	parseDeviceXml: function(garminPlugin, getDetailedDeviceData) {
        var xmlDevicesString = garminPlugin.getDevicesXml();
        var xmlDevicesDoc = Garmin.XmlConverter.toDocument(xmlDevicesString); 
        
        var deviceList = xmlDevicesDoc.getElementsByTagName("Device");
        var devices = new Array();
        var numDevices = deviceList.length;
        
    	for( var i=0; i < numDevices; i++ ) {
			var displayName = deviceList[i].getAttribute("DisplayName");        		
    		var deviceNumber = parseInt( deviceList[i].getAttribute("Number") );
    		var deviceDescriptionDoc = null;
    		if (getDetailedDeviceData) {
				var deviceDescriptionXml = garminPlugin.getDeviceDescriptionXml(deviceNumber);
				deviceDescriptionDoc = Garmin.XmlConverter.toDocument(deviceDescriptionXml);    
    		}
    		var theDevice = Garmin.PluginUtils._createDeviceFromXml(displayName, deviceNumber, deviceDescriptionDoc);
    		theDevice.setIsFileBased(garminPlugin.isDeviceFileBased(deviceNumber));
    		devices.push(theDevice);
    	}
    	return devices;
	},
	
	/** Create a Garmin.Device instance for each connected device found.
	 * @private
	 */
	_createDeviceFromXml: function(displayName, deviceNumber, deviceDescriptionDoc) {
   		var device = new Garmin.Device(displayName, deviceNumber);

   		if(deviceDescriptionDoc) {						
			var partNumber = deviceDescriptionDoc.getElementsByTagName("PartNumber")[0].childNodes[0].nodeValue;
			var softwareVersion = deviceDescriptionDoc.getElementsByTagName("SoftwareVersion")[0].childNodes[0].nodeValue;
			var description = deviceDescriptionDoc.getElementsByTagName("Description")[0].childNodes[0].nodeValue;
			var id = deviceDescriptionDoc.getElementsByTagName("Id")[0].childNodes[0].nodeValue;
			
			device.setPartNumber(partNumber);
			device.setSoftwareVersion(softwareVersion);
			device.setDescription(description);
			device.setId(id);
			
			var dataTypeList = deviceDescriptionDoc.getElementsByTagName("MassStorageMode")[0].getElementsByTagName("DataType");
			var numOfDataTypes = dataTypeList.length;
	
			for ( var j = 0; j < numOfDataTypes; j++ ) {
				var dataName = dataTypeList[j].getElementsByTagName("Name")[0].childNodes[0].nodeValue;					
				var dataExt = dataTypeList[j].getElementsByTagName("FileExtension")[0].childNodes[0].nodeValue;
				
				var dataType = new Garmin.DeviceDataType(dataName, dataExt);
				var fileList = dataTypeList[j].getElementsByTagName("File");
				
				var numOfFiles = fileList.length;
				
				for ( var k = 0; k < numOfFiles; k++ ) {
					// Path is an optional element in the schema
					var pathList = fileList[k].getElementsByTagName("Path");
					var transferDir = fileList[k].getElementsByTagName("TransferDirection")[0].childNodes[0].nodeValue;											
					
					if ((transferDir == Garmin.DeviceControl.TRANSFER_DIRECTIONS.read)) {
						dataType.setReadAccess(true);
						
						if (pathList.length > 0) {
						    var filePath = pathList[0].childNodes[0].nodeValue;
						    dataType.setReadFilePath(filePath);							
						}
					} else if ((transferDir == Garmin.DeviceControl.TRANSFER_DIRECTIONS.write)) {			
						dataType.setWriteAccess(true);
						
						if (pathList.length > 0) {
                            var filePath = pathList[0].childNodes[0].nodeValue;
                            dataType.setWriteFilePath(filePath);                         
                        }
					} else if ((transferDir == Garmin.DeviceControl.TRANSFER_DIRECTIONS.both)) {		
						dataType.setReadAccess(true);
						dataType.setWriteAccess(true);
						
						if (pathList.length > 0) {
                            var filePath = pathList[0].childNodes[0].nodeValue;
                            dataType.setReadFilePath(filePath);
                            dataType.setWriteFilePath(filePath);                         
                        }
					}

                    // Deprecated! Need to be removed at some point.
					if( pathList.length > 0) {
						var filePath = pathList[0].childNodes[0].nodeValue;
						dataType.setFilePath(filePath);
					}
					
					// Identifier is optional
					var identifierList = fileList[k].getElementsByTagName("Identifier");
					if( identifierList.length > 0) {
						var identifier = identifierList[0].childNodes[0].nodeValue;
						dataType.setIdentifier(identifier);
					}
				}			
				device.addDeviceDataType(dataType);
			}   			
   		}
		return device;
	},
	
	/** Is this a device XML error message.
	 * @param {String} xml string or Error instance with embedded xml
	 * @type Boolean
	 * @return true if error is device-generared error
	 */
	isDeviceErrorXml: function(error) {
		var msg = (typeof(error)=="string") ? error : error.name + ": " + error.message;
		return ( (msg.indexOf("<ErrorReport") > 0) );
	},
	
	/** Best effort to convert XML error message to a String.
	 * @param {String} xml string or Error instance with embedded xml
	 * @type String
	 * @return Human readable interpretation of XML message
	 */
	getDeviceErrorMessage: function(error) {
		var msg = (typeof(error)=="string") ? error : error.name + ": " + error.message;
		var startPos = msg.indexOf("<ErrorReport");
		if (startPos>0) { //strip off any text surrounding the xml
			var endPos = msg.indexOf("</ErrorReport>") + "</ErrorReport>".length;
			msg = msg.substring(startPos, endPos);
		}
        var xmlDoc = Garmin.XmlConverter.toDocument(msg); 
        var errorMessage = Garmin.PluginUtils._getElementValue(xmlDoc, "Extra");
        var sourceFileName = Garmin.PluginUtils._getElementValue(xmlDoc, "SourceFileName");
        var sourceFileLine = Garmin.PluginUtils._getElementValue(xmlDoc, "SourceFileLine");
        var msg = "";
        if (errorMessage) {
        	msg = errorMessage;
        } else { // gota show something :-(
        	msg = "Plugin error: ";
	        if (sourceFileName)
	        	msg += "source: "+sourceFileName;
	        if (sourceFileLine)
	        	msg += ", line: "+sourceFileLine;
        }
		return msg;
	},

	/** Get the value of a document element
	 * @param doc - the document that the element is contained in
	 * @param elementName - the name of the element to get the value from
	 * @return the value of the element identified by elementName 
	 */	
	_getElementValue: function(doc, elementName) {
        var elementNameNodes = doc.getElementsByTagName(elementName);
        var value = (elementNameNodes && elementNameNodes.length>0) ? elementNameNodes[0].childNodes[0].nodeValue : null;
 		return value;		
	}
};


/** GPI XML generation utility.
 *
 * @class Garmin.PluginUtils
 * @constructor 
 **/
Garmin.GpiUtil = function(){};
Garmin.GpiUtil = {
	
	/** Build a single DeviceDownload XML for multiple file downloads.  
	 * 
	 * @param descriptionArray - Even sized array with matching source and destination pairs.
	 * @param regionId - Optional parameter designating RegionId attribute of File.  For now, this single
	 * regionId will be applied to all files in the descriptionArray if provided at all.    
	 * 
	 */
	buildMultipleDeviceDownloadsXML: function(descriptionArray) {
		if(descriptionArray.length % 2 != 0) {
			throw new Error("buildMultipleDeviceDownloadsXML expects even sized array with matching source and destination pairs");
		}
		var xml =
		'<?xml version="1.0" encoding="UTF-8"?>\n' +
		'<DeviceDownload xmlns="http://www.garmin.com/xmlschemas/PluginAPI/v1"\n' +
		' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
		' xsi:schemaLocation="http://www.garmin.com/xmlschemas/PluginAPI/v1 http://www.garmin.com/xmlschemas/GarminPluginAPIV1.xsd">\n';

		for(var i=0;i<descriptionArray.length;i+=2) {
			var source = descriptionArray[i];
			var destination = descriptionArray[i+1];
		
//			if(!Garmin.GpiUtil.isDestinationValid(destinationArray[i])) {
//				throw new Error("Destination filename contains invalid characters: [" + destinationArray[i] + "]");
//			}
			xml += ' <File Source="'+source+'" Destination="'+destination+'" RegionId="46" />\n';
		}
		xml += '</DeviceDownload>';
		return xml;
	},
	
	buildDeviceDownloadXML: function(source, destination) {
		return Garmin.GpiUtil.buildMultipleDeviceDownloadsXML([source, destination]);
	},
	
	isDestinationValid: function(destination) {
		var splitPath = destination.split("/");
		var filename = splitPath[splitPath.length-1];

		var lengthBefore = filename.length;
		
		var stringAfter = Garmin.GpiUtil.cleanUpFilename(filename);
		
		return(lengthBefore == stringAfter.length);
	},
	
	cleanUpFilename: function(filename) {
		var result = filename;

		var replacement = "";						// see http://www.asciitable.com/
		result = result.stripTags();
		result = result.replace(/&amp;/, replacement);
		result = result.replace(/[\x21-\x2F]/g, replacement); 	// using range "!" through "/"
		result = result.replace(/[\x5B-\x60]/g, replacement);	// using range "[" through "`"
		result = result.replace(/[\x3A-\x40]/g, replacement);	// using range ":" through "@"
		result = result.strip();
		
		return result;
	}
};




if (Garmin == undefined) var Garmin = {};
/** Copyright &copy; 2007-2010 Garmin Ltd. or its subsidiaries.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * @fileoverview Garmin.Device A place-holder for Garmin device information. <br/>
 * Source: 
 * <a href="http://developer.garmin.com/web/communicator-api/garmin/device/GarminDevice.js">Hosted Distribution</a> &nbsp;
 * <a href="https://svn.garmindeveloper.com/web/trunk/communicator/communicator-api/src/main/webapp/garmin/device/GarminDevice.js">Source Control</a><br/>
 * @version 1.8
 */
/** A place-holder for Garmin device information.
 * @class Garmin.Device
 *
 * @constructor 
 * @param {String} displayName for the device
 * @param {Number} number of the model
 */
Garmin.Device = function(displayName, number){}; //just here for jsdoc
Garmin.Device = Class.create();
Garmin.Device.prototype = {

	initialize: function(displayName, number) {
	    this.displayName = displayName;
	    this.number = number;
	    
	    this.partNumber = null;
	    this.softwareVersion = null;
	    this.description = null;
	    this.id = null;
	    this.fileBased = false;
	    this.dataTypes = new Hash({});
	},
	
	/** The display name of this device.
	 * @type String
	 * @return display name
	 * @member Garmin.Device
	 */
	getDisplayName: function() {
		return this.displayName;
	},
	
	/** The device number that the plug-in uses to identify this device
	 * @type Number
	 * @return device number
	 */
	getNumber: function() {
		return this.number;
	},
	
	/** Set part number of device
	 * @param {String} part number
	 */
	setPartNumber: function(partNumber) {
		this.partNumber = partNumber;
	},

	/** The part number of the device
	 * @type String
	 * @return The part number of the device
	 */
	getPartNumber: function() {
		return this.partNumber;
	},

	/** Software version installed on device
	 * @param {String} Garmin.Device
	 */
	setSoftwareVersion: function(softwareVersion) {
		this.softwareVersion = softwareVersion;
	},

	/** The software version currently on the device
	 * @type String
	 * @return software version
	 */
	getSoftwareVersion: function() {
		return this.softwareVersion;
	},

	/** Set description of the device
	 * @param {String} device description
	 */
	setDescription: function(description) {
		this.description = description;
	},

	/** A description of the device.  This usually represents the model name of the device
	 * and includes the software version, i.e. "Forerunner 405  Jun 27 2008 2.17"
	 * In the GarminDevice XML, this is Model > Description.
	 * @type String
	 * @return device description
	 */
	getDescription: function() {
		return this.description;
	},

	/** set device id
	 * @param {String} device id
	 */
	setId: function(id) {
		this.id = id;
	},

	/** The device id
	 * @type String
	 * @return The device id
	 */
	getId: function() {
		return this.id;
	},
	
	/** Adds a data type to the list of data types supported by this device
	 * @param dataType A DeviceDataType object containing information about the data type being added
	 */
	addDeviceDataType: function(dataType) {
		var newDataType = new Hash();
		newDataType.set(dataType.getTypeName(), dataType);
		this.dataTypes.update(newDataType);	
	},

	/** Returns a specific DeviceDataType object
	 * @type Garmin.DeviceDataType
	 * @return The DeviceDataType object containing the specified extension
	 * @param extension The file extension of the data type you are trying to get
	 */	
	getDeviceDataType: function(extension) {
	    return this.dataTypes.get(extension);
	},

	/** Returns a hash containing all DeviceDataType objects
	 * @type Hash
	 * @return all DeviceDataType objects
	 */	
	getDeviceDataTypes: function() {
		return this.dataTypes;
	},

	/**	Returns true if the device has read support for the file type
	 * @param {String} extension The extension of the file type you are checking for support
	 * @type Boolean
	 * @return read support for the file type
	 */	
	supportDeviceDataTypeRead: function(extension) {
		var dataType = this.getDeviceDataType(extension);
		if (dataType != null && dataType.hasReadAccess()) {
			return true;
		} else {
			return false;
		}	
	},
	
	/** Check if device has write support for the file type.
	 * @param {String} extension The extension of the file type you are checking for support
	 * @type Boolean
	 * @return True if write support 
	 */		
	supportDeviceDataTypeWrite: function(extension) {
		var dataType = this.getDeviceDataType(extension);
		if (dataType != null && dataType.hasWriteAccess()) {
			return true;
		} else {
			return false;
		}			
	},

	/**
	 * Set if device is a File-based device.
     * @param {Boolean} set if device is file based
     */
	setIsFileBased: function(aBool) {
	   this.fileBased = aBool;	
	},

	/**
	 * Check if device is a File-based device.<br\>
	 * Will return false for all devices on plug-in versions prior to 2.8.1.0 <br\>
	 * @see Garmin.DevicePlugin#isDeviceFileBased
     * @returns {Boolean} true if device is file based
     */
	isFileBased: function() {
	   return this.fileBased;	
	},
	
	toString: function() {
		return "Device["+this.getDisplayName()+", "+this.getDescription()+", "+this.getNumber()+"]";
	}
	
};

/** A place-holder for Garmin Device Data Type information
 * @class Garmin.DeviceDataType
 *
 * @constructor 
 * @param {String} typeName for the data type
 * @param {String} extension file extension for the data type
 */
Garmin.DeviceDataType = function(typeName, fileExtension){}; //just here for jsdoc
Garmin.DeviceDataType = Class.create();
Garmin.DeviceDataType.prototype = {
	
	initialize: function(typeName, fileExtension) {
		this.typeName = typeName;
		this.fileExtension = fileExtension;
		this.readAccess = false;
		this.writeAccess = false;
		this.filePath = null;
		this.readFilePath = null;
		this.writeFilePath = null;
		this.identifier = null;
	},
	
	/**
	 * @type String
	 * @return The type name of this data type
	 */
	getTypeName: function() {
		return this.typeName;
	},
	
	/** 
	 * @deprecated
	 * @type String
	 * @return The type/display name of this data type
	 */
	getDisplayName: function() {
		return this.getTypeName();
	},
	
	/**
	 * @type String
	 * @return The file extension of this data type
	 */
	getFileExtension: function() {
		return this.fileExtension;
	},
	
	/**
	 * @type String
	 * @return The file path for this data type
	 */
	getFilePath: function() {
		return this.filePath;
	},
	
	/**
	 * @param filePath - the filepath for this datatype
	 */
	setFilePath: function(filePath) {
		this.filePath = filePath;
	},
	
	/**
     * @param readFilePath - the readFilePath for this datatype
     */
	getReadFilePath: function() {
	   return this.readFilePath;	
	},
	
	/**
	 * @type String
     * @return The read file path for this data type
     */
	setReadFilePath: function(readFilePath) {
		this.readFilePath = readFilePath;
	},
	
	/**
     * @param writeFilePath - the readFilePath for this datatype
     */
    getWriteFilePath: function() {
       return this.writeFilePath;    
    },
    
    /**
     * @type String
     * @return The write file path for this data type
     */
    setWriteFilePath: function(writeFilePath) {
        this.writeFilePath = writeFilePath;
    },
	
	/**
	 * @type String
	 * @return The identifier for this data type
	 */
	getIdentifier: function() {
		return this.identifier;
	},
	
	/**
	 * @param identifier- the identifier for this datatype
	 */
	setIdentifier: function(identifier) {
		this.identifier = identifier;
	},
	
	/**
	 * @param readAccess True == has read access
	 */
	setReadAccess: function(readAccess) {
		this.readAccess = readAccess;
	},
	
	/** Returns value indicating if the device supports read access for this file type
	 * @type Boolean
	 * @return supports read access for this file type
	 */
	hasReadAccess: function() {
		return this.readAccess;
	},
	
	/**
	 * @param {Boolean} has write access
	 */	
	setWriteAccess: function(writeAccess) {
		this.writeAccess = writeAccess;
	},
	
	/** return the value indicating if the device supports write access for this file type
	 * @type Boolean
	 * @return supports write access for this file type
	 */
	hasWriteAccess: function() {
		return this.writeAccess;
	}	
};




if(Garmin == undefined){
    /**
    *@namespace Garmin The Garmin namespace object.
    */
    var Garmin = {};
}
/** Copyright &copy; 2007-2010 Garmin Ltd. or its subsidiaries.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * @fileoverview GarminDevicePlugin wraps the Garmin ActiveX/Netscape plugin that should be installed on your machine inorder to talk to a Garmin Gps Device.
 * The plugin is available for download from http://www8.garmin.com/support/download_details.jsp?id=3608
 * More information is available about this plugin from http://www8.garmin.com/products/communicator/
 * @version 1.8
 */

/** This api provides a set of functions to accomplish the following tasks with a Gps Device:
 * <br/>
 * <br/>  1) Unlocking devices allowing them to be found and accessed.
 * <br/>  2) Finding avaliable devices plugged into this machine.
 * <br/>  3) Reading from the device.
 * <br/>  4) Writing gpx files to the device.
 * <br/>  5) Downloading data to the device.
 * <br/>  6) Geting messages, getting transfer status/progress and version information from the device.
 * <br/><br/>
 * Note that the GarminPluginAPIV1.xsd is referenced throughout this API. Please find more information about the GarminPluginAPIV1.xsd from http://
 *  
 * @class
 * requires Prototype
 * @param pluginElement element that references the Garmin GPS Control Web Plugin that should be installed.
 * 
 * constructor 
 * @return a new GarminDevicePlugin
 **/
Garmin.DevicePlugin = function(pluginElement){};  //just here for jsdoc
Garmin.DevicePlugin = Class.create();
Garmin.DevicePlugin.prototype = {

    /** Constructor.
     * @private
     */
	initialize: function(pluginElement) {        
	    this.plugin = pluginElement;
	    this.unlocked = false;
	    //console.debug("DevicePlugin constructor supportsFitnessWrite="+this.supportsFitnessWrite)
	},
	
	/** Unlocks the GpsControl object to be used at the given web address.  
     * More than one set of path-key pairs my be passed in, for example:
     * ['http://myDomain.com/', 'xxx','http://www.myDomain.com/', 'yyy']
     * See documentation site for more info on getting a key. <br/>
     * <br/>
     * Minimum plugin version 2.0.0.4
     * 
     * @param pathKeyPairsArray {Array}- baseURL and key pairs.  
     * @type Boolean
     * @return true if successfully unlocked or undefined otherwise
     */
	unlock: function(pathKeyPairsArray) {
	    var len = pathKeyPairsArray ? pathKeyPairsArray.length / 2 : 0;
	    for(var i=0;i<len;i++) {
	    	if (this.plugin.Unlock(pathKeyPairsArray[i*2], pathKeyPairsArray[i*2+1])){
	    		this.unlocked = true;
	    		return this.unlocked;
	    	}
	    }
	    
	    // Unlock codes for local development
	    this.tryUnlock = this.plugin.Unlock("file:///","cb1492ae040612408d87cc53e3f7ff3c")
        	|| this.plugin.Unlock("http://localhost","45517b532362fc3149e4211ade14c9b2")
        	|| this.plugin.Unlock("http://127.0.0.1","40cd4860f7988c53b15b8491693de133");
        
        this.unlocked = !this.plugin.Locked;
        	
	    return this.unlocked;
	},
	
	/** Returns true if the plug-in is unlocked.
	 */
	isUnlocked: function() {
		return this.unlocked;
	},
	
	/**
	* Check to see if plugin supports this function.  We are having to pass in the string due
	* to IE evaluating the function when passed in as a parameter.
	*
	* @param pluginFunctionName {String} - name of the plugin function.
	* @return true - if function is available in the plugin.  False otherwise.
	*/
	_getPluginFunctionExists: function(pluginFunctionName) {
		var pluginFunction = "this.plugin." + pluginFunctionName;
		
	    try {
		    if( typeof eval(pluginFunction) == "function" ) {
		        return true;
		    }
		    else if(eval(pluginFunction)) {
		        return true;
		    }
		    else {
		        return false;
		    }
		}
		catch( e ) {
		    // For a supported function Internet Explorer says type is undefined but
		    // throws when the call is made.
		    return true;
    	}
	},

	/**
	* Check to see if plugin supports this field.
	*
	* @param pluginField {String} - name of the plugin field.
	* @return true - if the field is available in the plugin.  False otherwise.
	*/
	_getPluginFieldExists: function(pluginField) {
	    try {
		    if( typeof pluginField == "string" ) {
		        return true;
		    }
		    else if( pluginField ) {
		        return true;
		    }
		    else {
		        return false;
		    }
		}
		catch( e ) {
		    // For a supported function Internet Explorer says type is undefined but
		    // throws when the call is made.
		    return true;
    	}
	},
	
	/** Lazy-logic accessor to fitness write support var.
	 * This is used to detect whether the user's installed plugin supports fitness writing.
	 * Fitness writing capability has a minimum requirement of plugin version 2.2.0.1.
	 * This should NOT be called until the plug-in has been unlocked.
	 */
	getSupportsFitnessWrite: function() {
	    return this._getPluginFunctionExists("StartWriteFitnessData"); 
	},
	
	/** Lazy-logic accessor to fitness write support var.
	 * This is used to detect whether the user's installed plugin supports fitness directory reading,
	 * which has a minimum requirement of plugin version 2.2.0.2.
	 * This should NOT be called until the plug-in has been unlocked.
	 */
	getSupportsFitnessDirectoryRead: function() {	
		return this._getPluginFunctionExists("StartReadFitnessDirectory");
	},

	/** Lazy-logic accessor to FIT read support var.
	 * This is used to detect whether the user's installed plugin supports FIT directory reading,
	 * which has a minimum requirement of plugin version 2.8.1.0.
	 * This should NOT be called until the plug-in has been unlocked.
	 */
	getSupportsFitDirectoryRead: function() {		
        return this._getPluginFunctionExists("StartReadFITDirectory");
	},
	
	/** Lazy-logic accessor to fitness read compressed support var.
	 * This is used to detect whether the user's installed plugin supports fitness reading in compressed format,
	 * which has a minimum requirement of plugin version 2.2.0.2.
	 * This should NOT be called until the plug-in has been unlocked.
	 */
	getSupportsFitnessReadCompressed: function() {
	    return this._getPluginFieldExists(this.plugin.TcdXmlz);
	},
	
	/** This is used to detect whether the user's installed plugin supports readable file listing.
	 * Readable file listing has a minimum requirement of plugin version 2.8.1.0.
	 * This should NOT be called until the plug-in has been unlocked.
	 */
	getSupportsReadableFileListing: function() {		
        return this._getPluginFunctionExists("StartReadableFileListing");
	},

	/** Initiates a find Gps devices action on the plugin. 
	 * Poll with finishFindDevices to determine when the plugin has completed this action.
	 * Use getDeviceXmlString to inspect xml contents for and array of Device nodes.<br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * 
	 * @see #finishFindDevices
	 * @see #cancelFindDevices
	 */
	startFindDevices: function() {
		this.plugin.StartFindDevices();
	},

	/** Cancels the current find devices interaction. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * 
	 * @see #startFindDevices
	 * @see #finishFindDevices
	 */
	cancelFindDevices: function() {
        this.plugin.CancelFindDevices();
	},

	/** Poll - with this function to determine completion of startFindDevices. Used after 
	 * the call to startFindDevices(). <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * 
	 * @type Boolean
	 * @return Returns true if completed finding devices otherwise false.
	 * @see #startFindDevices
	 * @see #cancelFindDevices
	 */
	finishFindDevices: function() {
    	return this.plugin.FinishFindDevices();
	},
	
	/** Returns information about the number of devices connected to this machine as 
	 * well as the names of those devices.  Refer to the 
	 * <a href="http://developer.garmin.com/schemas/device/v2/xmlspy/index.html#Link04DDFE88">Devices_t</a>
	 * element in the Device XML schema for what is included.
	 * The xml returned should contain a 'Device' element with 'DisplayName' and 'Number'
	 * if there is a device actually connected. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * 
	 * @type String
	 * @return Xml string with detailed device info
	 * @see #getDeviceDescriptionXml
	 */
	getDevicesXml: function(){
		return this.plugin.DevicesXmlString();
	},

	/** Returns information about the specified Device indicated by the device Number. 
	 * See the getDevicesXml function to get the actual deviceNumber assigned.
	 * Refer to the 
	 * <a href="http://developer.garmin.com/schemas/device/v2/xmlspy/index.html#Link04DDFE88">Devices_t</a>
	 * element in the Device XML schema for what is included in the XML. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * 
	 * @param deviceNumber {Number} Assigned by the plugin, see getDevicesXml for 
	 * assignment of that number.
	 * @type String
	 * @return Xml string with detailed device info
	 * @see #getDevicesXml
	 */
	getDeviceDescriptionXml: function(deviceNumber){
		return this.plugin.DeviceDescription(deviceNumber);
	},
	
	// Read Methods
	
	/** Initiates the read from the gps device conneted. Use finishReadFromGps and getGpsProgressXml to 
	 * determine when the plugin is done with this operation. Also, use getGpsXml to extract the
	 * actual data from the device. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * 
	 * @param deviceNumber {Number} assigned by the plugin, see getDevicesXml for 
	 * assignment of that number.
	 * @see #finishReadFromGps
	 * @see #cancelReadFromGps
	 * @see #getDevicesXml
	 */
	startReadFromGps: function(deviceNumber) {
		 this.plugin.StartReadFromGps( deviceNumber );
	},

	/** Indicates the status of the read process. It will return an integer
	 * know as the completion state.  The purpose is to show the 
 	 * user information about what is happening to the plugin while it 
 	 * is servicing your request. Used after startReadFromGps(). <br/>
 	 * <br/>
 	 * Minimum plugin version 2.0.0.4
 	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
 	 * @see #startReadFromGps
	 * @see #cancelReadFromGps
	 */
	finishReadFromGps: function() {
		return this.plugin.FinishReadFromGps();
	},
	
	/** Cancels the current read from the device. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * @see #startReadFromGps
	 * @see #finishReadFromGps
     */	
	cancelReadFromGps: function() {
		this.plugin.CancelReadFromGps();
	},
	
	/** Start the asynchronous ReadFitnessData operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.1.0.3 for FitnessHistory type<br/>
     * Minimum plugin version 2.2.0.1 for FitnessWorkouts, FitnessUserProfile, FitnessCourses
	 * 
	 * @param deviceNumber {Number} assigned by the plugin, see getDevicesXmlString for 
	 * assignment of that number.
	 * @param dataTypeName {String} a fitness datatype from the 
	 * <a href="http://developer.garmin.com/schemas/device/v2">Garmin Device XML</a> 
	 * retrieved with getDeviceDescriptionXml
	 * @see #finishReadFitnessData  
	 * @see #cancelReadFitnessData
	 * @see #getDeviceDescriptionXml
	 * @see Garmin.DeviceControl#FILE_TYPES
	 */
	startReadFitnessData: function(deviceNumber, dataTypeName) {
		if( !this.checkPluginVersionSupport([2,1,0,3]) ) {
			throw new Error("Your Communicator Plug-in version (" + this.getPluginVersionString() + ") does not support reading this type of fitness data.");
		}

		 this.plugin.StartReadFitnessData( deviceNumber, dataTypeName );
	},

	/** Poll for completion of the asynchronous ReadFitnessData operation. <br/>
     * <br/>
     * If the CompletionState is eMessageWaiting, call MessageBoxXml
     * to get a description of the message box to be displayed to
     * the user, and then call RespondToMessageBox with the value of the
     * selected button to resume operation.<br/>
     * <br/>
     * Minimum plugin version 2.1.0.3 for FitnessHistory type <br/>
     * Minimum plugin version 2.2.0.1 for FitnessWorkouts, FitnessUserProfile, FitnessCourses
	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
 	 * @see #startReadFitnessData  
	 * @see #cancelReadFitnessData
	 */
	finishReadFitnessData: function() {
	 	 return  this.plugin.FinishReadFitnessData();
	},
	
	/** Cancel the asynchronous ReadFitnessData operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.1.0.3 for FitnessHistory type <br/>
     * Minimum plugin version 2.2.0.1 for FitnessWorkouts, FitnessUserProfile, FitnessCourses
     * 
     * @see #startReadFitnessData  
	 * @see #finishReadFitnessData
     */	
	cancelReadFitnessData: function() {
		this.plugin.CancelReadFitnessData();
	},
	
	/**
	 * List all of the FIT files on the device. Starts an asynchronous directory listing operation for the device.
	 * Poll for finished with FinishReadFitDirectory. The result can be retrieved with {@link #getDirectoryXml}.
	 * 
	 * Minimum plugin version 2.7.2.0
	 * @see #finishReadFitDirectory
	 */
	startReadFitDirectory: function(deviceNumber) {
	    if( !this.getSupportsFitDirectoryRead() ) {
			throw new Error("Your Communicator Plug-in version (" + this.getPluginVersionString() + ") does not support reading directory listing data.");
		}
	    this.plugin.StartReadFITDirectory(deviceNumber);
	},
	
	/** Poll for completion of the asynchronous startReadFitDirectory operation. <br/>
     * <br/>
	 * Minimum plugin version 2.7.2.0
	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
	 * 
	 * @see #startReadFitDirectory
	 * @see #cancelReadFitDirectory
	 * @see #getMessageBoxXml
	 * @see #respondToMessageBox
	 */
	finishReadFitDirectory: function() {
		return this.plugin.FinishReadFITDirectory();
	},
	
	/** Start the asynchronous ReadFitnessDirectory operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.2
	 * 
	 * @param deviceNumber {Number} assigned by the plugin, see getDevicesXmlString for 
	 * assignment of that number.
	 * @param dataTypeName a Fitness DataType from the GarminDevice.xml retrieved with DeviceDescription
	 * @see #finishReadFitnessDirectory
	 * @see #cancelReadFitnessDirectory
	 * @see Garmin.DeviceControl#FILE_TYPES
	 */
	startReadFitnessDirectory: function(deviceNumber, dataTypeName) {
		if( !this.getSupportsFitnessDirectoryRead() ) {
			throw new Error("Your Communicator Plug-in version (" + this.getPluginVersionString() + ") does not support reading fitness directory data.");
		}
		this.plugin.StartReadFitnessDirectory( deviceNumber, dataTypeName);
	},
	
	/** Poll for completion of the asynchronous ReadFitnessDirectory operation. <br/>
     * <br/>
     * If the CompletionState is eMessageWaiting, call getMessageBoxXml
     * to get a description of the message box to be displayed to
     * the user, and then call respondToMessageBox with the value of the
     * selected button to resume operation.<br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.2
	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
	 * 
	 * @see #startReadFitnessDirectory
	 * @see #cancelReadFitnessDirectory
	 * @see #getMessageBoxXml
	 * @see #respondToMessageBox
	 */
	finishReadFitnessDirectory: function() {
		return this.plugin.FinishReadFitnessDirectory();
	},
	
	/** Cancel the asynchronous ReadFitnessDirectory operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.2
	 * 
	 * @see #startReadFitnessDirectory
	 * @see #finishReadFitnessDirectory
     */	
	cancelReadFitnessDirectory: function() {
		this.plugin.CancelReadFitnessDirectory();
	},

	/** Cancel the asynchronous ReadFitDirectory operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.7.2.0
	 * 
	 * @see #startReadFitDirectory
	 * @see #finishReadFitDirectory
     */	
	cancelReadFitDirectory: function() {
		this.plugin.CancelReadFitDirectory();
	},
	
	/** Start the asynchronous ReadFitnessDetail operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.2
	 * 
	 * @param deviceNumber assigned by the plugin, see getDevicesXmlString for 
	 * assignment of that number.
	 * @param dataTypeName a Fitness DataType from the GarminDevice.xml retrieved with DeviceDescription
	 * @see #finishReadFitnessDetail
	 * @see #cancelReadFitnessDetail
	 * @see Garmin.DeviceControl#FILE_TYPES
	 */
	startReadFitnessDetail: function(deviceNumber, dataTypeName, dataId) {
		if( !this.checkPluginVersionSupport([2,2,0,2]) ) {
			throw new Error("Your Communicator Plug-in version (" + this.getPluginVersionString() + ") does not support reading fitness detail.");
		}
		
		this.plugin.StartReadFitnessDetail(deviceNumber, dataTypeName, dataId);
	},
	
	/** Poll for completion of the asynchronous ReadFitnessDetail operation. <br/>
     * <br/>
     * If the CompletionState is eMessageWaiting, call MessageBoxXml
     * to get a description of the message box to be displayed to
     * the user, and then call RespondToMessageBox with the value of the
     * selected button to resume operation.<br/>
     * <br/>
     * Minimum plugin version 2.2.0.2
	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
	 * 
	 */
	finishReadFitnessDetail: function() {
		return this.plugin.FinishReadFitnessDetail();
	},
	
	/** Cancel the asynchronous ReadFitnessDirectory operation. <br/>
	 * <br/>
	 * Minimum version 2.2.0.2
	 * 
	 * @see #startReadFitnessDetail
	 * @see #finishReadFitnessDetail
     */	
	cancelReadFitnessDetail: function() {
		this.plugin.CancelReadFitnessDetail();
	},


   /** Starts an asynchronous file listing operation for a Mass Storage mode device. <br/>
	* Only files that are output from the device are listed. </br>
	* The result can be retrieved with {@link #getDirectoryXml}.
	* Minimum plugin version 2.8.1.0 <br/>
    *
	* @param {Number} deviceNumber assigned by the plugin, see getDevicesXmlString for 
	* assignment of that number.
	* @param {String} dataTypeName a DataType from GarminDevice.xml retrieved with DeviceDescription
	* @param {String} fileTypeName a Specification Identifier for a File in dataTypeName from GarminDevice.xml
    * @param {Boolean} computeMD5 If true, the plug-in will generate an MD5 checksum for each readable file. 
	*
	* @see #finishReadableFileListing
	* @see #cancelReadableFileListing
	* @see Garmin.DeviceControl.FILE_TYPES
	*/
	startReadableFileListing: function( deviceNumber, dataTypeName, fileTypeName, computeMD5 ) 
	{
		if( !this.checkPluginVersionSupport([2,8,1,0]) ) 
		{
			throw new Error("Your Communicator Plug-in version (" + this.getPluginVersionString() + ") does not support listing readable files.");
		}
		
		this.plugin.StartReadableFileListing(deviceNumber, dataTypeName, fileTypeName, computeMD5);
	},
	
   /** Cancel the asynchronous ReadableFileListing operation <br/>
    * Minimum version 2.8.1.0 <br/>
    *
 	* @see #startReadableFileListing
 	* @see #finishReadableFileListing
 	*/
	cancelReadableFileListing: function() 
	{
		this.plugin.CancelReadableFileListing();	
	},

	/** Poll for completion of the asynchronous ReadableFileListing operation. <br/>
     * <br/>
     * If the CompletionState is eMessageWaiting, call MessageBoxXml
     * to get a description of the message box to be displayed to
     * the user, and then call RespondToMessageBox with the value of the
     * selected button to resume operation.<br/>
     * <br/>
     * Minimum version 2.8.1.0 <br/>
	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
	 * 
	 */
	finishReadableFileListing: function()
	{
		return this.plugin.FinishReadableFileListing();
	},

	// Write Methods
	
	/** Initates writing the gpsXml to the device specified by deviceNumber with a filename set by filename.
	 * The gpsXml is typically in GPX fomat and the filename is only the name without the extension. The 
	 * plugin will append the .gpx extension automatically.<br/>
	 * <br/>
	 * Use finishWriteToGps to poll when the write operation/plugin is complete.<br/>
	 * <br/>
	 * Uses the helper functions to set the xml info and the filename.  <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4<br/>
     * Minimum plugin version 2.2.0.1 for writes of GPX to SD Card
	 * 
	 * @param gpsXml {String} the gps/gpx information that should be transferred to the device.
	 * @param filename {String} the desired filename for the gpsXml that shall end up on the device.
	 * @param deviceNumber {Number} the device number assigned by the plugin.
	 * @see #finishWriteToGps
	 * @see #cancelWriteToGps  
	 */
	startWriteToGps: function(gpsXml, filename, deviceNumber) {
		this._setWriteGpsXml(gpsXml);
		this._setWriteFilename(filename);
	    this.plugin.StartWriteToGps(deviceNumber);
	},

	/** Sets the gps xml content that will end up on the device once the transfer is complete.
	 * Use in conjunction with startWriteToGps to initiate the actual write.
	 *
	 * @private 
	 * @param gpsXml {String} xml data that is to be written to the device. Must be in GPX format.
	 */
	_setWriteGpsXml: function(gpsXml) {
    	this.plugin.GpsXml = gpsXml;
	},

	/** This the filename that wil contain the gps xml once the transfer is complete. Use with 
	 * setWriteGpsXml to set what the file contents will be. Also, use startWriteToGps to 
	 * actually make the write happen.
	 * 
	 * @private
	 * @param filename {String} the actual filename that will end up on the device. Should only be the
	 * name and not the extension. The plugin will append the extension portion to the file name--typically .gpx.
	 * @see #setWriteGpsXml, #startWriteToGps, #startWriteFitnessData
	 */
	_setWriteFilename: function(filename) {
    	this.plugin.FileName = filename;
	},

	/** This is used to indicate the status of the write process. It will return an integer
	 * know as the completion state.  The purpose is to show the 
 	 * user information about what is happening to the plugin while it 
 	 * is servicing your request. <br/>
 	 * <br/>
 	 * Minimum plugin version 2.0.0.4<br/>
     * Minimum plugin version 2.2.0.1 for writes of GPX to SD Card 
 	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
 	 * @see #startWriteToGps
	 * @see #cancelWriteToGps  
 	 */
	finishWriteToGps: function() {
		//console.debug("Plugin.finishWriteToGps");
	   	return  this.plugin.FinishWriteToGps();
	},
    
	/** Cancels the current write operation to the gps device. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4<br/>
     * Minimum plugin version 2.2.0.1 for writes of GPX to SD Card
     * 
     * @see #startWriteToGps
	 * @see #finishWriteToGps  
     */	
	cancelWriteToGps: function() {
		this.plugin.CancelWriteToGps();
	},

	/** Start the asynchronous StartWriteFitnessData operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.1
	 * 
	 * @param tcdXml {String} XML of TCD data
	 * @param deviceNumber {Number} the device number, assigned by the plugin. See getDevicesXmlString for 
	 * assignment of that number.
	 * @param filename {String} the filename to write to on the device.
	 * @param dataTypeName {String} a Fitness DataType from the GarminDevice.xml retrieved with DeviceDescription
	 * @see #finishWriteFitnessData  
	 * @see #cancelWriteFitnessData
	 * @see Garmin.DeviceControl#FILE_TYPES
	 */
	startWriteFitnessData: function(tcdXml, deviceNumber, filename, dataTypeName) {	
		if( !this.checkPluginVersionSupport([2,2,0,1]) ) {
			throw new Error("Your Communicator Plug-in version (" + this.getPluginVersionString() + ") does not support writing fitness data.");
		}
		
		this._setWriteTcdXml(tcdXml);
		this._setWriteFilename(filename);
		this.plugin.StartWriteFitnessData(deviceNumber, dataTypeName);
	},
	
	/** This is used to indicate the status of the write process for fitness data. It will return an integer
	 * know as the completion state.  The purpose is to show the 
 	 * user information about what is happening to the plugin while it 
 	 * is servicing your request. <br/>
 	 * <br/>
 	 * Minimum plugin version 2.2.0.1
 	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
 	 * @see #startWriteFitnessData  
	 * @see #cancelWriteFitnessData
	 */
	finishWriteFitnessData: function() {
	 	return  this.plugin.FinishWriteFitnessData();
	},
	
	/** Cancel the asynchronous ReadFitnessData operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.1
	 * 
	 * @see #startWriteFitnessData  
	 * @see #finishWriteFitnessData
     */	
	cancelWriteFitnessData: function() {
		this.plugin.CancelWriteFitnessData();
	},
	
	/** Sets the tcd xml content that will end up on the device once the transfer is complete.
	 * Use in conjunction with startWriteFitnessData to initiate the actual write.
	 *
	 * @private 
	 * @param tcdXml {String} xml data that is to be written to the device. Must be in TCX format.
	 */
	_setWriteTcdXml: function(tcdXml) {
    	this.plugin.TcdXml = tcdXml;
	},
	
	/**
	 * Determine the amount of space available on a Mass Storage Mode Device Volume.
	 * 
	 * @param {Number} deviceNumber - the device number assigned by the plugin. See {@link getDevicesXmlString} for 
	 * assignment of that number.
	 * @param {String} relativeFilePath - if a file is being replaced, set to relative path on device, otherwise set to empty string.
	 * @return -1 for non-mass storage mode devices.  
	 */
	bytesAvailable: function(deviceNumber, relativeFilePath) {
	    return this.plugin.BytesAvailable(deviceNumber, relativeFilePath);
	},

	/**
	 * Determine if device is file-based. <br/>
	 * File-based devices include Mass Storage Mode Devices such as Nuvi, Oregon, Edge 705,
	 * as well as ANT Proxy Devices.<br/>
	 * 
	 * Minimum plugin version 2.8.1.0 <br/>
	 * @param {Number} deviceNumber the device number assigned by the plugin. See {@link getDevicesXmlString} for 
	 * assignment of that number.
	 * @returns {Boolean} true for file based devices, false otherwise
	 */
	isDeviceFileBased: function(deviceNumber) {
        var theReturn = true;
        //do a dummy file listing
        try {
            this.startReadableFileListing( deviceNumber, 'FileBasedTest', 'FileBasedTest', false );
	        while( this.finishReadableFileListing() == 1 ) {
            //wait until done. Only safe to do because fxn returns quickly because of test name and id!
            }
        } catch(e) {
            theReturn = false;
        }
        return theReturn;
	},

    /** Responds to a message box on the device. <br/>
     * <br/>
     * Minimum plugin version 2.0.0.4
     *   
     * @param response should be an int which corresponds to a button value from this.plugin.MessageBoxXml
     */
    respondToMessageBox: function(response) {
        this.plugin.RespondToMessageBox(response);
    },

	/** Initates downloading the gpsDataString to the device specified by deviceNumber.
	 * The gpsDataString is typically in GPI fomat and the filename is only the name without the extension. The 
	 * plugin will append the .gpx extension automatically.<br/>
	 * <br/>
	 * Use finishWriteToGps to poll when the write operation/plugin is complete.<br/>
	 * <br/>
	 * Uses the helper functions to set the xml info and the filename.  <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 *  
	 * @param gpsDataString {String} the gpi information that should be transferred to the device.
	 * @param filename {String} the filename to write to on the device.
	 * @param deviceNumber {Number} the device number assigned by the plugin. 
	 * @see #finishDownloadData  
	 * @see #cancelDownloadData
	 */
	startDownloadData: function(gpsDataString, deviceNumber) {
		//console.debug("Plugin.startDownloadData gpsDataString="+gpsDataString);
		this.plugin.StartDownloadData(gpsDataString, deviceNumber);
	},

	/** This is used to indicate the status of the download process. It will return an integer
	 * know as the completion state.  The purpose is to show the 
 	 * user information about what is happening to the plugin while it 
 	 * is servicing your request.<br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
 	 * @see #startDownloadData  
	 * @see #cancelDownloadData
	 */
	finishDownloadData: function() {
		//console.debug("Plugin.finishDownloadData");
		return this.plugin.FinishDownloadData();
	},

	/** Cancel the asynchronous Download Data operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * 
	 * @see #startDownloadData  
	 * @see #finishDownloadData
	 */
	cancelDownloadData: function() {
		this.plugin.CancelDownloadData();
	},

    /** Indicates success of StartDownloadData operation. <br/>
     * <br/>
     * Minimum plugin version 2.0.0.4
     * 
     * @type Boolean
     * @return True if the last StartDownloadData operation was successful
     */
    downloadDataSucceeded: function() {
		return this.plugin.DownloadDataSucceeded;
    },

    /** Download and install a list of unit software updates.  Start the asynchronous 
     * StartUnitSoftwareUpdate operation.
     * 
     * Check for completion with the FinishUnitSoftwareUpdate() method.  After
     * completion check the DownloadDataSucceeded property to make sure that all of the downloads 
     * were successfully placed on the device. 
     * 
     * See the Schema UnitSoftwareUpdatev3.xsd for the format of the UpdateResponsesXml description
     *
     * @see Garmin.DevicePlugin.finishUnitSoftwareUpdate
     * @see Garmin.DevicePlugin.cancelUnitSoftwareUpdate
     * @see Garmin.DevicePlugin.downloadDataSucceeded
     * @version plugin v2.6.2.0
     */
    startUnitSoftwareUpdate: function(updateResponsesXml, deviceNumber) {
        this.plugin.StartUnitSoftwareUpdate(updateResponsesXml, deviceNumber);
    },
    
    /** Poll for completion of the asynchronous Unit Software Update operation. It will return an integer
	 * know as the completion state.  The purpose is to show the 
 	 * user information about what is happening to the plugin while it 
 	 * is servicing your request.<br/>
 	 * @type Number 
     * @version plugin v2.6.2.0
     * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
 	 * @see Garmin.DevicePlugin.startUnitSoftwareUpdate
 	 * @see Garmin.DevicePlugin.cancelUnitSoftwareUpdate
     */
    finishUnitSoftwareUpdate: function() {
        return this.plugin.FinishUnitSoftwareUpdate();  
    },
    
    /** Cancel the asynchrous Download Data operation
     * @version plugin v2.6.2.0
     */
    cancelUnitSoftwareUpdate: function() {
        this.plugin.CancelUnitSoftwareUpdate();
    },
    
    /** Get the UnitSoftwareUpdateRequests for a given device.
     * This request retrieves the main system software (system region only.)
     * @param deviceNumber {Number} the device number to retrieve unit software information for. 
     * @return {String} XML string of the document format in the namespace below, or
     * the most current version of that xms namespace
     * http://www.garmin.com/xmlschemas/UnitSoftwareUpdate/v3
     * @version plugin v2.6.2.0
     * @see Garmin.DevicePlugin.getAdditionalSoftwareUpdateRequests
     */
//    getUnitSoftwareUpdateRequests: function(deviceNumber) {
//        return this.plugin.UnitSoftwareUpdateRequests(deviceNumber);
//    },
    
    /** Get the AdditionalSoftwareUpdateRequests for a given device.
     * This request retrieves the additional system software (all software except for system region.)
     * @param deviceNumber {Number} the device number to retrieve unit software information for.
     * @return {String} XML string of the document format in the namespace below, or
     * the most current version of that xms namespace
     * http://www.garmin.com/xmlschemas/UnitSoftwareUpdate/v3
     * @version plugin v2.6.2.0
     * @see Garmin.DevicePlugin.getUnitSoftwareUpdateRequests
     */
//    getAdditionalSoftwareUpdateRequests: function(deviceNumber) {
//        return this.plugin.AdditionalSoftwareUpdateRequests(deviceNumber);
//    },
    
    /** Indicates success of WriteToGps operation. <br/>
     * <br/>
     * Minimum plugin version 2.0.0.4
     * 
     * @type Boolean
     * @return True if the last ReadFromGps or WriteToGps operation was successful
     */
    gpsTransferSucceeded: function() {
		return this.plugin.GpsTransferSucceeded;
    },

    /** Indicates success of ReadFitnessData or WriteFitnessData operation. <br/>
     * <br/>
     * Minimum plugin version 2.1.0.3
     * 
     * @type Boolean
     * @return True if the last ReadFitnessData or WriteFitnessData operation succeeded
     */
    fitnessTransferSucceeded: function() {
		return this.plugin.FitnessTransferSucceeded;
    },
    
    /** Return the specified file as a UU-Encoded string
     * <br/>
     * Minimum version 2.6.3.1
     * 
     * If the file is known to be compressed, compressed should be
     * set to false. Otherwise, set compressed to true to retrieve a
     * gzipped and uuencoded file.
     * 
     * @param relativeFilePath {String} path relative to the Garmin folder on the device
     */
    getBinaryFile: function(deviceNumber, relativeFilePath, compressed) {
        return this.plugin.GetBinaryFile(deviceNumber, relativeFilePath, compressed);
    },
    
    /** This is the GpsXml information from the device. Typically called after a read operation.
     * 
     * @see #finishReadFromGps
     */
	getGpsXml: function(){
		return this.plugin.GpsXml;
	},

    /** This is the fitness data Xml information from the device. Typically called after a ReadFitnessData operation. <br/>
	 * <br/>
     * Schemas for the TrainingCenterDatabase format are available at
     * <a href="http://developer.garmin.com/schemas/tcx/v2/">http://developer.garmin.com/schemas/tcx/v2/</a><br/>
     * <br/>
     * Minimum plugin version 2.1.0.3
     * 
     * @see #finishReadFitnessData
     * @see #finishReadFitnessDirectory
     * @see #finishReadFitnessDetail
     */
	getTcdXml: function(){
		return this.plugin.TcdXml;
	},
	
	 /** Returns last read fitness xml data in compressed format.  The xml is compressed as gzp and base64 expanded. <br/>
	  * <br/>
	  * Minimum plugin version 2.2.0.2
	  * 
	  * @return The read xml data in compressed gzp and base64 expanded format.
	  * @see #finishReadFitnessData
      * @see #finishReadFitnessDirectory
      * @see #finishReadFitnessDetail
	  */
	getTcdXmlz: function() {
		return this.plugin.TcdXmlz;
	},

	 /** Returns last read directory xml data.<br/>
	  * <br/>
	  * 
	  * @return The directory xml data
	  * @see #finishReadFitDirectory
	  */
	getDirectoryXml: function() {
		return this.plugin.DirectoryListingXml;
	},
	
    /** Returns the xml describing the message when the plug-in is waiting for input from the user.
     * @type String
     * @return The xml describing the message when the plug-in is waiting for input from the user.
     */
	getMessageBoxXml: function(){
		return this.plugin.MessageBoxXml;
	},
    
	/** Get the status/progress of the current state or transfer.
     * @type String
     * @return The xml describing the current progress state of the plug-in.
     */	
	getProgressXml: function() {
		return this.plugin.ProgressXml;
	},

	/** Returns metadata information about the plugin version. 
     * @type String
     * @return The xml describing the user's version of the plug-in.
	 */
	getVersionXml: function() {
		return this.plugin.VersionXml;
	},
	
	/** Gets a string of the version number for the plugin the user has currently installed.
     * @type String 
     * @return A string of the format "versionMajor.versionMinor.buildMajor.buildMinor", ex: "2.0.0.4"
     */	
	getPluginVersionString: function() {
		var versionArray = this.getPluginVersion();
	
		var versionString = versionArray[0] + "." + versionArray[1] + "." + versionArray[2] + "." + versionArray[3];
	    return versionString;
	},
	
	/** Gets the version number for the plugin the user has currently installed.
     * @type Array 
     * @return An array of the format: [versionMajor, versionMinor, buildMajor, buildMinor].
     */	
	getPluginVersion: function() {
    	var versionMajor = parseInt(this._getElementValue(this.getVersionXml(), "VersionMajor"));
    	var versionMinor = parseInt(this._getElementValue(this.getVersionXml(), "VersionMinor"));
    	var buildMajor = parseInt(this._getElementValue(this.getVersionXml(), "BuildMajor"));
    	var buildMinor = parseInt(this._getElementValue(this.getVersionXml(), "BuildMinor"));

	    var versionArray = [versionMajor, versionMinor, buildMajor, buildMinor];
	    return versionArray;
	},
	
	/** Sets the required plugin version number for the application.
	 * @param reqVersionArray {Array} The required version to set to.  In the format [versionMajor, versionMinor, buildMajor, buildMinor]
	 * 			i.e. [2,2,0,1]
	 */
	setPluginRequiredVersion: function(reqVersionArray) {
		Garmin.DevicePlugin.REQUIRED_VERSION.versionMajor = reqVersionArray[0];
		Garmin.DevicePlugin.REQUIRED_VERSION.versionMinor = reqVersionArray[1];
		Garmin.DevicePlugin.REQUIRED_VERSION.buildMajor = reqVersionArray[2];
		Garmin.DevicePlugin.REQUIRED_VERSION.buildMinor = reqVersionArray[3];
	},
	
	/** Sets the latest plugin version number.  This represents the latest version available for download at Garmin.
	 * We will attempt to keep the default value of this up to date with each API release, but this is not guaranteed,
	 * so set this to be safe or if you don't want to upgrade to the latest API.
	 * 
	 * @param reqVersionArray {Array} The latest version to set to.  In the format [versionMajor, versionMinor, buildMajor, buildMinor]
	 * 			i.e. [2,2,0,1]
	 */
	setPluginLatestVersion: function(reqVersionArray) {
		Garmin.DevicePlugin.LATEST_VERSION.versionMajor = reqVersionArray[0];
		Garmin.DevicePlugin.LATEST_VERSION.versionMinor = reqVersionArray[1];
		Garmin.DevicePlugin.LATEST_VERSION.buildMajor = reqVersionArray[2];
		Garmin.DevicePlugin.LATEST_VERSION.buildMinor = reqVersionArray[3];
	},
	
	/** Used to check if the user's installed plugin version meets the required version for feature support purposes.
	 *  
	 * @param {Array} reqVersionArray An array representing the required version, in the format: [versionMajor, versionMinor, buildMajor, buildMinor]. 
	 * @return {boolean} true if the passed in required version is met by the user's plugin version (user's version is equal to or greater), false otherwise.
	 * @see setPluginRequiredVersion
	 */
	checkPluginVersionSupport: function(reqVersionArray) {
		
		var pVersion = this._versionToNumber(this.getPluginVersion());
   		var rVersion = this._versionToNumber(reqVersionArray);
        return (pVersion >= rVersion);
	},
	
	/**
	 * @private
	 */
	_versionToNumber: function(versionArray) {
		if (versionArray[1] > 99 || versionArray[2] > 99 || versionArray[3] > 99)
			throw new Error("version segment is greater than 99: "+versionArray);
		return 1000000*versionArray[0] + 10000*versionArray[1] + 100*versionArray[2] + versionArray[3];
	},
	
	/** Determines if the Garmin plugin is at least the required version for the application.
     * @type Boolean
     * @see setPluginRequiredVersion
	 */
	isPluginOutOfDate: function() {
    	var pVersion = this._versionToNumber(this.getPluginVersion());
   		var rVersion = this._versionToNumber(Garmin.DevicePlugin.REQUIRED_VERSION.toArray());
        return (pVersion < rVersion);
	},
	
	/** Checks if plugin is the most recent version released, for those that want the latest and greatest.
     */
    isUpdateAvailable: function() {
    	var pVersion = this._versionToNumber(this.getPluginVersion());
   		var cVersion = this._versionToNumber(Garmin.DevicePlugin.LATEST_VERSION.toArray());
        return (pVersion < cVersion);
    },
	
	/** Pulls value from xml given an element name or null if no tag exists with that name.
	 * @private
	 */
	_getElementValue: function(xml, tagName) {
		var start = xml.indexOf("<"+tagName+">");
		if (start == -1)
			return null;
		start += tagName.length+2;
		var end = xml.indexOf("</"+tagName+">");
		var result = xml.substring(start, end);
		return result;
	}
	
};

/** Latest version (not required) of the Garmin Communicator Plugin, and a complementary toString function to print it out with
 */
Garmin.DevicePlugin.LATEST_VERSION = {
    versionMajor: 2,
    versionMinor: 7,
    buildMajor: 3,
    buildMinor: 0,
    
    toString: function() {
        return this.versionMajor + "." + this.versionMinor + "." + this.buildMajor + "." + this.buildMinor;
    },
    
    toArray: function() {
        return [this.versionMajor, this.versionMinor, this.buildMajor, this.buildMinor];
    }	
}; 
 
 
/** Latest required version of the Garmin Communicator Plugin, and a complementary toString function to print it out with. 
 */
Garmin.DevicePlugin.REQUIRED_VERSION = {
    versionMajor: 2,
    versionMinor: 1,
    buildMajor: 0,
    buildMinor: 1,
    
    toString: function() {
        return this.versionMajor + "." + this.versionMinor + "." + this.buildMajor + "." + this.buildMinor;
    },
    
    toArray: function() {
        return [this.versionMajor, this.versionMinor, this.buildMajor, this.buildMinor];
    }	
};



if (Garmin == undefined) var Garmin = {};
/** Copyright &copy; 2007-2010 Garmin Ltd. or its subsidiaries.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * @fileoverview Garmin.DeviceControl A high-level JavaScript API which supports listener and callback functionality.
 * @version 1.8
 */
/** A controller object that can retrieve and send data to a Garmin 
 * device.<br><br>
 * @class Garmin.DeviceControl
 * 
 * The controller must be unlocked before anything can be done with it.  
 * Then you'll have to find a device before you can start to read data from
 * and write data to the device.<br><br>
 * 
 * We use the <a href="http://en.wikipedia.org/wiki/Observer_pattern">observer pattern</a> 
 * to handle the asynchronous nature of device communication.  You must register
 * your class as a listener to this Object and then implement methods that will 
 * get called on certain events.<br><br>
 * 
 * Events:<br><br>
 *     onStartFindDevices called when starting to search for devices.
 *       the object returned is {controller: this}<br><br>
 *
 *     onCancelFindDevices is called when the controller is told to cancel finding
 *         devices {controller: this}<br><br>
 *
 *     onFinishFindDevices called when the devices are found.
 *       the object returned is {controller: this}<br><br>
 *
 *     onException is called when an exception occurs in a method
 *         object passed back is {msg: exception}<br><br>
 *
 *	   onInteractionWithNoDevice is called when the device is lazy loaded, but finds no devices,
 * 			yet still attempts a read/write action {controller: this}<br><br>
 * 
 *     onStartReadFromDevice is called when the controller is about to start
 *         reading from the device {controller: this}<br><br>
 * 
 *     onFinishReadFromDevice is called when the controller is done reading 
 *         the device.  the read is either a success or failure, which is 
 *         communicated via json.  object passed back contains 
 *         {success:this.garminPlugin.GpsTransferSucceeded, controller: this} <br><br>
 *
 *     onWaitingReadFromDevice is called when the controller is waiting for input
 *         from the user about the device.  object passed back contains: 
 *         {message: this.garminPlugin.MessageBoxXml, controller: this}<br><br>
 *
 *     onProgressReadFromDevice is called when the controller is still reading information
 *         from the device.  in this case the message is a percent complete/ 
 *         {progress: this.getDeviceStatus(), controller: this}<br><br>
 *
 *     onCancelReadFromDevice is called when the controller is told to cancel reading
 *         from the device {controller: this}<br><br>
 *
 *     onFinishWriteToDevice is called when the controller is done writing to 
 *         the device.  the write is either a success or failure, which is 
 *         communicated via json.  object passed back contains 
 *         {success:this.garminPlugin.GpsTransferSucceeded, controller: this}<br><br>
 *
 *     onWaitingWriteToDevice is called when the controller is waiting for input
 *         from the user about the device.  object passed back contains: 
 *         {message: this.garminPlugin.MessageBoxXml, controller: this}<br><br>
 *
 *     onProgressWriteToDevice is called when the controller is still writing information
 *         to the device.  in this case the message is a percent complete/ 
 *         {progress: this.getDeviceStatus(), controller: this}<br><br>
 *
 *     onCancelWriteToDevice is called when the controller is told to cancel writing
 *         to the device {controller: this}<br><br>
 *
 * @constructor 
 *
 * requires Prototype
 * @requires BrowserDetect
 * @requires Garmin.DevicePlugin
 * @requires Garmin.Broadcaster
 * @requires Garmin.XmlConverter
 */
Garmin.DeviceControl = function(){}; //just here for jsdoc
Garmin.DeviceControl = Class.create();
Garmin.DeviceControl.prototype = {


	/////////////////////// Initialization Code ///////////////////////	

    /** Instantiates a Garmin.DeviceControl object, but does not unlock/activate plugin.
     */
	initialize: function() {
		
		this.pluginUnlocked = false;
		this.dirInterval = null;
		//keep state when doing multi-type file listings
		this.fileListingOptions = null;
		this.fileListingIndex = 0;

		try {
			if (typeof(Garmin.DevicePlugin) == 'undefined') throw '';
		} catch(e) {
			throw new Error(Garmin.DeviceControl.MESSAGES.deviceControlMissing);
		};

    	// check that the browser is supported
     	if(!BrowserSupport.isBrowserSupported()) {
    	    var notSupported = new Error(Garmin.DeviceControl.MESSAGES.browserNotSupported);
    	    notSupported.name = "BrowserNotSupportedException";
    	    //console.debug("Control.validatePlugin throw BrowserNotSupportedException")
    	    throw notSupported;
        }
		
		// make sure the browser has the plugin installed
		if (!PluginDetect.detectGarminCommunicatorPlugin()) {
     	    var notInstalled = new Error(Garmin.DeviceControl.MESSAGES.pluginNotInstalled);
    	    notInstalled.name = "PluginNotInstalledException";
    	    throw notInstalled;			
		}
				
		// grab the plugin object on the page
		var pluginElement;
		if( window.ActiveXObject ) { // IE
			pluginElement = $("GarminActiveXControl");
		} else { // FireFox
			pluginElement = $("GarminNetscapePlugin");
		}
		
		// make sure the plugin object exists on the page
		if (pluginElement == null) {
			var error = new Error(Garmin.DeviceControl.MESSAGES.missingPluginTag);
			error.name = "HtmlTagNotFoundException";
			throw error;			
		}
		
		// instantiate a garmin plugin
		this.garminPlugin = new Garmin.DevicePlugin(pluginElement);
		 
		// validate the garmin plugin
		this.validatePlugin();
		
		// instantiate a broacaster
		this._broadcaster = new Garmin.Broadcaster();

		this.getDetailedDeviceData = true;
		this.devices = new Array();
		this.deviceNumber = null;
		this.numDevices = 0;

		this.gpsData = null;
		this.gpsDataType = null; //used by both read and write methods to track data context
		this.gpsDataString = "";
		this.gpsDataStringCompressed = "";  // Compresed version of gpsDataString.  gzip compressed and base 64 expanded.
		
		//this.wasMessageHack = false; //needed because garminPlugin.finishDownloadData returns true after out-of-memory error message is returned
	},

	/** Checks plugin validity: browser support, installation and required version.
	 * @private
     * @throws BrowserNotSupportedException
     * @throws PluginNotInstalledException
     * @throws OutOfDatePluginException
     */
    validatePlugin: function() {
		if (!this.isPluginInstalled()) {
     	    var notInstalled = new Error(Garmin.DeviceControl.MESSAGES.pluginNotInstalled);
    	    notInstalled.name = "PluginNotInstalledException";
    	    throw notInstalled;
        }
		if(this.garminPlugin.isPluginOutOfDate()) {
    	    var outOfDate = new Error(Garmin.DeviceControl.MESSAGES.outOfDatePlugin1+Garmin.DevicePlugin.REQUIRED_VERSION.toString()+Garmin.DeviceControl.MESSAGES.outOfDatePlugin2+this.getPluginVersionString());
    	    outOfDate.name = "OutOfDatePluginException";
    	    outOfDate.version = this.getPluginVersionString();
    	    throw outOfDate;
        }
    },
    
    /** Checks plugin for updates.  Throws an exception if the user's plugin version is
     * older than the one set by the API.
     * 
     * Plugin updates are not required so use this function with caution.
     * @see #setPluginLatestVersion
     */
    checkForUpdates: function() {
    	if(this.garminPlugin.isUpdateAvailable()) {
    		var notLatest = new Error(Garmin.DeviceControl.MESSAGES.updatePlugin1+Garmin.DevicePlugin.LATEST_VERSION.toString()+Garmin.DeviceControl.MESSAGES.updatePlugin2+this.getPluginVersionString());
    	    notLatest.name = "UpdatePluginException";
    	    notLatest.version = this.getPluginVersionString();
    	    throw notLatest;
    	}
    },
    
	/////////////////////// Device Handling Methods ///////////////////////	

	/** Finds any connected Garmin Devices.  
     * When it's done finding the devices, onFinishFindDevices is dispatched <br/>
     * <br/>
     * this.numDevices = the number of devices found<br/>
     * this.deviceNumber is the device that we'll use to communicate with<br/>
     * <br/>
     * Use this.getDevices() to get an array of the found devices and 
     * this.setDeviceNumber({Number}) to change the device. <br/>
     * <br/>
     * Minimum Plugin version 2.0.0.4
     * 
     * @see #getDevices
     * @see #setDeviceNumber
     */	
	findDevices: function() {
		if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
        this.garminPlugin.startFindDevices();
	    this._broadcaster.dispatch("onStartFindDevices", {controller: this});
        setTimeout(function() { this._finishFindDevices() }.bind(this), 1000);
	},

	/** Cancels the current find devices interaction. <br/>
	 * <br/>
	 * Minimum Plugin version 2.0.0.4
     */	
	cancelFindDevices: function() {
		this.garminPlugin.cancelFindDevices();
    	this._broadcaster.dispatch("onCancelFindDevices", {controller: this});
	},

	/** Loads device data into devices array.
	 * 
	 * Minimum Plugin version 2.0.0.4
	 * 
	 * @private
     */	
	_finishFindDevices: function() {
    	if(this.garminPlugin.finishFindDevices()) {
            this.devices = Garmin.PluginUtils.parseDeviceXml(this.garminPlugin, this.getDetailedDeviceData);
            this.numDevices = this.devices.length;
       		this.deviceNumber = 0;
	        this._broadcaster.dispatch("onFinishFindDevices", {controller: this});
    	} else {
    		setTimeout(function() { this._finishFindDevices() }.bind(this), 500);
    	}
	},

	/** Sets the deviceNumber variable which determines which connected device to talk to.
     * @param {Number} deviceNumber The device number
     */	
	setDeviceNumber: function(deviceNumber) {
		this.deviceNumber = deviceNumber;
	},
	
	/**
	 * Get the device number of the connected device to communicate with (multiple devices may
	 * be connected simultaneously, but the plugin only transfers data with one at a time).
	 * @return the device number (assigned by the plugin) determining which connected device
	 * to talk to.
	 */
	getDeviceNumber: function() {
        return this.deviceNumber;
	},

	/** Get a list of the devices found
     * @type Array<Garmin.Device>
     */	
	getDevices: function() {
		return this.devices;
	},
	
	/** Returns the DeviceXML of the current device, as a string.
	 */
	getCurrentDeviceXml: function() {
		return this.garminPlugin.getDeviceDescriptionXml(this.deviceNumber);		
	},
	
	/** Returns the FIT Directory XML of the current device, as a string.
	 * @private
     * @returns {String}
	 */
	getCurrentDeviceFitDirectoryXml: function() {
		try
		{
			this.garminPlugin.startReadFitDirectory(this.deviceNumber);
			this.waitForReadToFinish();
			this.pause(1000);
		}
		catch(aException)
		{}
		
		var xml = this.garminPlugin.getDirectoryXml();
		if(xml == "")
		{
			//this.garminPlugin.resetDirectoryXml();
		}
		return xml;		
	},
	
	/** Returns true if FIT health data can be read from the device.
     * @returns {Boolean}
	 */
	doesCurrentDeviceSupportHealth: function(){
    	var supported = false;
    	var directoryXml = this.getCurrentDeviceFitDirectoryXml();
		if(directoryXml != "")
		{
			var files = Garmin.DirectoryFactory.parseString(directoryXml);
			if(Garmin.DirectoryFactory.getHealthDataFiles(files).length > 0)
			{
				supported = true;
			}
		}
		return supported;
    },

	/*@private*/
	pause: function(millis)
	{
		var date = new Date();
		var curDate = null;

		do { curDate = new Date(); }
		while(curDate-date < millis);
	},
	
	/*@private*/
	waitForReadToFinish: function()
	{
		var complete = false;
		
		while(complete == false)
		{
			try
			{
				var theCompletionState =this.garminPlugin.finishReadFitDirectory();
				//alert("thecompletionState = " + theCompletionState);
				if( theCompletionState == 3 ) //Finished
				{
					complete = true;
				}
				else if( theCompletionState == 2 ) //Message Waiting
				{
					complete = true;
				}
				else
				{
				}
			}
			catch( aException )
			{
				complete = true;
			}
		}
	},


	/////////////////////// Read Methods ///////////////////////
	
	/** Generic read method, supporting GPX and TCX Fitness types: Courses, Workouts, User Profiles, Activity Goals, 
	 * TCX activity directory, and various directory reads. <br/>
	 * <br/>
	 * Fitness detail reading (one specific activity) is not supported by this read method, refer to 
	 * readDetailFromDevice for that. <br/><br/>
     * <strong>Examples:</strong>
     *@example
     * myControl.readDataFromDevice( Garmin.DeviceControl.FILE_TYPES.gpx ); 
     *
	 * @example
     * var theListOptions = [{dataTypeName: 'UserDataSync',
     *                         dataTypeID: 'http://www.topografix.com/GPX/1/1',
     *                         computeMD5: false}];
	 * myControl.readDataFromDevice( Garmin.DeviceControl.FILE_TYPES.readableDir,
	 *                               theListOptions );
     *
	 * @param {String} fileType The filetype to read from device.  Possible values for fileType are located in Garmin.DeviceControl.FILE_TYPES -- detail types are not supported. <br/>
     * @param {Object[]} [fileListingOptions] Array of objects that define file listing options. <br/>
     * <strong>fileListingOptions properties:</strong> <br/>
     * {String} dataTypeName: Name from GarminDevice.xml <br/>
     * {String} dataTypeID: Identifier from GarminDevice.xml<br/>
     * {Boolean} computeMD5: compute MD5 checksum for each listed file<br/>
     * @see #readDetailFromDevice, Garmin.DeviceControl#FILE_TYPES
	 * @throws InvalidTypeException, UnsupportedTransferTypeException
     */	
	readDataFromDevice: function(fileType, fileListingOptions) {
		if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if (this.numDevices == 0)
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
		// Make sure filetype passed in is a valid type
		if ( ! this._isAMember(fileType, [Garmin.DeviceControl.FILE_TYPES.gpx,
		                                  Garmin.DeviceControl.FILE_TYPES.gpxDetail, 
										  Garmin.DeviceControl.FILE_TYPES.gpxDir,
		                                  Garmin.DeviceControl.FILE_TYPES.tcx, 
		                                  Garmin.DeviceControl.FILE_TYPES.crs, 
										  Garmin.DeviceControl.FILE_TYPES.tcxDir, 
										  Garmin.DeviceControl.FILE_TYPES.crsDir, 
										  Garmin.DeviceControl.FILE_TYPES.wkt, 
										  Garmin.DeviceControl.FILE_TYPES.tcxProfile,
										  Garmin.DeviceControl.FILE_TYPES.goals,
										  Garmin.DeviceControl.FILE_TYPES.fit,
										  Garmin.DeviceControl.FILE_TYPES.fitDir,
										  Garmin.DeviceControl.FILE_TYPES.fitHealthData, 
										  Garmin.DeviceControl.FILE_TYPES.readableDir
										  ])) {
			var error = new Error(Garmin.DeviceControl.MESSAGES.invalidFileType + fileType);
			error.name = "InvalidTypeException";
			throw error;
		}
		if( fileType == Garmin.DeviceControl.FILE_TYPES.readableDir && 
		    fileListingOptions === undefined ) {
			var error = new Error("You have specified invalid or conflicting fileListingOptions");
			error.name = "InvalidParameterException";
			throw error;
		}
		// Make sure the device supports this type of data transfer for this type
		if( !this.checkDeviceReadSupport(fileType) ) {
		    var error = new Error(Garmin.DeviceControl.MESSAGES.unsupportedReadDataType + fileType);
    	    error.name = "UnsupportedDataTypeException";
			throw error;
		}
		this.gpsDataType = fileType;
		this.gpsData = null;		
		this.gpsDataString = null;
		this.idle = false;
		this.fileListingOptions = fileListingOptions;
		this.fileListingIndex = 0;
		try {
        	this._broadcaster.dispatch("onStartReadFromDevice", {controller: this});
        	
        	switch(this.gpsDataType) {        		
				case Garmin.DeviceControl.FILE_TYPES.gpxDir:
        		case Garmin.DeviceControl.FILE_TYPES.gpx:
        			this.garminPlugin.startReadFromGps( this.deviceNumber );
        			break;
        		case Garmin.DeviceControl.FILE_TYPES.tcx:
        		case Garmin.DeviceControl.FILE_TYPES.crs:
        		case Garmin.DeviceControl.FILE_TYPES.wkt:
        		case Garmin.DeviceControl.FILE_TYPES.goals:
        		case Garmin.DeviceControl.FILE_TYPES.tcxProfile:        		
        			this.garminPlugin.startReadFitnessData( this.deviceNumber, this.gpsDataType );
        			break;
        		case Garmin.DeviceControl.FILE_TYPES.tcxDir:
        			this.garminPlugin.startReadFitnessDirectory(this.deviceNumber, Garmin.DeviceControl.FILE_TYPES.tcx);
        			break;
        		case Garmin.DeviceControl.FILE_TYPES.crsDir:
        			this.garminPlugin.startReadFitnessDirectory(this.deviceNumber, Garmin.DeviceControl.FILE_TYPES.crs);
        			break;
        		case Garmin.DeviceControl.FILE_TYPES.fitDir:
        		case Garmin.DeviceControl.FILE_TYPES.fitHealthData:
                    this.garminPlugin.startReadFitDirectory(this.deviceNumber);
        			break;
        		case Garmin.DeviceControl.FILE_TYPES.deviceXml:
        			this.gpsDataString = this.getCurrentDeviceXml();
        			break;
        		case Garmin.DeviceControl.FILE_TYPES.readableDir:
                    this.garminPlugin.startReadableFileListing(this.deviceNumber, 
                                                               fileListingOptions[this.fileListingIndex].dataTypeName,
                                                               fileListingOptions[this.fileListingIndex].dataTypeID,
                                                               fileListingOptions[this.fileListingIndex].computeMD5);
        			break;
        	} 
		    this._progressRead();
		} catch(e) {
		    this._reportException(e);
		}
	},
	
	/** Generic detail read method, which reads a specific fitness activity from the device given an activity ID.  
	 * Supported detail types are history activities and course activities.  The resulting data read is available 
	 * in via gpsData as an XML DOM and gpsDataString as an XML string once the read successfully finishes. 
	 * Typically used after calling readDataFromDevice to read a fitness directory.<br/> 
	 * <br/>
	 * Minimum plugin version 2.2.0.2
	 * 
	 * @param {String} fileType Filetype to be read from the device.  Supported values are 
	 * Garmin.DeviceControl.FILE_TYPES.tcxDetail and Garmin.DeviceControl.FILE_TYPES.crsDetail
	 * @param {String} dataId The ID of the data to be read from the device.  The format of these values depends 
	 * on the type of data being read (i.e. course data or history data). The CourseName element in the course schema 
	 * is used to identify courses, and the Id element is used to identify history activities.
	 * @see #readDataFromDevice, #readHistoryDetailFromFitnessDevice, #readCourseDetailFromFitnessDevice
	 * @throws InvalidTypeException, UnsupportedTransferTypeException
	 */
	readDetailFromDevice: function(fileType, dataId) {
		if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if (this.numDevices == 0)
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
		if ( ! this._isAMember(fileType, [Garmin.DeviceControl.FILE_TYPES.tcxDetail, Garmin.DeviceControl.FILE_TYPES.crsDetail])) {
			var error = new Error(Garmin.DeviceControl.MESSAGES.invalidFileType + fileType);
			error.name = "InvalidTypeException";
			throw error;
		}
		if( !this.checkDeviceReadSupport(fileType) ) {
			throw new Error(Garmin.DeviceControl.MESSAGES.unsupportedReadDataType + fileType);
		}
		
		this.gpsDataType = fileType;
		this.gpsData = null;		
		this.gpsDataString = null;
		this.idle = false;
		
		try {
        	this._broadcaster.dispatch("onStartReadFromDevice", {controller: this});
        	
        	switch(this.gpsDataType) {
        		case Garmin.DeviceControl.FILE_TYPES.tcxDetail:
        			this.garminPlugin.startReadFitnessDetail(this.deviceNumber, Garmin.DeviceControl.FILE_TYPES.tcx, dataId);
        			break;
        		case Garmin.DeviceControl.FILE_TYPES.crsDetail:
        			this.garminPlugin.startReadFitnessDetail(this.deviceNumber, Garmin.DeviceControl.FILE_TYPES.crs, dataId);
        			break;
        	} 
		    this._progressRead();
		} catch(e) {
		    this._reportException(e);
		}
	},
	
	/** Asynchronously reads GPX data from the connected device.  Only handles reading
     * from the device in this.deviceNumber. <br/>
     * <br/>
     * When the data has been gathered, the onFinishedReadFromDevice is fired, and the
     * data is stored in this.gpsDataString and this.gpsData
     * 
     * @see #readDataFromDevice
     */
	readFromDevice: function() {
		this.readDataFromDevice(Garmin.DeviceControl.FILE_TYPES.gpx);
	},
	
	/** Asynchronously reads a single fitness history record from the connected device as TCX format.
	 * Only handles reading from the device in this.deviceNumber.<br/>
	 * <br/>
     * When the data has been gathered, the onFinishedReadFromDevice is fired, and the
     * data is stored in this.gpsDataString
     * 
     * Minimum plugin version 2.2.0.2
     * 
     * @param {String} historyId The ID of the history record on the device.
     * 
     * @see #readDetailFromDevice
     */	
	readHistoryDetailFromFitnessDevice: function(historyId) {
		this.readDetailFromDevice(Garmin.DeviceControl.FILE_TYPES.tcx, historyId)
	},
	
	/** Asynchronously reads a single fitness course from the connected device as TCX format.
	 * Only handles reading from the device in this.deviceNumber. <br/>
     * <br/>
     * When the data has been gathered, the onFinishedReadFromDevice is fired, and the
     * data is stored in this.gpsDataString<br/>
     * <br/>
     * Minimum plugin version 2.2.0.2
     * 
     * @param {String} courseId The name of the course on the device.
     * 
     * @see #readDetailFromDevice
     */			
	readCourseDetailFromFitnessDevice: function(courseId){
		this.readDetailFromDevice(Garmin.DeviceControl.FILE_TYPES.crs, courseId)
	},
	
	/** Asynchronously reads entire fitness history data (TCX) from the connected device.  
	 * Only handles reading from the device in this.deviceNumber. <br/>
     * <br/>
     * When the data has been gathered, the onFinishedReadFromDevice is fired, and the
     * data is stored in this.gpsDataString<br/>
     * <br/>
     * Minimum plugin version 2.1.0.3
     * 
     * @see #readDataFromDevice
     */	
	readHistoryFromFitnessDevice: function() {	
		this.readDataFromDevice(Garmin.DeviceControl.FILE_TYPES.tcx);
	},
	
	/** Asynchronously reads entire fitness course data (CRS) from the connected device.  
	 * Only handles reading from the device in this.deviceNumber<br/>
     * <br/>
     * When the data has been gathered, the onFinishedReadFromDevice is fired, and the
     * data is stored in this.gpsDataString<br/>
     * <br/>
     * Minimum plugin version 2.2.0.1
     * 
     * @see #readDataFromDevice
     */	
	readCoursesFromFitnessDevice: function() {
		this.readDataFromDevice(Garmin.DeviceControl.FILE_TYPES.crs);
	},
	
	/** Asynchronously reads fitness workout data (WKT) from the connected device.  
	 * Only handles reading from the device in this.deviceNumber<br/>
     * <br/>
     * When the data has been gathered, the onFinishedReadFromDevice is fired, and the
     * data is stored in this.gpsDataString<br/>
     * <br/>
     * Minimum plugin version 2.2.0.1
     * 
     * @see #readDataFromDevice
     */	
	readWorkoutsFromFitnessDevice: function() {
		this.readDataFromDevice(Garmin.DeviceControl.FILE_TYPES.wkt);
	},
	
	/** Asynchronously reads fitness profile data (TCX) from the connected device.
	 * Only handles reading from the device in this.deviceNumber<br/>
     * <br/>
     * When the data has been gathered, the onFinishedReadFromDevice is fired, and the
     * data is stored in this.gpsDataString<br/>
     * <br/>
     * Minimum plugin version 2.2.0.1
     * 
     * @see #readDataFromDevice
     */	
	readUserProfileFromFitnessDevice: function() {
		this.readDataFromDevice(Garmin.DeviceControl.FILE_TYPES.tcxProfile);
	},

	/** Asynchronously reads fitness goals data (TCX) from the connected device.
	 * Only handles reading from the device in this.deviceNumber<br/>
     * <br/>
     * When the data has been gathered, the onFinishedReadFromDevice is fired, and the
     * data is stored in this.gpsDataString<br/>
     * <br/>
     * Minimum plugin version 2.2.0.1
     * 
     * @see #readDataFromDevice
     */	
	readGoalsFromFitnessDevice: function() {
		this.readDataFromDevice(Garmin.DeviceControl.FILE_TYPES.goals);
	},
	
	
	
	/** Returns the GPS data that was last read as an XML DOM. <br/> 
	 * Pre-requisite - Read function was called successfully.  <br/> 
	 * <br/>
	 * Minimum plugin version 2.1.0.3
	 * 
	 * @return XML DOM of read GPS data
	 * @see #readDataFromDevice
	 * @see #readHistoryFromFitnessDevice
	 * @see #readHistoryDetailFromFitnessDevice
	 * @see #readCourseDetailFromFitnessDevice
	 */
	getGpsData: function() {
		
		if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if (this.numDevices == 0)
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
		if( this.getReadCompletionState != Garmin.DeviceControl.FINISH_STATES.finished ) {
			throw new Error(Garmin.DeviceControl.MESSAGES.incompleteRead);
		}
		
		return this.gpsData;
	},
	
	/** Returns the GPS data that was last read as an XML string. <br/>  
	 * Pre-requisite - Read function was called successfully. <br/>
	 * <br/>
	 * Minimum plugin version 2.1.0.3
	 * 
	 * @return XML string of read GPS data
	 * @see #readDataFromDevice
	 * @see #readHistoryFromFitnessDevice
	 * @see #readHistoryDetailFromFitnessDevice
	 * @see #readCourseDetailFromFitnessDevice
	 */
	getGpsDataString: function() {
		if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if (this.numDevices == 0)
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
		if( this.getReadCompletionState != Garmin.DeviceControl.FINISH_STATES.finished ) {
			throw new Error(Garmin.DeviceControl.MESSAGES.incompleteRead);
		}
		
		return this.gpsDataString;
	},
	
	/** Returns the last read fitness data in compressed format.  A fitness read method must be called and the read must
	 * finish successfully before this function returns good data. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.2
	 * 
	 * @return Compressed fitness XML data from the last successful read.  The data is gzp compressed and base64 expanded.
	 * @see #readDataFromDevice
	 * @see #readHistoryFromFitnessDevice
	 * @see #readHistoryDetailFromFitnessDevice
	 * @see #readCourseDetailFromFitnessDevice
	 */
	getCompressedFitnessData: function() {
		
		if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if (this.numDevices == 0)
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
		if( this.getReadCompletionState != Garmin.DeviceControl.FINISH_STATES.finished ) {
			throw new Error(Garmin.DeviceControl.MESSAGES.incompleteRead);
		}

		try{
			this.garminPlugin.getTcdXmlz();
		}
		catch( aException ) {
 			this._reportException( aException );
		}
	},

	/** Returns the completion state of the current read.  This function can be used with
	 * GPX and TCX (fitness) reads.
	 * 
	 * @type Number
	 * @return {Number} The completion state of the current read.  The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
	 */	
	getReadCompletionState: function() {
		switch(this.gpsDataType) {
			case Garmin.DeviceControl.FILE_TYPES.gpxDir:
			case Garmin.DeviceControl.FILE_TYPES.gpxDetail:
			case Garmin.DeviceControl.FILE_TYPES.gpx:
				return this.garminPlugin.finishReadFromGps();
			case Garmin.DeviceControl.FILE_TYPES.tcx:
			case Garmin.DeviceControl.FILE_TYPES.crs:
			case Garmin.DeviceControl.FILE_TYPES.wkt:
			case Garmin.DeviceControl.FILE_TYPES.tcxProfile:
			case Garmin.DeviceControl.FILE_TYPES.goals:
				return this.garminPlugin.finishReadFitnessData();
			case Garmin.DeviceControl.FILE_TYPES.tcxDir:
			case Garmin.DeviceControl.FILE_TYPES.crsDir:
				return this.garminPlugin.finishReadFitnessDirectory();
			case Garmin.DeviceControl.FILE_TYPES.tcxDetail:
			case Garmin.DeviceControl.FILE_TYPES.crsDetail:
				return this.garminPlugin.finishReadFitnessDetail();
			case Garmin.DeviceControl.FILE_TYPES.fitHealthData:
			case Garmin.DeviceControl.FILE_TYPES.fitDir:
                return this.garminPlugin.finishReadFitDirectory();
			case Garmin.DeviceControl.FILE_TYPES.readableDir:
                return this.garminPlugin.finishReadableFileListing();
		}
	},
	
	/** Internal read dispatching and polling delay.
	 * @private
     */	
	_progressRead: function() {
		this._broadcaster.dispatch("onProgressReadFromDevice", {progress: this.getDeviceStatus(), controller: this});
        setTimeout(function() { this._finishReadFromDevice() }.bind(this), 200); //200		 
	},
	
	/** Internal read state logic. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4 for GPX and TCX history read.<br/>
	 * Minimum plugin version 2.2.0.2 for directory and detail read.<br/>
	 * Minimum plugin version 2.2.0.2 for compressed file get.
	 * 
	 * @private
     */	
	_finishReadFromDevice: function() {
		var completionState = this.getReadCompletionState();
		
		//console.debug("control._finishReadFromDevice this.gpsDataType="+this.gpsDataType+" completionState="+completionState)
        try {
        	
			if( completionState == Garmin.DeviceControl.FINISH_STATES.finished ) {
			    var theSuccess = false;
	        	switch( this.gpsDataType ) {
					case Garmin.DeviceControl.FILE_TYPES.gpxDir:
	        		case Garmin.DeviceControl.FILE_TYPES.gpxDetail:
	        		case Garmin.DeviceControl.FILE_TYPES.gpx:
	        			theSuccess = this.garminPlugin.gpsTransferSucceeded();
	        			if (theSuccess) {
		        			this.gpsDataString = this.garminPlugin.getGpsXml();
							this.gpsData = Garmin.XmlConverter.toDocument(this.gpsDataString);
							this._broadcaster.dispatch("onFinishReadFromDevice", {success: theSuccess, controller: this});	
	        			}
						break;
					case Garmin.DeviceControl.FILE_TYPES.tcx:
					case Garmin.DeviceControl.FILE_TYPES.crs:
					case Garmin.DeviceControl.FILE_TYPES.tcxDir:
					case Garmin.DeviceControl.FILE_TYPES.crsDir:
					case Garmin.DeviceControl.FILE_TYPES.tcxDetail:
					case Garmin.DeviceControl.FILE_TYPES.crsDetail:
					case Garmin.DeviceControl.FILE_TYPES.wkt:
					case Garmin.DeviceControl.FILE_TYPES.tcxProfile:
					case Garmin.DeviceControl.FILE_TYPES.goals:
						theSuccess = this.garminPlugin.fitnessTransferSucceeded();
						if (theSuccess) {
							this.gpsDataString = this.garminPlugin.getTcdXml();
							this.gpsDataStringCompressed = this.garminPlugin.getTcdXmlz();
							
							this.gpsData = Garmin.XmlConverter.toDocument(this.gpsDataString);
							this._broadcaster.dispatch("onFinishReadFromDevice", {success: theSuccess, controller: this});										
						}
						break;
					case Garmin.DeviceControl.FILE_TYPES.fitHealthData:
					case Garmin.DeviceControl.FILE_TYPES.fitDir:
                        theSuccess = this.garminPlugin.fitnessTransferSucceeded();
						this.gpsDataString = this.garminPlugin.getDirectoryXml();
						this.gpsData = Garmin.XmlConverter.toDocument(this.gpsDataString);
						this._broadcaster.dispatch("onFinishReadFromDevice", {success: theSuccess, controller: this});
                        break;
					case Garmin.DeviceControl.FILE_TYPES.readableDir:
						this._appendDirXml(this.garminPlugin.getDirectoryXml());
						++this.fileListingIndex;
						if( this.fileListingIndex < this.fileListingOptions.length) {
							//start the next file listing operation
							this.garminPlugin.startReadableFileListing(this.deviceNumber, 
											   this.fileListingOptions[this.fileListingIndex].dataTypeName,
											   this.fileListingOptions[this.fileListingIndex].dataTypeID,
											   this.fileListingOptions[this.fileListingIndex].computeMD5);
							this._progressRead();
							break;
						} else {
						    //done with file listings
						    theSuccess = true;
						    this._broadcaster.dispatch("onFinishReadFromDevice", {success: theSuccess, controller: this});
                            break;
						}
	        	} //end switch
			} else if( completionState == Garmin.DeviceControl.FINISH_STATES.messageWaiting ) {
				var msg = this._messageWaiting();
				this._broadcaster.dispatch("onWaitingReadFromDevice", {message: msg, controller: this});
			} else {
	    	    this._progressRead();
			}
		} catch( aException ) {
 			this._reportException( aException );
		}
    },

	/** User canceled the read. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
     */	
	cancelReadFromDevice: function() {
		if (this.gpsDataType == Garmin.DeviceControl.FILE_TYPES.gpx) {
			this.garminPlugin.cancelReadFromGps();
		} else {
			this.garminPlugin.cancelReadFitnessData();
		}
    	this._broadcaster.dispatch("onCancelReadFromDevice", {controller: this});
	},
	
	
	/** Return the specified file as a UU-Encoded string
     * <br/>
     * Minimum version 2.6.3.1
     * 
     * If the file is known to be compressed, compressed should be
     * set to false. Otherwise, set compressed to true to retrieve a
     * gzipped and uuencoded file.
     * 
     * @param {String} relativeFilePath path relative to the Garmin folder on the device
     */
     getBinaryFile: function(deviceNumber, relativeFilePath) {
        if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if(this.numDevices == 0)
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
        // Attempt to detect Fit file
        if(relativeFilePath.capitalize().endsWith(".fit")) {
            // Capitalize makes all but first letters lowercase. I can't believe prototype doesn't have a lowercase method. :(
            this.gpsDataType = Garmin.DeviceControl.FILE_TYPES.fit;
        } else {
    		this.gpsDataType = Garmin.DeviceControl.FILE_TYPES.binary;
        }
		var success;
		try {
		    this.gpsDataString = this.garminPlugin.getBinaryFile(deviceNumber, relativeFilePath, false);
		    this.gpsDataStringCompressed = this.garminPlugin.getBinaryFile(deviceNumber, relativeFilePath, true);
		    success = true;
	    } catch(e) {
	        success = false;
			this._reportException(e);
	    }
	    
	    this._broadcaster.dispatch("onFinishReadFromDevice", {success: success, controller: this});
        return this.gpsData;
     },

	/////////////////////// Web Drop Methods (Write) ///////////////////////
	
    /** Writes an address to the currently selected device.
     * 
     * @param {String} address The address to be written to the device. This doesn't check validity
     */	
	writeAddressToDevice: function(address) {
		if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if (!this.geocoder) {
			this.geocoder = new Garmin.Geocode();
			this.geocoder.register(this);
		}
		this.geocoder.findLatLng(address);
	},

	/** Handles call-back from geocoder and forwards call to onException on registered listeners.
	 * @private
     * @param {Error} json error wrapped in JSON 'msg' object.
     */
	onException: function(json) {
		this._reportException(json.msg);
	},
	
	/** Handles call-back from geocoder and forwards call to writeToDevice.
	 * Registered listeners will recieve an onFinishedFindLatLon call before writeToDevice is invoked.
	 * Listeners can change the 'fileName' if they choose avoiding overwritting old waypoints on
	 * some devices.
	 * @private
     * @param {Object} json waypoint, fileName and controller in JSON wrapper.
     */
	onFinishedFindLatLon: function(json) {
		json.fileName = "address.gpx";
		json.controller = this;
		this._broadcaster.dispatch("onFinishedFindLatLon", json);
   		var factory = new Garmin.GpsDataFactory();
		var gpxStr = factory.produceGpxString(null, [json.waypoint]);
		this.writeToDevice(gpxStr, json.fileName);
	},

	/////////////////////// More Write Methods ///////////////////////	
    /**
     * Generic write method for GPX and TCX file formats.  For binary write, use {@link downloadToDevice}.
     * 
     * @param {String} dataType - the datatype to write to device.  Possible values are located in {@link #Garmin.DeviceControl.FILE_TYPES}
     * @param {String} dataString - the datastring to write to device.  Should be in the format of the dataType value.
     * @param {String} fileName - the filename to write the data to on the device. File extension is not necessary, 
     * but is suggested for device compatibility.  This parameter is ignored when the dataType value is FitnessActivityGoals (see {@link #writeGoalsToFitnessDevice}).
     * @see #writeToDevice, #writeFitnessToDevice
     * @throws InvalidTypeException, UnsupportedTransferTypeException
     */ 
    writeDataToDevice: function(dataType, dataString, fileName) {
        if (!this.isUnlocked()) {
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
        }
        
		if (this.numDevices == 0) {
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
        }

		this.gpsDataType = dataType;
        
		if (!this.checkDeviceWriteSupport(this.gpsDataType)) {
			throw new Error(Garmin.DeviceControl.MESSAGES.unsupportedWriteDataType + this.gpsDataType);
		}
		
		try {
        	this._broadcaster.dispatch("onStartWriteToDevice", {controller: this});
            
        	switch(this.gpsDataType) {
            	case Garmin.DeviceControl.FILE_TYPES.gpx:
        			this.garminPlugin.startWriteToGps(dataString, fileName, this.deviceNumber);
        			break;
        		case Garmin.DeviceControl.FILE_TYPES.crs:
        		case Garmin.DeviceControl.FILE_TYPES.wkt:
        		case Garmin.DeviceControl.FILE_TYPES.goals:
        		case Garmin.DeviceControl.FILE_TYPES.tcxProfile:
        		case Garmin.DeviceControl.FILE_TYPES.nlf:                
        			this.garminPlugin.startWriteFitnessData(dataString, this.deviceNumber, fileName, this.gpsDataType);
        			break;
        		default:
					throw new Error(Garmin.DeviceControl.MESSAGES.unsupportedWriteDataType + this.gpsDataType);
        	}
		    this._progressWrite();
	    } catch(e) {
			this._reportException(e);
	   	}
    },
    
    /** Writes the given GPX XML string to the device selected in this.deviceNumber. <br/>
     * <br/>
     * Minimum plugin version 2.0.0.4
     * 
     * @param gpxString XML to be written to the device. This doesn't check validity.
     * @param fileName The filename to write data to.  Validity is not checked here.
     */	
	writeToDevice: function(gpxString, fileName) {
        this.writeDataToDevice(Garmin.DeviceControl.FILE_TYPES.gpx, gpxString, fileName);	    
	},

	/** DEPRECATED - See {@link #writeCoursesToFitnessDevice}<br/> 
	 * <br/>
	 * Writes fitness course data (TCX) to the device selected in this.deviceNumber. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.1
	 * 
     * @param tcxString {String} TCX Course XML string to be written to the device. This doesn't check validity.
     * @param fileName {String} filename to write data to on the device.  Validity is not checked here.
     */	
	writeFitnessToDevice: function(tcxString, fileName) {
		this.writeDataToDevice(Garmin.DeviceControl.FILE_TYPES.crs, tcxString, fileName);
	},

	/** Writes fitness course data (TCX) to the device selected in this.deviceNumber. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.1
	 * 
     * @param tcxString {String} TCX Course XML string to be written to the device. This doesn't check validity.
     * @param fileName {String} filename to write data to on the device.  Validity is not checked here.
     */	
	writeCoursesToFitnessDevice: function(tcxString, fileName) {
		this.writeDataToDevice(Garmin.DeviceControl.FILE_TYPES.crs, tcxString, fileName);
	},

	/** Writes fitness goals data (TCX) string to the device selected in this.deviceNumber. All fitness goals
	 * are written to the filename 'ActivityGoals.TCX' in the device's goals directory, in order for the device
	 * to recognize the file.<br/> 
	 * <br/>
	 * Minimum plugin version 2.2.0.1
	 * 
     * @param tcxString {String} ActivityGoals TCX string to be written to the device. This doesn't check validity.
     */	
	writeGoalsToFitnessDevice: function(tcxString) {
		this.writeDataToDevice(Garmin.DeviceControl.FILE_TYPES.goals, tcxString, '');
	},
	
	/** Writes fitness workouts data (XML) string to the device selected in this.deviceNumber. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.1
	 * 
     * @param tcxString XML (workouts) string to be written to the device. This doesn't check validity.
     * @param fileName String of filename to write it to on the device.  Validity is not checked here.
     */	
	writeWorkoutsToFitnessDevice: function(tcxString, fileName) {
		this.writeDataToDevice(Garmin.DeviceControl.FILE_TYPES.wkt, tcxString, fileName);
	},
	
	/** Writes fitness user profile data (TCX) string to the device selected in this.deviceNumber. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.1
	 * 
     * @param tcxString XML (user profile) string to be written to the device. This doesn't check validity.
     * @param fileName String of filename to write it to on the device.  Validity is not checked here.
     */	
	writeUserProfileToFitnessDevice: function(tcxString, fileName) {
		this.writeDataToDevice(Garmin.DeviceControl.FILE_TYPES.tcxProfile, tcxString, fileName);
	},
	
	/** Downloads and writes binary data asynchronously to device. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
     *
     * @param xmlDownloadDescription {String} xml string containing information about the files to be downloaded onto the device.
     * @param fileName {String} this parameter is ignored!  We will remove this param from the API in a future compatibility release.
     */	
	downloadToDevice: function(xmlDownloadDescription) {
		if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if(this.numDevices == 0)
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
		this.gpsDataType = Garmin.DeviceControl.FILE_TYPES.binary;
		try {
		    this.garminPlugin.startDownloadData(xmlDownloadDescription, this.deviceNumber );
		    this._progressWrite();
	    } catch(e) {
			this._reportException(e);
	    }
	},
	
	/** Internal dispatch and polling delay.
	 * @private
     */	
	_progressWrite: function() {
		//console.debug("control._progressWrite gpsDataType="+this.gpsDataType)		
    	this._broadcaster.dispatch("onProgressWriteToDevice", {progress: this.getDeviceStatus(), controller: this});
        setTimeout(function() { this._finishWriteToDevice() }.bind(this), 200);
	},
	
	/** Internal write lifecycle handling.
	 * @private
     */	
	_finishWriteToDevice: function() {
        try {
			var completionState;
			var success;
			
			switch( this.gpsDataType ) {
				
				case Garmin.DeviceControl.FILE_TYPES.gpx : 
					completionState = this.garminPlugin.finishWriteToGps();
					success = this.garminPlugin.gpsTransferSucceeded();
					break;
				case Garmin.DeviceControl.FILE_TYPES.crs :
				case Garmin.DeviceControl.FILE_TYPES.goals :
				case Garmin.DeviceControl.FILE_TYPES.wkt :
				case Garmin.DeviceControl.FILE_TYPES.tcxProfile :
				case Garmin.DeviceControl.FILE_TYPES.nlf :
					completionState = this.garminPlugin.finishWriteFitnessData();
					success = this.garminPlugin.fitnessTransferSucceeded();
					break;
				case Garmin.DeviceControl.FILE_TYPES.gpi :
				case Garmin.DeviceControl.FILE_TYPES.fitCourse :
				case Garmin.DeviceControl.FILE_TYPES.fitSettings :
				case Garmin.DeviceControl.FILE_TYPES.fitSport :
				case Garmin.DeviceControl.FILE_TYPES.binary :
					completionState = this.garminPlugin.finishDownloadData();
					success = this.garminPlugin.downloadDataSucceeded();
					break;				
				case Garmin.DeviceControl.FILE_TYPES.firmware :
					completionState = this.garminPlugin.finishUnitSoftwareUpdate();
					success = this.garminPlugin.downloadDataSucceeded();
					break;				
				default:
					throw new Error(Garmin.DeviceControl.MESSAGES.unsupportedWriteDataType + this.gpsDataType);
			}
			
			if( completionState == Garmin.DeviceControl.FINISH_STATES.finished ) {
				this._broadcaster.dispatch("onFinishWriteToDevice", {success: success, controller: this});											
			} else if( completionState == Garmin.DeviceControl.FINISH_STATES.messageWaiting ) {
				var msg = this._messageWaiting();
				this._broadcaster.dispatch("onWaitingWriteToDevice", {message: msg, controller: this});
			} else {
	    	     this._progressWrite();
			}
		} catch( aException ) {
 			this._reportException( aException );
		}
	},

	/** Cancels the current write transfer to the device. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4<br/>
     * Minimum plugin version 2.2.0.1 for writes of GPX to SD Card
     */	
	cancelWriteToDevice: function() {
		switch( this.gpsDataType) {
			case Garmin.DeviceControl.FILE_TYPES.gpx:
				this.garminPlugin.cancelWriteToGps();
				break;
			case Garmin.DeviceControl.FILE_TYPES.gpi:
			case Garmin.DeviceControl.FILE_TYPES.binary:
				this.garminPlugin.cancelDownloadData();
				break;
			case Garmin.DeviceControl.FILE_TYPES.firmware:
				this.garminPlugin.cancelUnitSoftwareUpdate();
				break;
			case Garmin.DeviceControl.FILE_TYPES.crs:
			case Garmin.DeviceControl.FILE_TYPES.goals:
			case Garmin.DeviceControl.FILE_TYPES.wkt:
			case Garmin.DeviceControl.FILE_TYPES.tcxProfile:
			case Garmin.DeviceControl.FILE_TYPES.nlf:
				this.garminPlugin.cancelWriteFitnessData();
				break;
		}
		this._broadcaster.dispatch("onCancelWriteToDevice", {controller: this});
	},

    /**
	 * Determine the amount of space available on a mass storage mode device (the
	 * currently selected device according to this.deviceNumber). 
	 * <br/> 
	 * Minimum Plugin version 2.5.1
	 * 
	 * @param {String} relativeFilePath - if a file is being replaced, set to relative path on device, otherwise set to empty string.
	 * @return -1 for non-mass storage mode devices.
	 * @see downloadToDevice 
	 */
	bytesAvailable: function(relativeFilePath) {
	    return this.garminPlugin.bytesAvailable(this.getDeviceNumber(), relativeFilePath);
	},
	
	/** Download and install a list of unit software updates.  Start the asynchronous 
     * StartUnitSoftwareUpdate operation.
     * 
     * Check for completion with the FinishUnitSoftwareUpdate() method.  After
     * completion check the DownloadDataSucceeded property to make sure that all of the downloads 
     * were successfully placed on the device. 
     * 
     * See the Schema UnitSoftwareUpdatev3.xsd for the format of the UpdateResponsesXml description
     *
     * @see Garmin.DeviceControl.cancelWriteToDevice
     * @see Garmin.DevicePlugin.downloadDataSucceeded
     * @see Garmin.DevicePlugin._finishWriteToDevice
     * @version plugin v2.6.2.0
     */
    downloadFirmwareToDevice: function(updateResponsesXml) {
        if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if(this.numDevices == 0)
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
		this.gpsDataType = Garmin.DeviceControl.FILE_TYPES.firmware;
		try {
            this.garminPlugin.startUnitSoftwareUpdate(updateResponsesXml, this.deviceNumber);
		    this._progressWrite();
	    } catch(e) {
			this._reportException(e);
	    }
    },
    
	/////////////////////// Support Methods ///////////////////////	


	/** Unlocks the GpsControl object to be used at the given web address. <br/>
     * <br/>
     * Minimum Plugin version 2.0.0.4
     * 
     * @param {Array} pathKeyPairsArray baseURL and key pairs.  
     * @type Boolean 
     * @return True if the plug-in was unlocked successfully
     */
	unlock: function(pathKeyPairsArray) {
		this.pluginUnlocked = this.garminPlugin.unlock(pathKeyPairsArray);
		return this.pluginUnlocked;
	},

	/** Register to be an event listener.  An object that is registered will be dispatched
     * a method if they have a function with the same dispatch name.  So if you register a
     * listener with an onFinishFindDevices, and the onFinishFindDevices message is called, you'll
     * get that message.  See class comments for event types
     *
     * @param {Object} listener Object that will listen for events coming from this object 
     * @see {Garmin.Broadcaster}
     */	
	register: function(listener) {
        this._broadcaster.register(listener);
	},

	/** True if plugin has been successfully created and unlocked.
	 * @type Boolean
	 */
	 isUnlocked: function() {
	 	return this.pluginUnlocked;
	 },
	 
    /** Responds to a message box on the device.
     * 
     * Minimum version 2.0.0.4
     * 
     * @param {Number} response should be an int which corresponds to a button value from this.garminPlugin.MessageBoxXml
     */
    // TODO: this method only works with writes - should it work with reads?
    respondToMessageBox: function(response) {
        this.garminPlugin.respondToMessageBox(response ? 1 : 2);
        this._progressWrite();
    },

	/** Called when device generates a message.
	 * This occurs when completionState == Garmin.DeviceControl.FINISH_STATES.messageWaiting.
	 * @private
     */	
	_messageWaiting: function() {
		var messageDoc = Garmin.XmlConverter.toDocument(this.garminPlugin.getMessageBoxXml());
		//var type = messageDoc.getElementsByTagName("Icon")[0].childNodes[0].nodeValue;
		var text = messageDoc.getElementsByTagName("Text")[0].childNodes[0].nodeValue;
		
		var message = new Garmin.MessageBox("Question",text);
		
		var buttonNodes = messageDoc.getElementsByTagName("Button");
		for(var i=0; i<buttonNodes.length; i++) {
			var caption = buttonNodes[i].getAttribute("Caption");
			var value = buttonNodes[i].getAttribute("Value");
			message.addButton(caption, value);
		}
		return message;
	},

	/** Get the status/progress of the current state or transfer
     * @type Garmin.TransferProgress
     */	
	getDeviceStatus: function() {
		var aProgressXml = this.garminPlugin.getProgressXml();
		var theProgressDoc = Garmin.XmlConverter.toDocument(aProgressXml);
		
		var title = "";
		if(theProgressDoc.getElementsByTagName("Title").length > 0) {
			title = theProgressDoc.getElementsByTagName("Title")[0].childNodes[0].nodeValue;
		}
		
		var progress = new Garmin.TransferProgress(title);

		var textNodes = theProgressDoc.getElementsByTagName("Text");
		for( var i=0; i < textNodes.length; i++ ) {
			if(textNodes[i].childNodes.length > 0) {
				var text = textNodes[i].childNodes[0].nodeValue;
				if(text != "") progress.addText(text);
			}
		}
		
		var percentageNode = theProgressDoc.getElementsByTagName("ProgressBar")[0];
		if(percentageNode != undefined) {
			if(percentageNode.getAttribute("Type") == "Percentage") {
				progress.setPercentage(percentageNode.getAttribute("Value"));
			} else if (percentageNode.getAttribute("Type") == "Indefinite") {
				progress.setPercentage(100);			
			}
		}

		return progress;
	},
		
	/**
	 * @private
	 */
	_isAMember: function(element, array) {
		return array.any( function(str){ return str==element; } );
	},
	
	/** Gets the version number for the plugin the user has currently installed.
     * @type Array 
     * @return An array of the format [versionMajor, versionMinor, buildMajor, buildMinor].
     * @see #getPluginVersionString
     */	
	getPluginVersion: function() {
		
    	return this.garminPlugin.getPluginVersion();
	},

	/** Gets a string of the version number for the plugin the user has currently installed.
     * @type String 
     * @return A string of the format "versionMajor.versionMinor.buildMajor.buildMinor", i.e. "2.0.0.4"
     * @see #getPluginVersion
     */	
	getPluginVersionString: function() {
		return this.garminPlugin.getPluginVersionString();
	},
	
	/** Sets the required version number for the plugin for the application.
	 * @param reqVersionArray {Array} The required version to set to.  In the format [versionMajor, versionMinor, buildMajor, buildMinor]
	 * 			i.e. [2,2,0,1]
	 */
	setPluginRequiredVersion: function(reqVersionArray) {
		if( reqVersionArray != null ) {
			this.garminPlugin.setPluginRequiredVersion(reqVersionArray);
		}
	},
	
	/** Sets the latest plugin version number.  This represents the latest version available for download at Garmin.
	 * We will attempt to keep the default value of this up to date with each API release, but this is not guaranteed,
	 * so set this to be safe or if you don't want to upgrade to the latest API.
	 * 
	 * @param reqVersionArray {Array} The latest version to set to.  In the format [versionMajor, versionMinor, buildMajor, buildMinor]
	 * 			i.e. [2,2,0,1]
	 */
	setPluginLatestVersion: function(reqVersionArray) {
		if( reqVersionArray != null ) {
			this.garminPlugin.setPluginLatestVersion(reqVersionArray);
		}
	},
	
	/** Determines if the plugin is initialized
     * @type Boolean
     */	
	isPluginInitialized: function() {
		return (this.garminPlugin != null);
	},

	/** Determines if the plugin is installed on the user's machine
     * @type Boolean
     */	
	isPluginInstalled: function() {
		return (this.garminPlugin.getVersionXml() != undefined);
	},

	/** Internal exception handling for asynchronous calls.
	 * @private
      */	
	_reportException: function(exception) {
		this._broadcaster.dispatch("onException", {msg: exception, controller: this});
	},
	
	/** Number of devices detected by plugin.
	 * @type Number
}    */	
	getDevicesCount: function() {
	    return this.numDevices;
	},
	
	/** Checks if the device lists the given datatype as a supported readable type.
	 * Plugin version affects the results of this function.  The latest plugin version is encouraged.
	 * 
	 * Internal file type support (such as directory types) is detected based on base
	 * type. i.e. tcxDir -> tcx, fitDir -> fit
	 */
	checkDeviceReadSupport: function( datatype ) {
		
        // Do the plugin version check early for fit directory reading
		if( datatype == Garmin.DeviceControl.FILE_TYPES.fitDir) {
		    if( this.garminPlugin.getSupportsFitDirectoryRead() == false) {
    	        // Yeah, breaking the 1 return rule... This is still cleaner than all the other options
    	        // and at least eliminates confusion between other types.
		        return false;
		    }
        }
        
		var isDatatypeSupported;

		// The selected device
		var device = this._getDeviceByNumber(this.deviceNumber);
		var baseDatatype;

		// Internal types use base type for the support check.
		switch(datatype) {
			case Garmin.DeviceControl.FILE_TYPES.gpxDir:
			case Garmin.DeviceControl.FILE_TYPES.gpxDetail:
			     baseDatatype = Garmin.DeviceControl.FILE_TYPES.gpx;
			     break;			
            case Garmin.DeviceControl.FILE_TYPES.tcxDir:
            case Garmin.DeviceControl.FILE_TYPES.tcxDetail:
    		    baseDatatype = Garmin.DeviceControl.FILE_TYPES.tcx; 
    		    break;
            case Garmin.DeviceControl.FILE_TYPES.crsDir:
            case Garmin.DeviceControl.FILE_TYPES.crsDetail:
                baseDatatype = Garmin.DeviceControl.FILE_TYPES.crs;
                break;
            case Garmin.DeviceControl.FILE_TYPES.fitDir:
            case Garmin.DeviceControl.FILE_TYPES.fitFile:
                baseDatatype = Garmin.DeviceControl.FILE_TYPES.fit;
                break;
            default:     
                baseDatatype = datatype;
		}
		
		// Special Cases:
		// Every device has a device xml and firmware.
		if(baseDatatype == Garmin.DeviceControl.FILE_TYPES.deviceXml || 
		   baseDatatype == Garmin.DeviceControl.FILE_TYPES.firmware ) {
		    isDatatypeSupported = true;
		}else if(baseDatatype == Garmin.DeviceControl.FILE_TYPES.readableDir) {
		  isDatatypeSupported = device.isFileBased();
		}
		else {
			isDatatypeSupported = device.supportDeviceDataTypeRead(baseDatatype);
			
			//Check device support via alternative means for devices which might
			//not correctly indicate supported datatypes in their GarminDevice.xml files
			if(baseDatatype == Garmin.DeviceControl.FILE_TYPES.fitHealthData && isDatatypeSupported == false)
				isDatatypeSupported = this.doesCurrentDeviceSupportHealth();
		}

		return isDatatypeSupported;
	},
	
	/** Checks if the device lists the given datatype as a supported writeable type.
	 * Plugin version affects the results of this function.  The latest plugin version is encouraged.
	 * 
	 * Internal file types (such as directory types) are NOT detected as supported write types.
	 */
	checkDeviceWriteSupport: function(datatype) {
	    var isDatatypeSupported = false;

		// The selected device
		var device = this._getDeviceByNumber(this.deviceNumber);
		
		// Don't include types that aren't in the Device XML
		if ( datatype == Garmin.DeviceControl.FILE_TYPES.binary 
		  || datatype == Garmin.DeviceControl.FILE_TYPES.gpi) {
		    isDatatypeSupported = true;
		} else {
            isDatatypeSupported = device.supportDeviceDataTypeWrite(datatype);
		}
		
		return isDatatypeSupported;
	},
	
	/** Retrieve a device from the list of found devices by device number. 
	 * @return Garmin.Device
	 */
	_getDeviceByNumber: function(deviceNum) {
		for( var index = 0; index < this.devices.length; index++) {
			if( this.devices[index].getNumber() == deviceNum){
				return this.devices[index];
			}
		}		
	},
	
   /* Internal helper to properly append directory listings
    * @param {String} Raw Directory V1 XML
	* @private
	*/
	_appendDirXml: function(aXml)
	{
		if(!this.gpsDataString) {
			this.gpsDataString = aXml;
			this.gpsData = Garmin.XmlConverter.toDocument(this.gpsDataString);
		} else {
			//merge
			this.gpsData = Garmin.DirectoryUtils.merge(this.gpsDataString, aXml);
			this.gpsDataString = Garmin.XmlConverter.toString(this.gpsData);
		}
	},
	
	/** String representation of instance.
	 * @type String
     */	
	toString: function() {
	    return "Garmin Javascript GPS Controller managing " + this.numDevices + " device(s)";
	}
};

/** Dedicated browser support singleton.
 */
var BrowserSupport = {
    /** Determines if the users browser is currently supported by the plugin
     * @type Boolean
     */	 
	isBrowserSupported: function() {
		// TODO Move this out to plugin layer? 
		return ( (BrowserDetect.OS == "Windows" && 
					(BrowserDetect.browser == "Firefox" 
					|| BrowserDetect.browser == "Mozilla" 
					|| BrowserDetect.browser == "Explorer"
					|| BrowserDetect.browser == "Safari"))
				|| (BrowserDetect.OS == "Mac" && 
					(BrowserDetect.browser == "Firefox" 
					|| BrowserDetect.browser == "Mozilla"
					|| BrowserDetect.browser == "Safari")) );
	}
};

/** Constants defining possible errors messages for various errors on the page
 */
Garmin.DeviceControl.MESSAGES = {
	deviceControlMissing: "Garmin.DeviceControl depends on the Garmin.DevicePlugin framework.",
	missingPluginTag: "Plug-In HTML tag not found.",
	browserNotSupported: "Your browser is not supported by the Garmin Communicator Plug-In.",
	pluginNotInstalled: "Garmin Communicator Plugin NOT detected.",
	outOfDatePlugin1: "Your version of the Garmin Communicator Plug-In is out of date.<br/>Required: ",
	outOfDatePlugin2: "Current: ",
	updatePlugin1: "Your version of the Garmin Communicator Plug-In is not the latest version. Latest version: ",
	updatePlugin2: ", current: ",
	pluginNotUnlocked: "Garmin Plugin has not been unlocked",
	noDevicesConnected: "No device connected, can't communicate with device.",
	invalidFileType: "Cannot process the device file type: ",
	incompleteRead: "Incomplete read, cannot get compressed format.",
	unsupportedReadDataType: "Your device does not support reading of the type: ",
	unsupportedWriteDataType: "Your device does not support writing of the type: "
};

/** Constants defining possible states when you poll the finishActions
 */
Garmin.DeviceControl.FINISH_STATES = {
	idle: 0,
	working: 1,
	messageWaiting: 2,
	finished: 3	
};

/** Constants defining possible file types associated with read and write methods.  File types can
 * be accessed in a static way, like so:<br/>
 * <br/>
 * Garmin.DeviceControl.FILE_TYPES.gpx<br/>
 * <br/>
 * NOTE: 'gpi' is being deprecated--please use 'binary' instead for gpi and other binary data. 
 */
Garmin.DeviceControl.FILE_TYPES = {
	gpx:               "GPSData",
	tcx:               "FitnessHistory",
	gpi:               "gpi", //deprecated, use binary instead
	crs:               "FitnessCourses",
	wkt:               "FitnessWorkouts",
	goals:             "FitnessActivityGoals",
	tcxProfile:        "FitnessUserProfile",
	binary:            "BinaryData", // Not in Device XML, so writing this type is "supported" for all devices. For FIT data, use fitFile.
	voices:            "Voices",
	nlf:               "FitnessNewLeaf",
	fit:               "FITBinary",
	fitCourse:         "FIT_TYPE_6",
	fitSettings:       "FIT_TYPE_2",
	fitSport:          "FIT_TYPE_3",
	fitHealthData:	   "FIT_TYPE_9",
	
	// The following types are internal types used by the API only and cannot be found in the Device XML.
	// NOTE: When adding or removing types to this internal list, modify checkDeviceReadSupport() accordingly.
	readableDir:       "ReadableFilesDirectory",
	tcxDir: 		   "FitnessHistoryDirectory",
	crsDir: 		   "FitnessCoursesDirectory",
	gpxDir: 		   "GPSDataDirectory",
	tcxDetail:         "FitnessHistoryDetail",
	crsDetail: 		   "FitnessCoursesDetail",
	gpxDetail:         "GPSDataDetail",
	deviceXml: 	       "DeviceXml",
	fitDir:     	   "FitDirectory",
	fitFile:    	   "FitFile",
	firmware:          "Firmware"
};

/** Constants defining the strings used by the Device.xml to indicate 
 * transfer direction of each file type
 */
Garmin.DeviceControl.TRANSFER_DIRECTIONS = {
	read:              "OutputFromUnit",
	write:             "InputToUnit",
	both:              "InputOutput"
};

/** Encapsulates the data provided by the device for the current process' progress.
 * Use this to relay progress information to the user.
 * @class Garmin.TransferProgress
 * @constructor 
 */
Garmin.TransferProgress = Class.create();
Garmin.TransferProgress.prototype = {
	initialize: function(title) {
		this.title = title;
		this.text = new Array();
		this.percentage = null;
	},
	
	addText: function(textString) {
		this.text.push(textString);
	},

    /** Get all the text entries for the transfer
     * @type Array
     */	 
	getText: function() {
		return this.text;
	},

    /** Get the title for the transfer
     * @type String
     */	 
	getTitle: function() {
		return this.title;
	},
	
	setPercentage: function(percentage) {
		this.percentage = percentage;
	},

    /** Get the completed percentage value for the transfer
     * @type Number
     */
	getPercentage: function() {
		return this.percentage;
	},

    /** String representation of instance.
     * @type String
     */	 	
	toString: function() {
		var progressString = "";
		if(this.getTitle() != null) {
			progressString += this.getTitle();
		}
		if(this.getPercentage() != null) {
			progressString += ": " + this.getPercentage() + "%";
		}
		return progressString;
	}
};


/** Encapsulates the data to display a message box to the user when the plug-in is waiting for feedback
 * @class Garmin.MessageBox
 * @constructor 
 */
Garmin.MessageBox = Class.create();
Garmin.MessageBox.prototype = {
	initialize: function(type, text) {
		this.type = type;
		this.text = text;
		this.buttons = new Array();
	},

    /** Get the type of the message box
     * @type String
     */	 
	getType: function() {
		return this.type;
	},

    /** Get the text entry for the message box
     * @type String
     */	 
	getText: function() {
		return this.text;
	},

    /** Get the text entry for the message box
     */	 
	addButton: function(caption, value) {
		this.buttons.push({caption: caption, value: value});
	},

    /** Get the buttons for the message box
     * @type Array
     */	 
	getButtons: function() {
		return this.buttons;
	},
	
	getButtonValue: function(caption) {
		for(var i=0; i< this.buttons.length; i++) {
			if(this.buttons[i].caption == caption) {
				return this.buttons[i].value;
			}
		}
		return null;
	},

    /**
	 * @type String
     */	 
	toString: function() {
		return this.getText();
	}
};

/*
 * Dynamic include of required libraries and check for Prototype
 * Code taken from scriptaculous (http://script.aculo.us/) - thanks guys!
var GarminDeviceControl = {
	require: function(libraryName) {
		// inserting via DOM fails in Safari 2.0, so brute force approach
		document.write('<script type="text/javascript" src="'+libraryName+'"></script>');
	},

	load: function() {
		if((typeof Prototype=='undefined') || 
			(typeof Element == 'undefined') || 
			(typeof Element.Methods=='undefined') ||
			parseFloat(Prototype.Version.split(".")[0] + "." +
			Prototype.Version.split(".")[1]) < 1.5) {
			throw("GarminDeviceControl requires the Prototype JavaScript framework >= 1.5.0");
		}

		$A(document.getElementsByTagName("script"))
		.findAll(
			function(s) {
				return (s.src && s.src.match(/GarminDeviceControl\.js(\?.*)?$/))
			}
		)
		.each(
			function(s) {
				var path = s.src.replace(/GarminDeviceControl\.js(\?.*)?$/,'../../');
				var includes = s.src.match(/\?.*load=([a-z,]*)/);
				var dependencies = 'garmin/device/GarminDevicePlugin' +
									',garmin/device/GarminDevice' +
									',garmin/util/Util-XmlConverter' +
									',garmin/util/Util-Broadcaster' +
									',garmin/util/Util-DateTimeFormat' +
									',garmin/util/Util-BrowserDetect' +
									',garmin/util/Util-PluginDetect' +
									',garmin/device/GarminObjectGenerator';
			    (includes ? includes[1] : dependencies).split(',').each(
					function(include) {
						GarminDeviceControl.require(path+include+'.js') 
					}
				);
			}
		);
	}
}

GarminDeviceControl.load();
 */
