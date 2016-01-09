const hasType = type => json => typeof json === type
const constructor = json => null === json ? json : json.constructor

//

export function Mismatch(value) {
  this.value = value
}

Mismatch.prototype.toString = function() {
  return JSON.stringify(this.value)
}

export function MismatchAt(mismatch, index) {
  this.mismatch = mismatch
  this.index = index
}

MismatchAt.prototype.toString = function() {
  return constructor(this.index) === Number
    ? `[... ${this.index}: ${this.mismatch} ...]`
    : `{... ${JSON.stringify(this.index)}: ${this.mismatch} ...}`
}

export function Mismatches(mismatches) {
  this.mismatches = mismatches
}

Mismatches.prototype.toString = function() {
  return Array.from(new Set(this.mismatches.map(x => x.toString())))
    .join(" and ")
}

//

function atom(schema, json) {
  if (schema !== json)
    return new Mismatch(json)
}

function regexp(schema, json) {
  if (constructor(json) !== String || !schema.test(json))
    return new Mismatch(json)
}

function testProp(schema, i, json) {
  if (schema instanceof Optional) {
    if (i in json)
      return test(schema.schema, json[i])
  } else {
    return i in json ? test(schema, json[i]) : new Mismatch()
  }
}

function object(schemas, json) {
  if (constructor(json) !== Object)
    return new Mismatch(json)

  for (const i in schemas) {
    const m = testProp(schemas[i], i, json)
    if (m)
      return new MismatchAt(m, i)
  }
}

function array(schema, json) {
  if (schema.length !== 1)
    throw new Error("Array literal schema must contain exactly one element")

  if (constructor(json) !== Array)
    return new Mismatch(json)

  const schema0 = schema[0]

  for (let i=0; i<json.length; ++i) {
    const m = test(schema0, json[i])
    if (m)
      return new MismatchAt(m, i)
  }
}

function test(schema, json) {
  switch (constructor(schema)) {
  case null:
  case String:
  case Number:
  case Boolean:
    return atom(schema, json)
  case RegExp:
    return regexp(schema, json)
  case Array:
    return array(schema, json)
  case Object:
    return object(schema, json)
  case Function:
    return schema(json)
  default:
    throw new Error(`Unknown schema: ${schema}`)
  }
}

//

export const tryMatch = (schema, onMatch, onMismatch) => json => {
  const m = test(schema, json)
  return m ? onMismatch(m) : onMatch(json)
}

export const validate = schema =>
  tryMatch(schema, json => json, m => {throw new Error(m)})

//

export const any = () => {}

function Optional(schema) {
  this.schema = schema
}

export const optional = schema => new Optional(schema)

export const where = predicate => json =>
  predicate(json) ? undefined : new Mismatch(json)

export const boolean = where(hasType("boolean"))
export const number  = where(hasType("number"))
export const string  = where(hasType("string"))

export const or = (...schemas) => json => {
  const ms = []
  for (let i=0, n=schemas.length; i<n; ++i) {
    const m = test(schemas[i], json)
    if (!m)
      return
    ms.push(m)
  }
  return new Mismatches(ms)
}

export const and = (...schemas) => json => {
  for (let i=0, n=schemas.length; i<n; ++i) {
    const m = test(schemas[i], json)
    if (m)
      return m
  }
}

export const not = schema => json =>
  test(schema, json) ? undefined : new Mismatch(json)
