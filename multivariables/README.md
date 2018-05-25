# Multi-Variables

Multi-Variables provides a method of piecemeal storing strings of data in CYS's integer variable system and then retrieving and inserting them into a storygame in a manner similar to on-page coding.

## Usage

To begin, create a new `MultiVariable` object.

```JavaScript
var multiVariable = new MultiVariable();
```

New variable sets can be added to this with either the `add()` or `create()` method.

```JavaScript
MultiVariable.add(options);

var multiVariableInstance = MultiVariable.create(options);
```

## The `MultiVariable` Object

`MultiVariable` holds a collection of instances.

### Methods

#### `.add(options)`

Adds an instance with the supplied options to the `MultiVariable` object and then returns the `MultiVariable` object. Because of this, multiple `add()`s can be chained together.

| parameter           | type                                       | default          | description                                                                                                                           |
|---------------------|--------------------------------------------|------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| options             | Object                                     | *none*           |                                                                                                                                       |
| options.default     | string                                     | `null`           | Default value for the input element                                                                                                   |
| options.filter      | RegExp or [Filter preset](#filter)         | `null`           | Filters the matched characters out of the input element                                                                               |
| options.input       | string                                     | `null`           | Id for the input element                                                                                                              |
| options.length      | number                                     | `8`              | Max length of the input element                                                                                                       |
| options.prefix      | string                                     | `MULTIVARIABLE#` | The string prefixed to this instance's CYS variables                                                                                  |
| options.replace     | RegExp or string                           | `null`           | Replaces the matched characters with the instance's value                                                                             |
| options.transform   | Function or [Transform preset](#transform) | `null`           | Arbitrary operation performed on the input element's value. Takes one argument (string) and should return a string                    |
| options.serialize   | Function                                   | `null`           | Custom function that converts its one, single-character argument into a 32-bit integer. An `options.deserialize` must also be defined |
| options.deserialize | Function                                   | `null`           | Custom function that converts its one, 32-bit integer argument into a single character. An `options.serialize` must also be defined   |

#### `.create(options)`

Same as the `add()` method, but returns the instance instead of the `MultiVariable` object. This means that multiple `create()`s cannot be chained together.

#### `.get(index)`

Returns the instance at the provided index.

#### `.entries()`

Returns an array of all of the `MultiVariable` object's instances.

### Presets

#### Filter

| value                | description                                                                      |
|----------------------|----------------------------------------------------------------------------------|
| `INTEGER`            | Removes non-integers                                                             |
| `NATURAL`            | Same as `INTEGER`, but disallowing negatives                                     |
| `NAME`               | Removes non-letters, but allows dashes and apostrophes in the middle of the name |
| `NAME_INTERNATIONAL` | Same as `NAME`, but allowing accented letters                                    |

#### Transform

| value       | description                                                                                                  |
|-------------|--------------------------------------------------------------------------------------------------------------|
| `LOWERCASE` | Makes all letters lowercase                                                                                  |
| `NAME`      | Capitalizes the initial letter, as well as any letters following a dash, and makes everything else lowercase |
| `UPPERCASE` | Makes all letters uppercase                                                                                  |

## Example

This example provides a simple storygame

### Global Page Script

First, the multivariable script is loaded. Then a `MultiVariable` object is created and an instance is added to it.

This `MultiVariable` instance can be at maximum 12 letters long, accepts only name characters, assigns its values to variables prefixed with `%NAME`, and is captured by the `<input>` element with the id "playerName". On-page, it replaces any instance of `$$NAME$$`.

```HTML
$PAGETEXT := "
<script src='https://cdn.rawgit.com/BradinDvorak/CYS-plugins/f15d6269/multivariables/multivariables.min.js'></script>
<script>
var multiVariable = new MultiVariable();

multiVariable.add({
  filter: 'NAME_INTERNATIONAL',
  input: 'playerName',
  length: 12,
  prefix: 'NAME',
  replace: '$$NAME$$',
  transform: 'NAME'
});
</script>
" + $PAGETEXT
```

### Page 1

This page is where the user is prompted to type in their name. It contains an `<input>` element with the id "playerName".

```HTML
<p>What is your name?</p>
<input id="playerName" type="text">
```

### Page 1 Link Script

The "accept"/"continue" link that leads to Page 2. This script ensures that the player cannot enter an empty name by returning to Page 1 if the first `%NAME` variable is zero.

```Go
IF %NAME0 = 0 THEN $DEST := @NONE
```

### Page 2

Finally, the player's name is displayed to them, the text `$$NAME$$` being replaced with the name they entered.

```HTML
<p>Hello, $$NAME$$.</p>
```
