
describe('dedent', () => {
  it('test 1', () => {
    const output = dedent`
      ${42}
    `
    expect(output).toBe("42\n");
  });

  it('test 2', () => {
    const output = dedent`
      func(${1+1},
        ${"x"} = ${"[\n  A,\n  B\n]"}
      )
    `
    expect(output).toBe(
      "func(2,\n" +
      "  x = [\n" +
      "    A,\n" +
      "    B\n" +
      "  ]\n" +
      ")\n");
  });
});

describe('CodeFlavourCSS', () => {
  it('generate', () => {
    const g = Gradient.fromHash("0:365AA9-32.2:ABCD39-64:BFD336-77:B7D135-91.3:019C5C");
    const output = CodeFlavourCSS.generate(g, "my gradient", "test comment");

    expect(output).toBe(
      "linear-gradient(90deg,\n" +
      "    /* test comment */\n" +
      "    #365AA9    0.0%,\n" +
      "    #ABCD39   32.2%,\n" +
      "    #BFD336   64.0%,\n" +
      "    #B7D135   77.0%,\n" +
      "    #019C5C   91.3%)");
  });

  it('file', async () => {
    const g = Gradient.fromHash("123456-ABCDEF");
    const output = CodeFlavourCSS.file(g, "my gradient", "test comment");

    expect(output).toBe(await fetch("/base/ref/my_gradient.css").then(r => r.text()));

  });

});

describe('CodeFlavourFastLED', () => {
  it('generate', () => {
    const g = Gradient.fromHash("0:365AA9-32.2:ABCD39-64:BFD336-77:B7D135-91.3:019C5C");
    const output = CodeFlavourFastLED.generate(g, "my gradient", "test comment");

    expect(output).toBe(
      "DEFINE_GRADIENT_PALETTE( my_gradient ){\n" +
      "    /* test comment */\n" +
      "      0,   54,  90, 169,\n" +
      "     82,  171, 205,  57,\n" +
      "    163,  191, 211,  54,\n" +
      "    196,  183, 209,  53,\n" +
      "    232,    1, 156,  92,\n" +
      "    255,    1, 156,  92};");
  });

  it('file', async () => {
    const g = Gradient.fromHash("123456-ABCDEF");
    const output = CodeFlavourFastLED.file(g, "my gradient", "test comment");

    expect(output).toBe(await fetch("/base/ref/my_gradient.ino").then(r => r.text()));
  });
});

describe('CodeFlavourMatplotlib', () => {
  it('generate', () => {
    const g = Gradient.fromHash("0:365AA9-32.2:ABCD39-64:BFD336-77:B7D135-91.3:019C5C");
    const output = CodeFlavourMatplotlib.generate(g, "my gradient", "test comment");

    expect(output).toBe(
      "LinearSegmentedColormap.from_list('my gradient', (\n" +
      "    # test comment\n" +
      "    (0.000, (0.212, 0.353, 0.663)),\n" +
      "    (0.322, (0.671, 0.804, 0.224)),\n" +
      "    (0.640, (0.749, 0.827, 0.212)),\n" +
      "    (0.770, (0.718, 0.820, 0.208)),\n" +
      "    (0.913, (0.004, 0.612, 0.361)),\n" +
      "    (1.000, (0.004, 0.612, 0.361))))");
  });

  it('file', async () => {
    const g = Gradient.fromHash("123456-ABCDEF");
    const output = CodeFlavourMatplotlib.file(g, "my gradient", "test comment");

    expect(output).toBe(await fetch("/base/ref/my_gradient.py").then(r => r.text()));

  });
});

