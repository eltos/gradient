
/**
 * Code generators for color gradients
 *
 */


/**
 * Indents the given multi-line string
 */
function indent(n, string, firstLine = false){
    return string.split("\n").map(x => "".padStart(n, " ") + x).join("\n").substr(firstLine ? 0 : n);
}

/**
 * Removes leading indent from multi-line string preserving relative indents
 */
function tight(string){
    let lines = string.split("\n");
    while (lines.length > 0 && lines[0].trim() === ""){ lines = lines.slice(1)}
    let indent = lines[0] ? lines[0].match("( *).*")[1].length : 0;
    return lines.map(x => x.substr(indent)).join("\n")
}

/**
 * Formats the binary array as hex-dump
 */
function hexdump(int8array){
    let hex = "";
    for (let i = 0; i < int8array.length; i+=1) {
        hex += (int8array[i]&0xFF).toString(16).padStart(2, "0");
        hex += i%16 < 15  ? " " : "\n";
    }
    return hex.toUpperCase();
}

/**
 * sanitizes a string to be a valid variable name
 */
function sanitized(text){
    return text.replaceAll(/[^\w]/g,'_');
}






class CodeFlavourCSS {
    static id = 'code-css'; // html node id
    static title = 'CSS'; // tab title
    static longTitle = 'Cascading Style Sheets'; // tab tooltip
    static language = 'language-css'; // language for syntax highlighting
    static extension = 'css' // file extension for download

    /**
     * Code text generating function for copy&paste
     *
     * @param gradient instance of {@link Gradient}
     * @param name name of gradient (if applicable)
     * @param comment descriptive comment to be added to the code
     * @returns {string} the generated code
     */
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

    /**
     * Code file generating function for download
     *
     * @param gradient instance of {@link Gradient}
     * @param name name of gradient (if applicable)
     * @param comment descriptive comment to be added to the code
     * @returns {*} file contents for download
     */
    static file(gradient, name, comment){
        let codeBlock = this.generate(gradient, name, comment);
        return tight(`
            :root {
              --${name}: ${indent(3*4+4, codeBlock)};
            }
            
            html {
              background: var(--${name});
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
        return "DEFINE_GRADIENT_PALETTE( " + sanitized(name) + " ){\n" +
            (comment ? "    /* " + comment + " */\n" : "") +
            "    " + gradient.map(
                x => x.pos255.toString().padStart(3, " ") + ",  "
                    + x.rgb.map(v => v.toString().padStart(3, " ")).join(", ")
            ).join(",\n    ") + "};";
    }

    static file(gradient, name, comment){
        let codeBlock = this.generate(gradient, name, comment);
        return tight(`
            #include "FastLED.h"
            
            ${indent(3*4, codeBlock)}
        `)
    }
}


class CodeFlavourMatplotlib {
    static id = 'code-matplotlib';
    static title = 'Matplotlib';
    static longTitle = 'Python Matplotlib';
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

    static file(gradient, name, comment){
        let codeBlock = this.generate(gradient, name, comment);
        return tight(`
            #!/usr/bin/env python
            
            from matplotlib.colors import LinearSegmentedColormap
            
            ${name} = ${indent(3*4+2+name.length, codeBlock)}
            
            
            if __name__ == '__main__':
                import numpy as np
                from matplotlib import pyplot as plt
                
                plt.imshow([np.arange(1000)], aspect="auto", cmap=${name})
                plt.show()
        `)
    }
}


class CodeFlavourSVG {
    static id = 'code-svg';
    static title = 'SVG';
    static longTitle = 'Scalable Vector Graphics';
    static language = 'language-xml'
    static extension = 'svg'

    static generate(gradient, name, comment) {
        return "<linearGradient id=\"" + sanitized(name) + "\">\n" +
            (comment ? "    <!-- " + comment + " -->\n" : "") +
            "    " + gradient.map(
                x => "<stop offset=\"" + x.pos.toFixed(3) +
                    "\" stop-color=\"#" + x.colorHex + "\" />"
            ).join("\n    ") + "\n" +
            "</linearGradient>";
    }

    static file(gradient, name, comment){
        let codeBlock = this.generate(gradient, name, comment);
        return tight(`
            <?xml version="1.0" encoding="UTF-8"?>
            <svg xmlns="http://www.w3.org/2000/svg">
            
            <defs>
                ${indent(4*4, codeBlock)}
            </defs>
            
            <rect width=\"100%\" height=\"100%\" fill=\"url(#${sanitized(name)})\" />
            
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

    static file(gradient, name, comment){
        return this.generate(gradient, name, comment);
    }
}


class CodeFlavourGRD {
    static id = 'code-grd';
    static title = 'Photoshop';
    static longTitle = 'Photoshop GRD file';
    static extension = 'grd'

    static generate(gradient, name, comment) {
        return hexdump(this.file(gradient, name, comment));
    }

    static file(gradient, name, comment) {
        // GRD binary file version 3
        let int16 = v => [v>>8, v&0xFF];
        let binary = [0x38, 0x42, 0x47, 0x52, 0x00, 0x03]; // header
        binary.push(0x00, 0x01); // number of gradients
        let nameCodes = name.split('').map(x => x.charCodeAt(0));
        binary.push(nameCodes.length, ...nameCodes); // gradient name
        binary.push(...int16(gradient.length)); // number of stops
        for (let node of gradient){
            binary.push(0, 0, ...int16(node.pos*4096)); // stop position 0..4096
            binary.push(0, 0, 0, 50); // stop midpoint in %
            binary.push(0, 0); // color model RGB
            binary.push(...int16(node.r*0xFF), ...int16(node.g*0xFF), ...int16(node.b*0xFF), 0, 0); // color RGB
            binary.push(0, 0); // color type user
        }
        binary.push(0, 0); // no transparency stops
        binary.push(0, 0, 0, 0, 0, 0); // reserved

        return new Int8Array(binary);
    }

}



// list of supported code flavours
codeFlavours = [
    CodeFlavourCSS,
    CodeFlavourMatplotlib,
    CodeFlavourFastLED,
    CodeFlavourSVG,
    CodeFlavourGimp,
    CodeFlavourGRD,
]

let codeFlavourDefault = 'code-css';
