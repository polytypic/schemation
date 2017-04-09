var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var constructor = function constructor(x) {
  return x === null || x === undefined ? x : Object.getPrototypeOf(x).constructor;
};

//

function Mismatch(value) {
  this.value = value;
}

Mismatch.prototype.toString = function () {
  switch (_typeof(this.value)) {
    case "string":
    case "object":
      return JSON.stringify(this.value);
    default:
      return "" + this.value;
  }
};

function MismatchAt(mismatch, index) {
  this.mismatch = mismatch;
  this.index = index;
}

MismatchAt.prototype.toString = function () {
  return constructor(this.index) === Number ? "[... " + this.index + ": " + this.mismatch + " ...]" : "{... " + JSON.stringify(this.index) + ": " + this.mismatch + " ...}";
};

function Mismatches(mismatches) {
  this.mismatches = mismatches;
}

Mismatches.prototype.toString = function () {
  return Array.from(new Set(this.mismatches.map(function (x) {
    return x.toString();
  }))).join(" and ");
};

//

var testAtom = function testAtom(schema, json) {
  if (schema !== json) return new Mismatch(json);
};

var testRegExp = function testRegExp(schema, json) {
  if (constructor(json) !== String || !schema.test(json)) return new Mismatch(json);
};

var testProp = function testProp(schema, i, json) {
  if (schema instanceof Optional) {
    if (i in json) return test(schema.schema, json[i]);
  } else {
    return i in json ? test(schema, json[i]) : new Mismatch();
  }
};

var testObject = function testObject(schemas, json) {
  if (constructor(json) !== Object) return new Mismatch(json);

  for (var i in schemas) {
    var m = testProp(schemas[i], i, json);
    if (m) return new MismatchAt(m, i);
  }
  return anyObject(json, schemas);
};

var testArray = function testArray(schema, json) {
  if (schema.length !== 1) throw new Error("Array literal schema must contain exactly one element");

  if (constructor(json) !== Array) return new Mismatch(json);

  var schema0 = schema[0];

  for (var i = 0, n = json.length; i < n; ++i) {
    var m = test(schema0, json[i]);
    if (m) return new MismatchAt(m, i);
  }
};

var test = function test(schema, json) {
  switch (constructor(schema)) {
    case null:
    case String:
    case Number:
    case Boolean:
      return testAtom(schema, json);
    case RegExp:
      return testRegExp(schema, json);
    case Array:
      return testArray(schema, json);
    case Object:
      return testObject(schema, json);
    case Function:
      return schema(json);
    default:
      throw new Error("Unknown schema: " + schema);
  }
};

//

var tryMatch = function tryMatch(schema, onMatch, onMismatch) {
  return function (json) {
    var m = test(schema, json);
    return m ? onMismatch(m) : onMatch(json);
  };
};

var matches = function matches(schema) {
  return tryMatch(schema, function () {
    return true;
  }, function () {
    return false;
  });
};

var validate = function validate(schema) {
  return tryMatch(schema, function (json) {
    return json;
  }, function (m) {
    throw new Error(m);
  });
};

//

var array = Object.freeze([function (json) {
  return any(json);
}]);
var object = Object.freeze({});

var anyObject = function anyObject(json) {
  var ignored = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : object;

  for (var i in json) {
    if (i in ignored) continue;
    var m = any(json[i]);
    if (m) return new MismatchAt(m, i);
  }
};

var any = function any(json) {
  switch (constructor(json)) {
    case null:
    case String:
    case Boolean:
      return;
    case Number:
      if (Number.isFinite(json)) return;
      break;
    case Array:
      return testArray(array, json);
    case Object:
      return anyObject(json);
  }
  return new Mismatch(json);
};

function Optional(schema) {
  this.schema = schema;
}

var lazy = function lazy(toSchema) {
  return function (json) {
    return test(toSchema(), json);
  };
};

var optional = function optional(schema) {
  return new Optional(schema);
};

var where = function where(predicate) {
  return function (json) {
    return predicate(json) ? undefined : new Mismatch(json);
  };
};

var boolean = where(function (x) {
  return x === true || x === false;
});
var number = where(Number.isFinite);
var string = /(?:)/;

var or = function or() {
  for (var _len = arguments.length, schemas = Array(_len), _key = 0; _key < _len; _key++) {
    schemas[_key] = arguments[_key];
  }

  return function (json) {
    var ms = [];
    for (var i = 0, n = schemas.length; i < n; ++i) {
      var m = test(schemas[i], json);
      if (!m) return;
      ms.push(m);
    }
    return new Mismatches(ms);
  };
};

var and = function and() {
  for (var _len2 = arguments.length, schemas = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    schemas[_key2] = arguments[_key2];
  }

  return function (json) {
    for (var i = 0, n = schemas.length; i < n; ++i) {
      var m = test(schemas[i], json);
      if (m) return m;
    }
  };
};

var not = function not(schema) {
  return function (json) {
    return test(schema, json) ? undefined : new Mismatch(json);
  };
};

export { Mismatch, MismatchAt, Mismatches, tryMatch, matches, validate, array, object, anyObject, any, lazy, optional, where, boolean, number, string, or, and, not };
