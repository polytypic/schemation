const show = x => JSON.stringify(x)

//

const isBoolean = json => typeof json === "boolean"
const isNumber = json => typeof json === "number"
const isString = json => typeof json === "string"
const isArray = json => json && json.constructor === Array
const isObject = json => json && json.constructor === Object

//

function atom(schema, json) {
  if (schema !== json)
    return new Mismatch(json)
}

function regexp(schema, json) {
  if (!isString(json) || !schema.test(json))
    return new Mismatch(json)
}

function object(schema, json) {
  if (!isObject(json))
    return new Mismatch(json)

  for (const i in schema) {
    const m = test(schema[i], json[i])
    if (m)
      return new MismatchAt(m, i)
  }
}

function array(schema, json) {
  if (schema.length !== 1)
    throw new Error("Array literal schema must contain exactly one element")

  if (!isArray(json))
    return new Mismatch(json)

  const schema0 = schema[0]

  for (let i=0; i<json.length; ++i) {
    const m = test(schema0, json[i])
    if (m)
      return new MismatchAt(m, i)
  }
}

function test(schema, json) {
  switch (schema && schema.constructor) {
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
    throw new Error(`Unknown schema: ${json}`)
  }
}

//

export const tryMatch = (schema, onMatch, onMismatch) => json => {
  const m = test(schema, json)
  return m ? onMismatch(m) : onMatch(json)
}

export const validate = schema =>
  tryMatch(schema, x => x, m => {throw new Error(m)})

//

export const any = () => {}

export const optional = schema => json =>
  undefined === json ? undefined : test(schema, json)

export const where = predicate => json =>
  predicate(json) ? undefined : new Mismatch(json)

export const boolean = where(isBoolean)
export const number = where(isNumber)
export const string = where(isString)

export const or = (...schemas) => json => {
  const ms = []

  for (const schema of schemas) {
    const m = test(schema, json)
    if (!m)
      return
    ms.push(m)
  }

  return new Mismatches(ms)
}

export const and = (...schemas) => json => {
  for (const schema of schemas) {
    const m = test(schema, json)
    if (m)
      return m
  }
}

export const not = schema => json =>
  test(schema, json) ? undefined : new Mismatch(json)

//

export function Mismatch(value) {
  this.value = value
}

Mismatch.prototype.toString = function() {
  return show(this.value)
}

export function MismatchAt(mismatch, index) {
  this.mismatch = mismatch
  this.index = index
}

MismatchAt.prototype.toString = function() {
  return isNumber(this.index)
    ? `[... ${show(this.index)}: ${this.mismatch.toString()} ...]`
    : `{... ${show(this.index)}: ${this.mismatch.toString()} ...}`
}

export function Mismatches(mismatches) {
  this.mismatches = mismatches
}

Mismatches.prototype.toString = function() {
  return Array.from(new Set(this.mismatches.map(x => x.toString())))
    .join(" and ")
}
