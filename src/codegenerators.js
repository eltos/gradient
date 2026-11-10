/**
 * Code generators for color gradients
 *
 */


/**
 * Removes leading indent from multi-line string preserving relative indents
 */
function dedent(strings, ...values) {
  // Find the minimum indent of the static strings
  const staticLines = strings.join("?").split("\n").filter(l => l.trim());
  const indent = staticLines.reduce((min, line) => {
    const match = line.match(/^ */);
    return match ? Math.min(min, match[0].length) : min;
  }, Infinity);

  // Build the result
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    // Dedent lines
    result += strings[i].split("\n")
      .map((line, idx) => idx === 0 ? line : line.substring(indent))
      .join("\n");

    // Format values
    if (i < values.length) {
      let val = String(values[i]);
      if (val.includes("\n")) {
        // Indent multiline values
        const extraIndent = result.split("\n").slice(-1).join().match(/^ */)[0];
        val = val.split("\n").map((l, idx) => idx === 0 ? l : extraIndent + l).join("\n");
      }
      result += val;
    }
  }
  return result.trim() + "\n";
}

/**
 * Formats the binary array as hex-dump
 */
function hexdump(int8array) {
  let hex = "";
  for (let i = 0; i < int8array.length; i += 1) {
    hex += (int8array[i] & 0xFF).toString(16).padStart(2, "0");
    hex += i % 16 < 15 ? " " : "\n";
  }
  return hex.toUpperCase();
}

/**
 * sanitizes a string to be a valid variable/file/identifier
 */
function sanitized(text, replacement = '_') {
  return text.replaceAll(/\W/g, replacement);
}


class CodeFlavourCSS {
  // https://www.w3schools.com/css/css3_gradients.asp
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
      const stops = gradient.map(x => "#" + x.colorHex + "  " + x.posPercent.padStart(6, " "));
      return dedent`
        linear-gradient(90deg,
            /* ${comment} */
            ${stops.join(",\n")})
      `.trim()
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
  static file(gradient, name, comment) {
    const codeBlock = this.generate(gradient, name, comment);
    return dedent`
      :root {
          --${sanitized(name)}: ${codeBlock};
      }
      
      html {
          background: var(--${sanitized(name)});
      }
    `
  }
}


class CodeFlavourFastLED {
  // https://github.com/FastLED/FastLED/wiki/Gradient-color-palettes
  static id = 'code-fastled';
  static title = 'FastLED';
  static language = 'language-ino'
  static extension = 'ino'

  static generate(gradient, name, comment) {
    const stops = gradient.padded()
      .map(x => x.pos255.toString().padStart(3, " ") + ",  "
        + x.rgb.map(v => v.toString().padStart(3, " ")).join(", "))
    return dedent`
      DEFINE_GRADIENT_PALETTE( ${sanitized(name)} ){
          /* ${comment} */
          ${stops.join(",\n")}};
    `.trim()
  }

  static file(gradient, name, comment) {
    const codeBlock = this.generate(gradient, name, comment);
    return dedent`
      #include "FastLED.h"

      ${codeBlock}
    `
  }
}


class CodeFlavourMatplotlib {
  // https://matplotlib.org/stable/api/_as_gen/matplotlib.colors.LinearSegmentedColormap.html#matplotlib.colors.LinearSegmentedColormap.from_list
  static id = 'code-matplotlib';
  static title = 'Matplotlib';
  static longTitle = 'Python Matplotlib';
  static language = 'language-python'
  static extension = 'py'

  static generate(gradient, name, comment) {
    const stops = gradient.padded().map(
      x => "(" + x.pos.toFixed(3) + ", "
        + "(" + x.rgb.map(v => (v / 255).toFixed(3)).join(", ") + "))"
    );
    return dedent`
      LinearSegmentedColormap.from_list('${name}', (
          # ${comment}
          ${stops.join(",\n")}))
    `.trim()
  }

  static file(gradient, name, comment) {
    const codeBlock = this.generate(gradient, name, comment);
    return dedent`
      #!/usr/bin/env python
      
      from matplotlib.colors import LinearSegmentedColormap
      
      ${sanitized(name)} = ${codeBlock}
      
      
      if __name__ == '__main__':
          import numpy as np
          from matplotlib import pyplot as plt
          
          plt.imshow([np.arange(1000)], aspect="auto", cmap=${sanitized(name)})
          plt.show()
    `
  }
}


class CodeFlavourPlotlyPy {
  //
  static id = 'code-plotly.py';
  static title = 'Plotly.py';
  static longTitle = 'Plotly Python Open Source Graphing Library';
  static language = 'language-python'
  static extension = 'ipynb' //'py'

  static generate(gradient, name, comment) {
    const stops = gradient.padded().map(
      x => `[${x.pos.toFixed(3)}, '#${x.colorHex}']`
    );
    return dedent`
      ${sanitized(name)} = [
          # ${comment}
          ${stops.join(",\n")}]
    `.trim()
  }

