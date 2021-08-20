
/*
 * Code generators
 */


let codePaletteName = 'my_color_palette';
let codeFlavourDefault = 'code-css';

// list of supported code flavours
codeFlavours = {
    // id                   title              code generating function      programming language
    'code-css':            ['CSS',             gradient_as_css,             'language-css'       ],
    'code-matplotlib':     ['Matplotlib',      gradient_as_matplotlib,      'language-python'    ],
    'code-fastled':        ['FastLED',         gradient_as_fastled,         'language-ino'       ],
    'code-svg':            ['SVG',             gradient_as_svg,             'language-xml'       ],
    'code-gimp':           ['GIMP',            gradient_as_gimp,            undefined            ],
}





function gradient_as_css(gradient, name, comment) {
    if (gradient.length === 0) {
        return "none";
    } else if (gradient.length === 1) {
        return "#" + gradient[0].colorHex;
    } else {
        return "linear-gradient(90deg,\n" +
            (comment ? "    /* " + comment + " */\n" : "") +
            "    " + gradient.map(
                x => "#" + x.colorHex + "  " + x.posPercent.padStart(6, " ")
            ).join(",\n    ") + ")";
    }
}


function gradient_as_fastled(gradient, name, comment) {
    return "DEFINE_GRADIENT_PALETTE( " + name + " ){\n" +
        (comment ? "    /* " + comment + " */\n" : "") +
        "    " + gradient.map(
            x => x.pos255.toString().padStart(3, " ") + ",  "
                + x.rgb.map(v => v.toString().padStart(3, " ")).join(", ")
        ).join(",\n    ") + "};";
}


function gradient_as_matplotlib(gradient, name, comment) {
    return "LinearSegmentedColormap.from_list('" + name + "', (\n" +
        (comment ? "    # " + comment + "\n" : "") +
        "    " + gradient.map(
            x => "(" + x.pos.toFixed(3) + ", "
                + "(" + x.rgb.map(v => (v / 255).toFixed(3)).join(", ") + "))"
        ).join(",\n    ") + "))";
}


function gradient_as_svg(gradient, name, comment){
    return "<linearGradient id=\"" + name + "\">\n" +
        (comment ? "    <!-- " + comment + " -->\n" : "") +
        "    " + gradient.map(
            x => "<stop offset=\"" + x.pos.toFixed(3) +
                "\" stop-color=\"#" + x.colorHex + "\" />"
        ).join("\n    ") + "\n" +
        "</linearGradient>";
}


function gradient_as_gimp(gradient, name, comment) {
    let raw = "GIMP Gradient\n" +
        "Name: " + name + "\n" +
        (gradient.length - 1) + "\n";
    for (let i = 0; i < gradient.length-1; i++) {
        let l = gradient[i], r = gradient[i+1];
        raw += [l.pos, (l.pos+r.pos)/2, r.pos, // position left, mid, right
            l.r/255, l.g/255, l.b/255, 1,      // left color R, G, B, A
            r.r/255, r.g/255, r.b/255, 1       // right color R, G, B, A
        ].map(x => x.toFixed(3)).join(" ");
        raw += " 0 0\n";  // blend type: linear, color type: RGB
    }
    if (comment) {
        raw += "# " + comment;
    }
    return raw;
}


