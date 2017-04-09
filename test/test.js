import {and, any, number, optional, or, lazy} from "../dist/schemation.cjs"
import {tryMatch, validate} from "../dist/schemation.cjs"

const branch = {lhs: optional(lazy(() => branch)),
                key: number,
                rhs: optional(lazy(() => branch))}
const tree = or(null, branch)

const isntType = type => json => typeof json !== type

const assertEq = expected => actual => {
  if (expected !== actual)
    throw new Error(`Expected ${expected}, but got ${actual}`)
}

const show = x => {
  switch (typeof x) {
  case "string":
  case "object":
    return JSON.stringify(x)
  default:
    return `${x}`
  }
}

const E = schema =>
  eval(`(and, any, number, optional, or, lazy, tree) => (${schema})`)(
         and, any, number, optional, or, lazy, tree)

const matches = (schema, ...jsons) => jsons.forEach(
  json => it(`${schema} matches ${show(json)}`, () => {
    if (json !== validate(E(schema))(json))
      throw new Error("Didn't return same value")
  }))

const mismatches = (schema, ...jsons) => jsons.forEach(
  json => it(`${schema} mismatches ${show(json)}`, () => {
    let raised
    try {
      validate(E(schema))(json)
    } catch (e) {
      raised = e
    }
    if (!(raised instanceof Error))
      throw new Error("Didn't raise Error")
  }))

const basicJSON = [null, 0, 1, false, true, "", [], {}]
const nonJSON = [NaN, Infinity, -Infinity, undefined]

describe("/.../", () => {
  mismatches("/.*/", ...basicJSON.filter(isntType("string")))

  matches("/^full$/", "full")
  mismatches("/^full$/", " full ")

  matches("/partial/", "partial")
  matches("/partial/", " partial ")
})

describe("...", () => {
  mismatches('""', ...basicJSON.filter(isntType("string")))
  matches('""', "")
  matches('"x"', "x")
})

describe("<number>", () => {
  mismatches("0", ...basicJSON.filter(isntType("number")).concat([1]))
  mismatches("1", ...basicJSON.filter(isntType("number")).concat([0]))
  matches("1", 1)
  matches("0", 0)
})

describe("any", () => {
  matches("any", ...basicJSON)
  mismatches("any", ...nonJSON)
})

describe("and", () => {
  matches("and()", ...basicJSON)
  mismatches("and(0,1)", 0)
})

describe("number", () => {
  mismatches("number", ...basicJSON.filter(isntType("number")))
})

describe("or", () => {
  mismatches("or()", ...basicJSON)

  matches("or(1, 2, or(3))", 1, 2, 3)
  mismatches("or(1, 2, or(3))", 0)
})

describe("{ ... }", () => {
  mismatches("{}", ...basicJSON.filter(isntType("object")))
  matches("{}", {})
  matches("{required: true}", {required: true, extra: 1})
  mismatches("{required: true}", {extra: 1})
  matches("{optional: optional(1)}", {})
  matches("{optional: optional(1)}", {optional: 1})
  mismatches("{optional: optional(1)}", {optional: optional(2)})
})

describe("mismatch", () => {
  it("format", () => {
    tryMatch(
      or({x: 1}, {y: [1]}),
      assertEq(),
      mismatch =>
        assertEq('{... "x": undefined ...} and {... "y": [... 0: 2 ...] ...}')(mismatch.toString()))({y: [2]})
  })
})

describe("lazy", () => {
  matches("tree", null)
  matches("tree", {key: 1})
  matches("tree", {lhs: {key: 0}, key: 1, rhs: {lhs: {key: 2}, key: 3, rhs: {key: 4}}})
})
