[![npm version](https://badge.fury.io/js/schemation.svg)](http://badge.fury.io/js/schemation)

## Schema grammar

```javascript
import {and, any, boolean, not, number, optional, or, string, where} from "schemation"
```

```javascript
<schema> ::= /.../
           | <atom>
           | [ <schema> ]
           | and( <schema>, ... )
           | any
           | boolean
           | lazy( () => <schema> )
           | not( <schema> )
           | number
           | or( <schema>, ... )
           | string
           | where( <predicate> )
           | { <prop>, ... }

  <prop> ::= "...": <schema>
           | "...": optional( <schema> )

  <atom> ::= "..."
           | <number>
           | false
           | null
           | true
```

## Entry points

```javascript
import {matches, tryMatch, validate} from "schemation"
```

```javascript
matches(schema)(json)
  => true
   | false
```

```javascript
tryMatch(schema, onMatch, onMismatch)(json)
  => onMatch(json)
   | onMismatch(mismatch)
```

```javascript
validate(schema)(json)
  => json
   | throw new Error(mismatch)
```

## Mismatches

```javascript
import {Mismatch, MismatchAt, Mismatches} from "schemation"
```

```javascript
mismatch ::= Mismatch {value}
           | MismatchAt {mismatch, index}
           | Mismatches {mismatches}
```

```javascript
mismatch.toString()
```

## Extending

For example, given

```javascript
const empty = where(x => x.length === 0)
```

the expression

```javascript
and([any], not(empty))
```

matches any non-empty array.

## Example

```javascript
const SetOfProducts = [
  {
    id: number,
    name: string,
    price: and(number, where(x => 0 < x)),
    tags: optional(and([string], not(empty))),
    dimensions: optional({
      length: number,
      width: number,
      height: number
    }),
    warehouselocation: optional({
      latitude: number,
      longitude: number
    })
  }
]
```
