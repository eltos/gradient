---
name: Request new flavour of code generation
about: Enable copy&pasting of color gradient code for a new framework
title: '[NEW FLAVOUR]'
labels: enhancement, new-flavour
assignees: ''

---

Name the programing language and/or framework the gradient color code should be generated for.
Insert links to documentation that describes the syntax.

```
Insert an example for generated code here
```

**Implementation**

If you want to provide an implementation for code generation, start with the template below

```javascript
function gradient_as_xxxxxx(gradient, name, comment) {
  return "      " + name + "\n" +
    (comment ? "    // " + comment + "\n" : "") +
    gradient.map(x =>
      x.pos,          // 0 .. 1
      x.posPercent,   // 0% .. 100%
      x.pos255,       // 0 .. 255
      x.posHex,       // 00 .. FF
      x.color,        // 0 .. 1
      x.colorHex      // 000000 .. FFFFFF
      // use `.toFixed(3)` and `.padStart(6, " ")` etc. for pretty formatting
    ).join("\n") + ")";
}
```