describe('CodeFlavourPlotlyPy', () => {
  it('generate', () => {
    const g = Gradient.fromHash("0:365AA9-32.2:ABCD39-64:BFD336-77:B7D135-91.3:019C5C");
    const output = CodeFlavourPlotlyPy.generate(g, "my gradient", "test comment");

    expect(output).toBe(
      "my_gradient = [\n" +
      "    # test comment\n" +
      "    [0.000, '#365AA9'],\n" +
      "    [0.322, '#ABCD39'],\n" +
      "    [0.640, '#BFD336'],\n" +
      "    [0.770, '#B7D135'],\n" +
      "    [0.913, '#019C5C'],\n" +
      "    [1.000, '#019C5C']]");
  });

  it('file', async () => {
    const g = Gradient.fromHash("123456-ABCDEF");
    const output = CodeFlavourPlotlyPy.file(g, "my gradient", "test comment");

    expect(output).toBe(await fetch("/base/ref/my_gradient.ipynb").then(r => r.text()));

  });
});

describe('CodeFlavourTypst', () => {
  it('generate', () => {
    const g = Gradient.fromHash("0:365AA9-32.2:ABCD39-64:BFD336-77:B7D135-91.3:019C5C");
    const output = CodeFlavourTypst.generate(g, "my gradient", "test comment");

    expect(output).toBe(
      "#let my-gradient = gradient.linear(\n" +
      "  // test comment\n" +
      "  (rgb(\"#365AA9\"), 0.0%),\n" +
      "  (rgb(\"#ABCD39\"), 32.2%),\n" +
      "  (rgb(\"#BFD336\"), 64.0%),\n" +
      "  (rgb(\"#B7D135\"), 77.0%),\n" +
      "  (rgb(\"#019C5C\"), 91.3%),\n" +
      "  (rgb(\"#019C5C\"), 100.0%),\n" +
      "  space: rgb,\n" +
      ")");
  });

  it('file', async () => {
    const g = Gradient.fromHash("123456-ABCDEF");
    const output = CodeFlavourTypst.file(g, "my gradient", "test comment");

    expect(output).toBe(await fetch("/base/ref/my_gradient.typ").then(r => r.text()));

  });
});

describe('CodeFlavourPlotlyJs', () => {
  it('generate', () => {
    const g = Gradient.fromHash("0:365AA9-32.2:ABCD39-64:BFD336-77:B7D135-91.3:019C5C");
    const output = CodeFlavourPlotlyJs.generate(g, "my gradient", "test comment");

    expect(output).toBe(
      "let my_gradient = [\n" +
      "    // test comment\n" +
      "    [0.000, '#365AA9'],\n" +
      "    [0.322, '#ABCD39'],\n" +
      "    [0.640, '#BFD336'],\n" +
      "    [0.770, '#B7D135'],\n" +
      "    [0.913, '#019C5C'],\n" +
      "    [1.000, '#019C5C']]");
  });

  it('file', async () => {
    const g = Gradient.fromHash("123456-ABCDEF");
    const output = CodeFlavourPlotlyJs.file(g, "my gradient", "test comment");

    expect(output).toBe(await fetch("/base/ref/my_gradient.html").then(r => r.text()));

  });
});

describe('CodeFlavourSVG', () => {
  it('generate', () => {
    const g = Gradient.fromHash("0:365AA9-32.2:ABCD39-64:BFD336-77:B7D135-91.3:019C5C");
    const output = CodeFlavourSVG.generate(g, "my gradient", "test comment");

    expect(output).toBe(
      "<linearGradient id=\"my_gradient\">\n" +
      "    <!-- test comment -->\n" +
      "    <stop offset=\"0.000\" stop-color=\"#365AA9\" />\n" +
      "    <stop offset=\"0.322\" stop-color=\"#ABCD39\" />\n" +
      "    <stop offset=\"0.640\" stop-color=\"#BFD336\" />\n" +
      "    <stop offset=\"0.770\" stop-color=\"#B7D135\" />\n" +
      "    <stop offset=\"0.913\" stop-color=\"#019C5C\" />\n" +
      "</linearGradient>");
  });

  it('file', async () => {
    const g = Gradient.fromHash("123456-ABCDEF");
    const output = CodeFlavourSVG.file(g, "my gradient", "test comment");

    expect(output).toBe(await fetch("/base/ref/my_gradient.svg").then(r => r.text()));

  });
});

