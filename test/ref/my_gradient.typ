#let my-gradient = gradient.linear(
  // test comment
  (rgb("#123456"), 0.0%),
  (rgb("#ABCDEF"), 100.0%),
  space: rgb,
)

#rect(fill: my-gradient, width: 100%)