  static file(gradient, name, comment) {
    const codeBlock = this.generate(gradient, name, comment);
    /*
    // standalone python file
    return tight(`
        #!/usr/bin/env python

        ${indent(3*4, codeBlock)}


        if __name__ == '__main__':
            import numpy as np
            import plotly.express as px
            from plotly.offline import plot

            fig = px.imshow([np.arange(1000)], aspect='auto', color_continuous_scale=${sanitized(name)})
            plot(fig)
    `)
    */
    // jupyter notebook
    return dedent`
      {
       "cells": [
        {
         "cell_type": "code",
         "execution_count": null,
         "metadata": {},
         "outputs": [],
         "source": [
          ${codeBlock.split('\n').map(line => '"' + line + '\\n"').join(",\n")}
         ]
        },
        {
         "cell_type": "code",
         "execution_count": null,
         "metadata": {},
         "outputs": [],
         "source": [
          "import numpy as np\\n",
          "import plotly.express as px\\n",
          "\\n",
          "px.imshow([np.arange(1000)], aspect='auto', color_continuous_scale=${sanitized(name)})"
         ]
        }
       ],
       "metadata": {
        "kernelspec": {
         "display_name": "Python 3",
         "language": "python",
         "name": "python3"
        },
        "language_info": {
         "codemirror_mode": {
          "name": "ipython",
          "version": 3
         },
         "file_extension": ".py",
         "mimetype": "text/x-python",
         "name": "python"
        }
       },
       "nbformat": 4,
       "nbformat_minor": 4
      }
    `

  }
}


class CodeFlavourTypst {
  // https://typst.app/docs/reference/visualize/gradient/
  static id = 'code-typst';
  static title = 'Typst';
  static longTitle = 'Typst markup';
  static language = 'language-stylus' // use similar syntax highlighting until typst is supported
  static extension = 'typ'

  static generate(gradient, name, comment) {
    if (gradient.length === 0) {
      return `#let ${sanitized(name)} = none`;
    } else if (gradient.length === 1) {
      return `#let ${sanitized(name)} = rgb("#${gradient[0].colorHex}")`;
    } else {
      const stops = gradient.padded().map(x => `(rgb("#${x.colorHex}"), ${x.posPercent}),`);
      return dedent`
        #let ${sanitized(name, '-')} = gradient.linear(
          // ${comment}
          ${stops.join("\n")}
          space: rgb,
        )
      `.trim()
    }
  }

  static file(gradient, name, comment) {
    const codeBlock = this.generate(gradient, name, comment);
    return dedent`
      ${codeBlock}
      
      #rect(fill: ${sanitized(name, '-')}, width: 100%)
    `
  }
}


class CodeFlavourPlotlyJs {
  // https://plotly.com/javascript/reference/#heatmapgl-colorscale
  static id = 'code-plotly.js';
  static title = 'Plotly.js';
  static longTitle = 'Plotly JavaScript Open Source Graphing Library';
  static language = 'language-js'
  static extension = 'html'

  static generate(gradient, name, comment) {
    const stops = gradient.padded().map(
      x => `[${x.pos.toFixed(3)}, '#${x.colorHex}']`
    );
    return dedent`
      let ${sanitized(name)} = [
          // ${comment}
          ${stops.join(",\n")}]
    `.trim()
  }

  static file(gradient, name, comment) {
    const codeBlock = this.generate(gradient, name, comment);
    return dedent`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>${name}</title>
          <script src="https://cdn.plot.ly/plotly-2.6.3.min.js"></script>
          <script>
          
              ${codeBlock}
      
              const data = [
                {
                  z: [[...Array(1000).keys()]],
                  colorscale: ${sanitized(name)},
                  type: 'heatmap'
                }
              ];
              
              window.onload = function(){Plotly.newPlot('chart', data);}    
          
          </script>
      </head>
      
      <body>
          <div id="chart"></div>
      </body>
      </html>
    `

  }
}


class CodeFlavourSVG {
  // https://www.w3schools.com/graphics/svg_grad_linear.asp
  static id = 'code-svg';
  static title = 'SVG';
  static longTitle = 'Scalable Vector Graphics';
  static language = 'language-xml'
  static extension = 'svg'

  static generate(gradient, name, comment) {
    const stops = gradient.map(
      x => "<stop offset=\"" + x.pos.toFixed(3) +
        "\" stop-color=\"#" + x.colorHex + "\" />"
    )
    return dedent`
      <linearGradient id="${sanitized(name)}">
          <!-- ${comment} -->
          ${stops.join("\n")}
      </linearGradient>
    `.trim()
  }