describe('CodeFlavourAndroidVectorDrawable', () => {
  it('generate', () => {
    const g = Gradient.fromHash("0:365AA9-32.2:ABCD39-64:BFD336-77:B7D135-91.3:019C5C");
    const output = CodeFlavourAndroidVectorDrawable.generate(g, "my gradient", "test comment");

    expect(output).toBe(
      "<gradient android:type=\"linear\" android:endX=\"1\">\n" +
      "    <!-- test comment -->\n" +
      "    <item android:offset=\"0.000\" android:color=\"#365AA9\" />\n" +
      "    <item android:offset=\"0.322\" android:color=\"#ABCD39\" />\n" +
      "    <item android:offset=\"0.640\" android:color=\"#BFD336\" />\n" +
      "    <item android:offset=\"0.770\" android:color=\"#B7D135\" />\n" +
      "    <item android:offset=\"0.913\" android:color=\"#019C5C\" />\n" +
      "</gradient>");
  });

  it('file', async () => {
    const g = Gradient.fromHash("123456-ABCDEF");
    const output = CodeFlavourAndroidVectorDrawable.file(g, "my gradient", "test comment");

    expect(output).toBe(await fetch("/base/ref/my_gradient.xml").then(r => r.text()));

  });
});

describe('CodeFlavourQML', () => {
  it('generate', () => {
    const g = Gradient.fromHash("0:365AA9-32.2:ABCD39-64:BFD336-77:B7D135-91.3:019C5C");
    const output = CodeFlavourQML.generate(g, "my gradient", "test comment");

    expect(output).toBe(
      "gradient: Gradient {\n" +
      "    /* test comment */\n" +
      "    orientation: Gradient.Horizontal\n" +
      "    GradientStop { position: 0.000; color: \"#365AA9\" }\n" +
      "    GradientStop { position: 0.322; color: \"#ABCD39\" }\n" +
      "    GradientStop { position: 0.640; color: \"#BFD336\" }\n" +
      "    GradientStop { position: 0.770; color: \"#B7D135\" }\n" +
      "    GradientStop { position: 0.913; color: \"#019C5C\" }\n" +
      "}");
  });

  it('file', async () => {
    const g = Gradient.fromHash("123456-ABCDEF");
    const output = CodeFlavourQML.file(g, "my gradient", "test comment");

    expect(output).toBe(await fetch("/base/ref/my_gradient.qml").then(r => r.text()));

  });
});

describe('CodeFlavourGimp', () => {
  it('generate', () => {
    const g = Gradient.fromHash("0:365AA9-32.2:ABCD39-64:BFD336-77:B7D135-91.3:019C5C");
    const output = CodeFlavourGimp.generate(g, "my gradient", "test comment");

    expect(output).toBe(
      "GIMP Gradient\n" +
      "Name: my gradient\n" +
      "5\n" +
      "0.000 0.161 0.322 0.212 0.353 0.663 1.000 0.671 0.804 0.224 1.000 0 0\n" +
      "0.322 0.481 0.640 0.671 0.804 0.224 1.000 0.749 0.827 0.212 1.000 0 0\n" +
      "0.640 0.705 0.770 0.749 0.827 0.212 1.000 0.718 0.820 0.208 1.000 0 0\n" +
      "0.770 0.841 0.913 0.718 0.820 0.208 1.000 0.004 0.612 0.361 1.000 0 0\n" +
      "0.913 0.956 1.000 0.004 0.612 0.361 1.000 0.004 0.612 0.361 1.000 0 0\n" +
      "# test comment");
  });

  it('file', async () => {
    const g = Gradient.fromHash("123456-ABCDEF");
    const output = CodeFlavourGimp.file(g, "my gradient", "test comment");

    expect(output).toBe(await fetch("/base/ref/my_gradient.ggr").then(r => r.text()));

  });
});

describe('CodeFlavourGRD', () => {

  it('file', async () => {
    const g = Gradient.fromHash("123456-ABCDEF");
    const output = CodeFlavourGRD.file(g, "my gradient", "test comment");
    expect(output).toEqual(new Int8Array(await fetch("/base/ref/my_gradient.grd").then(r => r.arrayBuffer())));

  });
});