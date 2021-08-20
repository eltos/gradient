
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