  static file(gradient, name, comment) {
    const codeBlock = this.generate(gradient, name, comment);
    return dedent`
      <?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg">
      
      <defs>
          ${codeBlock}
      </defs>
      
      <rect width=\"100%\" height=\"100%\" fill=\"url(#${sanitized(name)})\" />
      
      </svg>
    `
  }
}


class CodeFlavourAndroidVectorDrawable {
  // https://developer.android.com/reference/android/graphics/drawable/VectorDrawable#gradient-support
  static id = 'code-vector-drawable';
  static title = 'Android';
  static longTitle = 'Android vector drawable';
  static language = 'language-xml'
  static extension = 'xml'

  static generate(gradient, name, comment) {
    const stops = gradient.map(
      x => "<item android:offset=\"" + x.pos.toFixed(3) +
        "\" android:color=\"#" + x.colorHex + "\" />"
    )
    return dedent`
      <gradient android:type="linear" android:endX="1">
          <!-- ${comment} -->
          ${stops.join("\n")}
      </gradient>
    `.trim()
  }

  static file(gradient, name, comment) {
    const codeBlock = this.generate(gradient, name, comment);
    return dedent`
      <?xml version="1.0" encoding="utf-8"?>
      <vector xmlns:android="http://schemas.android.com/apk/res/android"
              xmlns:aapt="http://schemas.android.com/aapt"
              android:width="100dp"
              android:height="100dp"
              android:viewportWidth="1"
              android:viewportHeight="1">
          <path android:pathData="M0,0 H1 V1 H0 Z">
              <aapt:attr name="android:fillColor">
                  ${codeBlock}
              </aapt:attr>
          </path>
      </vector>
    `
  }
}


class CodeFlavourQML {
  // https://doc.qt.io/qt-5/qml-qtquick-gradient.html#orientation-prop
  static id = 'code-qml';
  static title = 'QML';
  static longTitle = 'Qt Modeling Language (QtQuick)';
  static language = 'language-qml'
  static extension = 'qml'

  static generate(gradient, name, comment) {
    const stops = gradient.map(x => "GradientStop { position: " + x.pos.toFixed(3)
      + "; color: \"#" + x.colorHex + "\" }");
    return dedent`
    gradient: Gradient {
        /* ${comment} */
        orientation: Gradient.Horizontal
        ${stops.join("\n")}
    }
    `.trim()
  }

  static file(gradient, name, comment) {
    const codeBlock = this.generate(gradient, name, comment);
    return dedent`
      import QtQuick 2.15

      Rectangle {
      
          ${codeBlock}
      
      }
    `
  }
}


class CodeFlavourGimp {
  // https://gitlab.gnome.org/GNOME/gimp/blob/master/devel-docs/ggr.txt
  static id = 'code-gimp';
  static title = 'GIMP';
  static language = 'nohighlight';
  static extension = 'ggr'

  static generate(gradient, name, comment) {
    gradient = gradient.padded()
    let raw = "GIMP Gradient\n" +
      "Name: " + name + "\n" +
      (gradient.length - 1) + "\n";
    for (let i = 0; i < gradient.length - 1; i++) {
      const l = gradient[i], r = gradient[i + 1];
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

  static file(gradient, name, comment) {
    return this.generate(gradient, name, comment);
  }
}


class CodeFlavourGRD {
  // http://www.selapa.net/swatches/gradients/fileformats.php
  static id = 'code-grd';
  static title = 'Photoshop';
  static longTitle = 'Photoshop GRD file';
  static language = 'nohighlight';
  static extension = 'grd'

  static generate(gradient, name, comment) {
    return hexdump(this.file(gradient, name, comment));
  }

  static file(gradient, name, comment) {
    // GRD binary file version 3
    const int16 = v => [v >> 8, v & 0xFF];
    const binary = [0x38, 0x42, 0x47, 0x52, 0x00, 0x03]; // header
    binary.push(0x00, 0x01); // number of gradients
    const nameCodes = name.split('').map(x => x.charCodeAt(0));
    binary.push(nameCodes.length, ...nameCodes); // gradient name
    binary.push(...int16(gradient.length)); // number of stops
    for (const node of gradient) {
      binary.push(0, 0, ...int16(node.pos * 4096)); // stop position 0..4096
      binary.push(0, 0, 0, 50); // stop midpoint in %
      binary.push(0, 0); // color model RGB
      binary.push(...int16(node.r * 0x101), ...int16(node.g * 0x101), ...int16(node.b * 0x101), 0, 0); // color RGB
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
  CodeFlavourSVG,
  CodeFlavourPlotlyJs,
  CodeFlavourPlotlyPy,
  CodeFlavourMatplotlib,
  CodeFlavourTypst,
  CodeFlavourFastLED,
  CodeFlavourAndroidVectorDrawable,
  CodeFlavourQML,
  CodeFlavourGimp,
  CodeFlavourGRD,
]

let codeFlavourDefault = 'code-css';
