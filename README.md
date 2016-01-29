[![npm version](https://badge.fury.io/js/schemation.svg)](http://badge.fury.io/js/schemation)

## Schema grammar

```javascript
import {any, boolean, number, string} from "schemation"
import {and, not, or}                 from "schemation"
import {where}                        from "schemation"
import {optional}                     from "schemation"
import {lazy}                         from "schemation"
```

```javascript
   <schema> ::= <class>
              | <lazy>
              | <logical>
              | <predicate>
              | <shape>

    <class> ::= any
              | boolean
              | number
              | string

     <lazy> ::= lazy( () => <schema> )

  <logical> ::= and( <schema>, ... )
              | not( <schema> )
              |  or( <schema>, ... )

<predicate> ::= /.../
              | where( <predicate> )

    <shape> ::= false | true
              | "..."
              | <number>
              | [ <schema> ]
              | null
              | { <property>, ... }

 <property> ::= "...":           <schema>
              | "...": optional( <schema> )
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
