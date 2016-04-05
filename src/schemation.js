const constructor = x =>
  x === null || x === undefined ? x : Object.getPrototypeOf(x).constructor

//

export function Mismatch(value) {
  this.value = value
}

Mismatch.prototype.toString = function() {
  switch (typeof this.value) {
  case "string":
  case "object":
    return JSON.stringify(this.value)
  default:
    return `${this.value}`
  }
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

const testAtom = (schema, json) => {
  if (schema !== json)
    return new Mismatch(json)
}

const testRegExp = (schema, json) => {
  if (constructor(json) !== String || !schema.test(json))
    return new Mismatch(json)
}

const testProp = (schema, i, json) => {
  if (schema instanceof Optional) {
    if (i in json)
      return test(schema.schema, json[i])
  } else {
    return i in json ? test(schema, json[i]) : new Mismatch()
  }
}

const testObject = (schemas, json) => {
  if (constructor(json) !== Object)
    return new Mismatch(json)

  for (const i in schemas) {
    const m = testProp(schemas[i], i, json)
    if (m)
      return new MismatchAt(m, i)
  }
  return anyObject(json, schemas)
}

const testArray = (schema, json) => {
  if (schema.length !== 1)
    throw new Error("Array literal schema must contain exactly one element")

  if (constructor(json) !== Array)
    return new Mismatch(json)

  const schema0 = schema[0]

  for (let i=0, n=json.length; i<n; ++i) {
    const m = test(schema0, json[i])
    if (m)
      return new MismatchAt(m, i)
  }
}

const test = (schema, json) => {
  switch (constructor(schema)) {
  case null:
  case String:
  case Number:
  case Boolean:
    return testAtom(schema, json)
  case RegExp:
    return testRegExp(schema, json)
  case Array:
    return testArray(schema, json)
  case Object:
    return testObject(schema, json)
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

export const matches = schema => tryMatch(schema, () => true, () => false)

export const validate = schema =>
  tryMatch(schema, json => json, m => {throw new Error(m)})

//

export const array = Object.freeze([json => any(json)])
export const object = Object.freeze({})

export const anyObject = (json, ignored = object) => {
  for (const i in json) {
    if (i in ignored)
      continue
    const m = any(json[i])
    if (m)
      return new MismatchAt(m, i)
  }
}

export const any = json => {
  switch (constructor(json)) {
  case null:
  case String:
  case Boolean:
    return
  case Number:
    if (Number.isFinite(json))
      return
    break
  case Array:
    return testArray(array, json)
  case Object:
    return anyObject(json)
  }
  return new Mismatch(json)
}

function Optional(schema) {
  this.schema = schema
}

export const lazy = toSchema => json => test(toSchema(), json)

export const optional = schema => new Optional(schema)

export const where = predicate => json =>
  predicate(json) ? undefined : new Mismatch(json)

export const boolean = where(x => x === true || x === false)
export const number  = where(Number.isFinite)
export const string  = /(?:)/

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
