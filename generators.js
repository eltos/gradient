
/*
 * Code generators
 */


let codeGradientName = 'my_color_palette';

function indent(n, string, firstLine = false){
    return string.split("\n").map(x => "".padStart(n, " ") + x).join("\n").substr(firstLine ? 0 : n);
}
function tight(string){
    let lines = string.split("\n");
    while (lines.length > 0 && lines[0].trim() === ""){ lines = lines.slice(1)}
    let indent = lines[0] ? lines[0].match("( *).*")[1].length : 0;
    return lines.map(x => x.substr(indent)).join("\n")
}


class CodeFlavourCSS {
    static id = 'code-css';
    static title = 'CSS';
    static language = 'language-css';
    static extension = 'css'

    static generate(gradient, name, comment) {
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

    static file(codeBlock){
        return tight(`
            :root {
              --${codeGradientName}: ${indent(3*4+4, codeBlock)};
            }
            
            html {
              background: var(--${codeGradientName});
            }
        `)
    }
}


class CodeFlavourFastLED {
    static id = 'code-fastled';
    static title = 'FastLED';
    static language = 'language-ino'
    static extension = 'ino'

    static generate(gradient, name, comment) {
        return "DEFINE_GRADIENT_PALETTE( " + name + " ){\n" +
            (comment ? "    /* " + comment + " */\n" : "") +
            "    " + gradient.map(
                x => x.pos255.toString().padStart(3, " ") + ",  "
                    + x.rgb.map(v => v.toString().padStart(3, " ")).join(", ")
            ).join(",\n    ") + "};";
    }

    static file(codeBlock){
        return tight(`
            #include "FastLED.h"
            
            ${indent(3*4, codeBlock)}
        `)
    }
}


class CodeFlavourMatplotlib {
    static id = 'code-matplotlib';
    static title = 'Matplotlib';
    static language = 'language-python'
    static extension = 'py'

    static generate(gradient, name, comment) {
        return "LinearSegmentedColormap.from_list('" + name + "', (\n" +
            (comment ? "    # " + comment + "\n" : "") +
            "    " + gradient.map(
                x => "(" + x.pos.toFixed(3) + ", "
                    + "(" + x.rgb.map(v => (v / 255).toFixed(3)).join(", ") + "))"
            ).join(",\n    ") + "))";
    }

    static file(codeBlock){
        return tight(`
            #!/usr/bin/env python
            
            from matplotlib.colors import LinearSegmentedColormap
            
            ${codeGradientName} = ${indent(3*4+2+codeGradientName.length, codeBlock)}
            
            
            if __name__ == '__main__':
                import numpy as np
                from matplotlib import pyplot as plt
                
                plt.imshow([np.arange(1000)], aspect="auto", cmap=${codeGradientName})
                plt.show()
        `)
    }
}


class CodeFlavourSVG {
    static id = 'code-svg';
    static title = 'SVG';
    static language = 'language-xml'
    static extension = 'svg'

    static generate(gradient, name, comment) {
        return "<linearGradient id=\"" + name + "\">\n" +
            (comment ? "    <!-- " + comment + " -->\n" : "") +
            "    " + gradient.map(
                x => "<stop offset=\"" + x.pos.toFixed(3) +
                    "\" stop-color=\"#" + x.colorHex + "\" />"
            ).join("\n    ") + "\n" +
            "</linearGradient>";
    }

    static file(codeBlock){
        return tight(`
            <?xml version="1.0" encoding="UTF-8"?>
            <svg xmlns="http://www.w3.org/2000/svg">
            
            <defs>
                ${indent(4*4, codeBlock)}
            </defs>
            
            <rect width=\"100%\" height=\"100%\" fill=\"url(#${codeGradientName})\" />
            
            </svg>
        `)
    }
}


class CodeFlavourGimp {
    static id = 'code-gimp';
    static title = 'GIMP';
    static language;
    static extension = 'ggr'

    static generate(gradient, name, comment) {
        let raw = "GIMP Gradient\n" +
            "Name: " + name + "\n" +
            (gradient.length - 1) + "\n";
        for (let i = 0; i < gradient.length - 1; i++) {
            let l = gradient[i], r = gradient[i + 1];
            raw += [l.pos, (l.pos + r.pos) / 2, r.pos, // position left, mid, right
                l.r / 255, l.g / 255, l.b / 255, 1,    // left color R, G, B, A
                r.r / 255, r.g / 255, r.b / 255, 1     // right color R, G, B, A
            ].map(x => x.toFixed(3)).join(" ");
            raw += " 0 0\n";  // blend type: linear, color type: RGB
        }
        if (comment) {
            raw += "# " + comment;
        }
        return raw;
    }

    static file(contents){
        return contents;
    }
}



// list of supported code flavours
codeFlavours = [
    CodeFlavourCSS,
    CodeFlavourMatplotlib,
    CodeFlavourFastLED,
    CodeFlavourSVG,
    CodeFlavourGimp,
]

let codeFlavourDefault = 'code-css';
