/**
* HSV color picker
*
* Add this to page head:
*   <link rel="stylesheet" href="src/picker.css">
*   <script src="src/picker.js"></script>
* and to page body:
*   <div class="picker" id="picker"></div>
*
*
*/


function color2hsv(color) {
  // input: 3 byte color, out: h in [0,360) and s,v in [0,1]
  let r = ((color >> 16) & 0xFF) / 255,
    g = ((color >> 8) & 0xFF) / 255,
    b = ((color >> 0) & 0xFF) / 255;
  let v = Math.max(r, g, b);
  let c = v - Math.min(r, g, b);
  let h = c && ((v === r) ? (g - b) / c : ((v === g) ? 2 + (b - r) / c : 4 + (r - g) / c));
  return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

function hsv2color(h, s, v) {
  // input: h in [0,360] and s,v in [0,1] - output: 3 byte color
  let f = (n, k = (n + h / 60) % 6) => 255 * (v - v * s * Math.max(Math.min(k, 4 - k, 1), 0));
  return (f(5) << 16) + (f(3) << 8) + f(1) << 0;
}

function color2hex(color) {
  return "#" + color.toString(16).padStart(6, "0").toUpperCase();
}


function pickerShow(x, y) {
  picker.style.display = 'block';
  picker.style.left = x;
  picker.style.top = y;
  let margin = window.getComputedStyle(picker).marginLeft;
  picker.style.transform = "translateX(calc(-" + x + " - " + margin + "))";
}

function pickerHide() {
  picker.style.display = 'none';
}


function pickerSetColor(color) {
  [pickerH, pickerS, pickerV] = color2hsv(color)
  pickerRefreshUI();
}


function pickerRefreshUI() {
  // hue in 0..360 degree
  pickerHueDot.style.left = Math.sin(Math.PI * pickerH / 180) * 100 + "%";
  pickerHueDot.style.top = -Math.cos(Math.PI * pickerH / 180) * 100 + "%";
  pickerHueDot.style.background = color2hex(hsv2color(pickerH, 1, 1));

  // Position the marker in the same triangular coordinates used by the SVG.
  const hueWeight = pickerV * pickerS;
  const whiteWeight = pickerV * (1 - pickerS);
  const blackWeight = 1 - pickerV;
  const x = Math.cos(Math.PI / 6) * (whiteWeight - blackWeight);
  const y = -hueWeight + 0.5 * (whiteWeight + blackWeight);
  pickerSvDot.style.left = 50 + 50 * x + "%";
  pickerSvDot.style.top = 50 + 50 * y + "%";
  pickerSvDot.style.background = color2hex(hsv2color(pickerH, pickerS, pickerV));

  // triangle
  document.getElementById("picker-svg-triangle-color-bg").style.fill = color2hex(hsv2color(pickerH, 1, 1));
}


let picker = undefined,
  pickerHueDot = undefined,
  pickerSvDot = undefined;
let pickerH = 0, pickerS = 1, pickerV = 1;

function initPicker(id, onColorChangedCallback) {
  picker = document.getElementById(id);

  picker.addEventListener('mousedown', function (e) {
    e.preventDefault()
  });
  picker.addEventListener('touchstart', function (e) {
    e.preventDefault()
  });

  // create DOM
  let pickerHue = createDivWithClass('picker-hue');
  picker.appendChild(pickerHue);
  pickerHue.appendChild(createDivWithClass('hue-circle'));
  let inner = createDivWithClass('hue-inner-circle');
  pickerHue.appendChild(inner);
  let hueNode = createDivWithClass('hue-node');
  pickerHue.appendChild(hueNode);
  pickerHueDot = createDivWithClass('node');
  pickerHueDot.id = id + '-hue-node';
  hueNode.appendChild(pickerHueDot);

  let pickerSV = createDivWithClass('picker-sv');
  inner.appendChild(pickerSV);
  let svg = createDivWithClass('picker-triangle');
  svg.innerHTML = '<svg width="100%" height="100%" viewBox="-1 -1 2 2">' +
    '<linearGradient id="val" x1="75%" y1="50%" x2="0%" y2="100%">' +
    '<stop offset="0" stop-color="transparent"/>' +
    '<stop offset="1" stop-color="black"/>' +
    '</linearGradient>' +
    '<linearGradient id="sat" x1="25%" y1="50%" x2="100%" y2="100%">' +
    '<stop offset="0" stop-color="transparent"/>' +
    '<stop offset="1" stop-color="white"/>' +
    '</linearGradient>' +
    '<linearGradient id="gr" x1="50%" y1="50%" x2="50%" y2="150%">' +
    '<stop offset="0" stop-color="transparent"/>' +
    '<stop offset="1" stop-color="gray"/>' +
    '</linearGradient>' +
    '<polygon id="picker-svg-triangle-color-bg" points="0,-1 .866,.5 -.866,.5" style="fill:red;"></polygon>' +
    '<polygon points="0,-1 .866,.5 -.866,.5" style="fill:url(#gr);"></polygon>' +
    '<polygon points="0,-1 .866,.5 -.866,.5" style="fill:url(#val);"></polygon>' +
    '<polygon points="0,-1 .866,.5 -.866,.5" style="fill:url(#sat);"></polygon>' +
    '</svg>';
  pickerSV.appendChild(svg);

  let svNode = createDivWithClass('sv-node');
  pickerSV.appendChild(svNode);
  pickerSvDot = createDivWithClass('node');
  pickerSvDot.id = id + '-sv-node';
  svNode.appendChild(pickerSvDot);

  function applyPickerColor() {
    pickerRefreshUI();
    onColorChangedCallback(hsv2color(pickerH, pickerS, pickerV));
  }

  function makePickerSurfaceInteractive(surface, updateColor) {
    let activePointerId = undefined;
    surface.style.touchAction = "none";
    surface.addEventListener("pointerdown", function (event) {
      if (!updateColor(event)) return;
      event.preventDefault();
      event.stopPropagation();
      activePointerId = event.pointerId;
      surface.setPointerCapture(event.pointerId);
    });
    surface.addEventListener("pointermove", function (event) {
      if (event.pointerId === activePointerId) updateColor(event, true);
    });
    const stopDragging = function (event) {
      if (event.pointerId === activePointerId) activePointerId = undefined;
    };
    surface.addEventListener("pointerup", stopDragging);
    surface.addEventListener("pointercancel", stopDragging);
  }

  makePickerSurfaceInteractive(pickerHue, function (event, dragging) {
    let box = pickerHue.getBoundingClientRect();
    let dx = (event.clientX - (box.left + box.width / 2)) / box.width;
    let dy = (event.clientY - (box.top + box.height / 2)) / box.height;
    let radius = Math.hypot(dx, dy);
    if (!dragging && (radius < 0.37 || radius > 0.48)) return false;
    pickerH = 180 * Math.atan2(dx, -dy) / Math.PI;
    applyPickerColor();
    return true;
  });

  makePickerSurfaceInteractive(pickerSV, function (event) {
    let box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return;
    let x = 2 * (event.clientX - box.left) / box.width - 1;
    let y = 2 * (event.clientY - box.top) / box.height - 1;
    let hueWeight = (0.5 - y) / 1.5;
    let whiteWeight = (1 - hueWeight + x / Math.cos(Math.PI / 6)) / 2;
    let blackWeight = 1 - hueWeight - whiteWeight;
    [hueWeight, whiteWeight, blackWeight] = projectToSimplex(hueWeight, whiteWeight, blackWeight);
    pickerV = hueWeight + whiteWeight;
    pickerS = pickerV ? hueWeight / pickerV : 1;
    applyPickerColor();
    return true;
  });

  pickerHide();

}

function projectToSimplex(...weights) {
  const sorted = [...weights].sort((a, b) => b - a);
  let cumulative = 0;
  let threshold = 0;
  for (let i = 0; i < sorted.length; i++) {
    cumulative += sorted[i];
    const candidate = (cumulative - 1) / (i + 1);
    if (sorted[i] > candidate) threshold = candidate;
  }
  return weights.map(weight => Math.max(weight - threshold, 0));
}
