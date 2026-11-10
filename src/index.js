/**
* Gradient designer GUI
* code for index.html
*/

let gradient = new Gradient();
let flowIgnoreNewHash = false;
let flowPauseHashUpdates = false;
let activeSliderElement = undefined;
let selectedSliderElement = undefined;
let previewStopNode = undefined;
let previewIsExistingStop = false;
let draggingSliderElement = undefined;
let connectorAnimationFrame = undefined;
let connectorAnimationEnd = 0;
let stopPositionInput;
let stopColorInput;

function selectSlider(slider) {
  if (previewStopNode) hideStopPreview();
  const addHint = document.getElementById("stop-add-hint");
  const deleteButton = document.getElementById("stop-delete");
  if (selectedSliderElement && selectedSliderElement !== slider) {
    selectedSliderElement.classList.remove("selected");
  }
  selectedSliderElement = slider;
  activeSliderElement = slider;
  if (slider) {
    stopPositionInput.readOnly = false;
    stopColorInput.readOnly = false;
    updateStopFields(slider, gradient.find(node => node.slider === slider));
    deleteButton.hidden = false;
    pickerSetColor(parseColorString(stopColorInput.value));
    addHint.hidden = true;
  } else {
    addHint.hidden = true;
    deleteButton.hidden = true;
  }
  updateStopNavigation();
  document.querySelectorAll("#sliders .slider").forEach(element => {
    element.classList.toggle("selected", element === selectedSliderElement);
    element.circle.setAttribute("aria-pressed", element === selectedSliderElement ? "true" : "false");
  });
  updateStopNavigation();
  updateStopConnectors();
}

function updateStopNavigation() {
  const previousButton = document.getElementById("stop-previous");
  const nextButton = document.getElementById("stop-next");
  const selectedIndex = gradient.findIndex(node => node.slider === selectedSliderElement);
  const hasSelection = selectedIndex >= 0 && !previewStopNode;
  previousButton.hidden = !hasSelection;
  nextButton.hidden = !hasSelection;
  previousButton.disabled = selectedIndex <= 0;
  nextButton.disabled = selectedIndex < 0 || selectedIndex >= gradient.length - 1;
}

function navigateStop(offset) {
  const selectedIndex = gradient.findIndex(node => node.slider === selectedSliderElement);
  const nextIndex = selectedIndex + offset;
  if (selectedIndex < 0 || nextIndex < 0 || nextIndex >= gradient.length) return;
  selectSlider(gradient[nextIndex].slider);
}

function createSliderElement() {
  let slider = document.createElement("div");
  slider.classList.add("slider", "reactive");
  slider.addEventListener("click", function () {
    hideStopPreview();
    selectSlider(slider);
  });

  let colorLens = document.createElement("div");
  colorLens.classList.add("slider-lens");
  colorLens.tabIndex = 0;
  colorLens.setAttribute("role", "button");
  colorLens.setAttribute("aria-label", "Color stop. Select to edit or drag to move.");
  colorLens.addEventListener("pointerdown", function () {
    hideStopPreview();
    draggingSliderElement = slider;
    slider.classList.add("is-dragging");
    selectSlider(slider);
  });
  colorLens.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectSlider(slider);
    }
  });
  makeDraggable(colorLens, function (element, e) {
    // update position
    let box = element.closest('.bar').getBoundingClientRect()
    let x = e.clientX ?? e.touches?.[0]?.clientX;
    if (x === undefined) return;
    let value = (x - box.left) / box.width;
    flowPauseHashUpdates = true;
    actionChange(element.parentElement, 'pos', value);
    flowPauseHashUpdates = false;
  });
  slider.circle = colorLens;
  slider.appendChild(colorLens);

  return slider;
}


function updateSlider(slider, node) {
  const positionChanged = slider.style.left !== node.posPercent;
  slider.style.left = node.posPercent;
  slider.circle.style.background = "#" + node.colorHex;
  if (slider === selectedSliderElement) updateStopFields(slider, node);
  if (positionChanged && slider === selectedSliderElement) animateStopConnectors();
}

function formatStopPosition(position) {
  const percent = Math.round(position * 1000) / 10;
  return String(percent) + " %";
}

function formatStopColor(color) {
  return "#" + Number(color).toString(16).padStart(6, "0").slice(-6).toUpperCase();
}

function updateStopFields(slider, node) {
  if (!node) return;
  stopPositionInput.value = formatStopPosition(node.pos);
  stopColorInput.value = formatStopColor(node.color);
  stopColorInput.style.borderLeftColor = formatStopColor(node.color);
}

function animateStopConnectors() {
  connectorAnimationEnd = performance.now() + 450;
  if (connectorAnimationFrame !== undefined) return;

  const update = () => {
    updateStopConnectors();
    if (performance.now() < connectorAnimationEnd) {
      connectorAnimationFrame = requestAnimationFrame(update);
    } else {
      connectorAnimationFrame = undefined;
    }
  };
  connectorAnimationFrame = requestAnimationFrame(update);
}


function parseColorString(s) {
  // remove whitespaces
  s = s.trim();
  let m;
  // hex color, e.g. #ABC or #ABCDEF or 0x123456
  m = s.match(/^[#x]?((?<RRGGBB>[0-9A-Fa-f]{4,6})|(?<RGB>[0-9A-Fa-f]{0,3}))$/);
  if (m && m.groups.RRGGBB) return parseInt(m.groups.RRGGBB, 16);
  if (m && m.groups.RGB) return parseInt(Array.from(m.groups.RGB).map(x => x + x).join(""), 16);
  // 3 bytes, e.g. 255,128,0
  m = s.match(/^(?<R>\d{0,3})[,; ](?<G>\d{0,3})[,; ](?<B>\d{0,3})$/);
  if (m) return (parseInt(m.groups.R) << 16) + (parseInt(m.groups.G) << 8) + (parseInt(m.groups.B) << 0);
  // 3 floats, e.g. 0.1,.3,.5
  m = s.match(/^(?<R>\d*\.?\d*)[,; ](?<G>\d*\.?\d*)[,; ](?<B>\d*\.?\d*)$/);
  if (m) return (255 * parseFloat(m.groups.R) << 16) + (255 * parseFloat(m.groups.G) << 8) + (255 * parseFloat(m.groups.B) << 0);
  // fallback
  return 0;
}


function actionDelete(slider) {
  let i = gradient.findIndex(x => x.slider === slider);
  if (i < 0) return;
  const nextSlider = gradient[i + 1]?.slider || gradient[i - 1]?.slider;
  if (selectedSliderElement === slider) selectSlider(nextSlider);
  gradient.splice(i, 1);
  applyGradient();
}

function actionInsert(event) {
  let box = document.getElementById("gradient-bar").getBoundingClientRect();
  let pos = typeof event.clientX === "number" ? (event.clientX - box.left) / box.width : 0.5;
  pos = Math.min(Math.max(pos, 0), 1);
  let node = gradient.colorAt(pos);
  gradient.push(node);
  previewStopNode = undefined;
  hideStopPreview();
  applyGradient();
  selectSlider(node.slider);
}

function initializeStopPreview() {
  const bar = document.getElementById("gradient-bar");
  bar.addEventListener("pointermove", updateStopPreview);
  bar.addEventListener("pointerleave", hideStopPreview);
  window.addEventListener("resize", updateStopConnectors);
  const finishSliderDrag = function () {
    if (!draggingSliderElement) return;
    draggingSliderElement.classList.remove("is-dragging");
    draggingSliderElement = undefined;
  };
  window.addEventListener("pointerup", finishSliderDrag);
  window.addEventListener("pointercancel", finishSliderDrag);
}

function updateStopPreview(event) {
  if (draggingSliderElement) return;
  if (event.target.closest("#picker")) {
    hideStopPreview();
    return;
  }

  const bar = document.getElementById("gradient-bar");
  const box = bar.getBoundingClientRect();
  const hoveredSlider = event.target.closest("#sliders .slider");
  if (hoveredSlider === selectedSliderElement) {
    hideStopPreview();
    return;
  }
  const hoveredStop = hoveredSlider && gradient.find(node => node.slider === hoveredSlider);
  const pos = hoveredStop
    ? hoveredStop.pos
    : Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
  previewStopNode = hoveredStop || gradient.colorAt(pos);
  previewIsExistingStop = Boolean(hoveredStop);

  const marker = document.getElementById("stop-preview-marker");
  marker.style.left = (pos * 100) + "%";
  marker.querySelector(".stop-preview-handle").style.backgroundColor = "#" + previewStopNode.colorHex;
  marker.classList.toggle("visible", !hoveredStop);
  const stage = document.querySelector(".canvas-stage");
  stage.classList.add("is-previewing");
  document.getElementById("stop-config").classList.add("is-previewing");
  if (selectedSliderElement) updateStopFields(selectedSliderElement, previewStopNode);
  const addHint = document.getElementById("stop-add-hint");
  addHint.textContent = previewIsExistingStop ? "Click to edit" : "Click to add";
  addHint.hidden = false;
  if (selectedSliderElement) {
    document.getElementById("stop-delete").hidden = true;
    stopPositionInput.readOnly = true;
    stopColorInput.readOnly = true;
    pickerSetColor(parseInt(previewStopNode.colorHex, 16));
  }
  updateStopNavigation();
  updateStopConnectors();
}

function hideStopPreview() {
  previewStopNode = undefined;
  previewIsExistingStop = false;
  const marker = document.getElementById("stop-preview-marker");
  if (marker) marker.classList.remove("visible");
  const stage = document.querySelector(".canvas-stage");
  if (stage) stage.classList.remove("is-previewing");
  const stopConfig = document.getElementById("stop-config");
  if (stopConfig) stopConfig.classList.remove("is-previewing");
  const addHint = document.getElementById("stop-add-hint");
  if (addHint) {
    addHint.hidden = true;
    addHint.textContent = "Click to add stop";
  }
  if (selectedSliderElement) {
    const selectedNode = gradient.find(node => node.slider === selectedSliderElement);
    if (selectedNode) updateStopFields(selectedSliderElement, selectedNode);
    stopPositionInput.readOnly = false;
    stopColorInput.readOnly = false;
    document.getElementById("stop-delete").hidden = false;
    pickerSetColor(parseColorString(stopColorInput.value));
  }
  updateStopNavigation();
  updateStopConnectors();
}

function updateStopConnectors() {
  const stage = document.querySelector(".canvas-stage");
  const svg = document.getElementById("stop-connectors");
  if (!stage || !svg) return;

  const stageBox = stage.getBoundingClientRect();
  const barBox = document.getElementById("gradient-bar").getBoundingClientRect();
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  if (!width || !height) return;
  svg.setAttribute("viewBox", "0 0 " + width + " " + height);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));

  const configBox = document.getElementById("stop-config").getBoundingClientRect();
  const startX = configBox.left + configBox.width / 2 - stageBox.left;
  const startY = configBox.top - stageBox.top;
  const railY = barBox.bottom - stageBox.top + (startY - (barBox.bottom - stageBox.top)) / 2;
  const selectedPath = document.getElementById("selected-connector");
  const connectedSlider = previewStopNode
    ? (previewIsExistingStop ? previewStopNode.slider : undefined)
    : selectedSliderElement;
  const selectedLens = connectedSlider && connectedSlider.circle;

  if (selectedLens) {
    const lensBox = selectedLens.getBoundingClientRect();
    const endX = lensBox.left + lensBox.width / 2 - stageBox.left;
    const endY = lensBox.bottom - stageBox.top;
    selectedPath.setAttribute("d",
      "M " + startX + " " + startY + " V " + railY + " H " + endX + " V " + endY);
    selectedPath.style.display = "";
  } else {
    selectedPath.style.display = "none";
  }

  const previewPath = document.getElementById("preview-connector");
  if (previewStopNode && !previewIsExistingStop) {
    const endX = barBox.left + barBox.width * previewStopNode.pos - stageBox.left;
    const endY = barBox.bottom - stageBox.top;
    previewPath.setAttribute("d",
      "M " + startX + " " + startY + " V " + railY + " H " + endX + " V " + endY);
    previewPath.style.display = "";
  } else {
    previewPath.style.display = "none";
  }
}

function actionChange(slider, key, value) {
  let i = gradient.findIndex(x => x.slider === slider);
  gradient[i][key] = value;
  applyGradient();
  if (key === 'color') {
    pickerSetColor(value);
  }
}

function actionDivide(n = 1, interpolation = 'rgb') {
  gradient.subdivide(n, interpolation);
  applyGradient();
}

function actionNormalize(colorspace, axis) {
  gradient.normalize(colorspace, axis);
  applyGradient();
}

function actionReverse() {
  gradient.forEach(x => x.pos = 1 - x.pos);
  applyGradient();
}

function actionMirror() {
  gradient.forEach(x => x.pos *= 1 / 2);
  gradient.push(...gradient.slice(0, -1).map(x => new Node(1 - x.pos, x.color)));
  document.getElementById("setting-cyclic").checked = true;
  applyGradient();
}

function actionDistribute() {
  gradient.distributeEvenly();
  applyGradient();
}

function actionRandom() {
  gradient = Gradient.random();
  applyGradient();
}


function applyGradient() {
  gradient.sort();
  if (!flowPauseHashUpdates) {
    window.location.hash = gradient.hash();
    flowIgnoreNewHash = true;
  }
  uiRefreshAll();
}

function onLoad() {
  stopPositionInput = document.getElementById("stop-position");
  stopColorInput = document.getElementById("stop-color");
  document.getElementById("stop-delete").addEventListener("click", function () {
    actionDelete(selectedSliderElement);
  });
  document.getElementById("stop-previous").addEventListener("click", function () {
    navigateStop(-1);
  });
  document.getElementById("stop-next").addEventListener("click", function () {
    navigateStop(1);
  });
  const commitPosition = function () {
    const position = Number(stopPositionInput.value.trim().replace(/\s*%$/, ""));
    if (stopPositionInput.value.trim() === "" || !Number.isFinite(position) || position < 0 || position > 100) {
      stopPositionInput.setCustomValidity("Enter a position between 0 and 100.");
      stopPositionInput.reportValidity();
      return;
    }
    stopPositionInput.setCustomValidity("");
    if (!selectedSliderElement) return;
    actionChange(selectedSliderElement, 'pos', position / 100);
    stopPositionInput.setSelectionRange(stopPositionInput.value.length - 2, stopPositionInput.value.length - 2);
  };
  stopPositionInput.addEventListener("change", commitPosition);
  stopPositionInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitPosition();
    }
  });
  stopPositionInput.addEventListener("input", function () {
    stopPositionInput.setCustomValidity("");
  });
  stopColorInput.addEventListener("change", function () {
    if (!selectedSliderElement) return;
    actionChange(selectedSliderElement, 'color', parseColorString(stopColorInput.value));
  });
  stopColorInput.addEventListener("focus", function () {
    activeSliderElement = selectedSliderElement;
    pickerSetColor(parseColorString(stopColorInput.value));
  });

  // HSV color picker
  initPicker('picker', function (color) {
    let i = gradient.findIndex(x => x.slider === activeSliderElement);
    if (i < 0 || i >= gradient.length) return;
    gradient[i].color = color;
    flowPauseHashUpdates = true;
    applyGradient();
    flowPauseHashUpdates = false;
  });
  picker.style.display = "block";
  initializeStopPreview();
  // accessibility
  for (let element of document.getElementsByClassName('clickable')) {
    element.tabIndex = 0;
    element.addEventListener("keyup", function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.target.onclick(e);
      }
    });
  }
  // syntax highlighting
  try {
    hljs.addPlugin({
      'after:highlightElement': ({el, result}) => {
        el.classList.remove('hljs');
      }
    });
  } catch (e) {
  }

  onHashChanged();
}

function onHashChanged() {
  if (flowIgnoreNewHash) {
    flowIgnoreNewHash = false;
    return;
  }
  gradient = Gradient.fromHash(window.location.hash);
  if (gradient.length === 0) {
    // redirect to default gradient
    window.location.hash = "0:093391-33:019C5C-56:ABCD39-64:BFD336-77:B7D135-100:84CE34";
    makeSnackbarNotification('Click <span class="emoji">&#x2139;&#xfe0f;</span> for usage help');
  }
  if (selectedSliderElement && !gradient.some(x => x.slider === selectedSliderElement)) selectSlider(undefined);
  uiRefreshAll();
}

function onNameChanged() {
  let input = document.getElementById("gradient-name");
  gradient.name = input.value;
  applyGradient();
}

function uiRefreshAll() {
  // update sliders
  let box = document.getElementById("sliders");
  let obsolete = Array.from(box.children);
  for (let i = 0; i < gradient.length; i++) {
    if (!gradient[i].slider) {
      gradient[i].slider = createSliderElement();
      box.appendChild(gradient[i].slider);
    }
    updateSlider(gradient[i].slider, gradient[i]);
    obsolete = obsolete.filter(x => x !== gradient[i].slider);
  }
  obsolete.forEach(x => box.removeChild(x))
  if (selectedSliderElement && !gradient.some(x => x.slider === selectedSliderElement)) selectSlider(undefined);
  if (!selectedSliderElement && gradient.length > 0) {
    selectSlider(gradient[0].slider);
  }
  box.querySelectorAll(".slider").forEach(element => {
    element.classList.toggle("selected", element === selectedSliderElement);
    element.circle.setAttribute("aria-pressed", element === selectedSliderElement ? "true" : "false");
  });
  updateStopNavigation();


  // update gradient visualisation
  let backgrounds = document.getElementsByClassName("gradient-background");
  let cyclic = document.getElementById('setting-cyclic').checked;
  let style = CodeFlavourCSS.generate(gradient);
  for (let i = 0; i < backgrounds.length; i++) {
    if (!cyclic && (backgrounds[i].classList.contains("left") || backgrounds[i].classList.contains("right"))) {
      backgrounds[i].style.background = "#" + gradient.colorAt(backgrounds[i].classList.contains("left") ? 0 : 255).colorHex;
    } else {
      backgrounds[i].style.background = style;
    }
  }

  // update name
  document.getElementById("gradient-name").value = gradient.name || '';

  // update code output
  for (let flavour of codeFlavours) {
    let codeBox = document.getElementById(flavour.id);
    if (!codeBox) {

      // create new code tab
      codeBox = document.createElement('code');
      codeBox.id = flavour.id;
      codeBox.classList.add('code', 'tab-body-container', flavour.language);
      let pre = document.createElement('pre');
      pre.style.display = flavour.id === codeFlavourDefault ? 'block' : 'none';
      pre.tabIndex = -1;
      pre.appendChild(codeBox);
      document.getElementById('tab-body-box').appendChild(pre);

      // create tab button
      let button = document.createElement('button');
      button.classList.add('tab-bar-button', 'codestyle', 'reactive');
      if (flavour.id === codeFlavourDefault) {
        button.classList.add('selected');
      }
      button.innerHTML = flavour.title;
      button.title = flavour.longTitle || flavour.title;
      button.addEventListener('click', (function () {
        const i = flavour.id;
        return function (e) {
          openTab(i, e.target)
        };
      })());
      document.getElementById('tab-bar-box').appendChild(button);
    }

    // refresh contents
    codeBox.textContent = flavour.generate(gradient, gradient.name || 'my gradient',
      "Edit this gradient at " + window.location.href);

    // syntax highlighting
    try {
      hljs.highlightElement(codeBox);
    } catch (e) {
    }
  }
  updateStopConnectors();
}


async function copyCode() {
  let codeBoxes = document.getElementsByClassName('code');
  let visibleCodeBox = Array.from(codeBoxes).find(x => x.offsetParent);
  await navigator.clipboard.writeText(visibleCodeBox.textContent);
  makeSnackbarNotification(codeFlavours.find(x => x.id === visibleCodeBox.id).title + ' code copied to clipboard!');
}

async function copyLink() {
  await navigator.clipboard.writeText(window.location);
  makeSnackbarNotification('Link copied to clipboard!');
}

function downloadVirtualFile(filename, extension, contents) {
  let element = document.createElement('a');
  //element.href = 'data:application/' + extension + ';charset=utf-8,' + encodeURIComponent(contents);
  element.href = window.URL.createObjectURL(new Blob([contents], {type: "octet/stream"}));
  element.download = sanitized(filename) + "." + extension;
  element.click();
  makeSnackbarNotification(element.download + ' ready for download');
}

function downloadCode() {
  let codeBoxes = document.getElementsByClassName('code');
  let visibleCodeBox = Array.from(codeBoxes).find(x => x.offsetParent);
  let flavour = codeFlavours.find(x => x.id === visibleCodeBox.id);
  let contents = flavour.hasOwnProperty("file") ? flavour.file(gradient, gradient.name || 'my gradient',
    "Edit this gradient at " + window.location.href) : visibleCodeBox.textContent;
  downloadVirtualFile(gradient.name || 'my gradient', flavour.extension, contents);
}


function openTab(id, activeButton) {
  let tabs = Array.from(document.getElementsByClassName('tab-body-container'));
  tabs.forEach(x => x.parentElement.style.display = x.id === id ? "block" : "none");
  let buttons = Array.from(document.getElementsByClassName('tab-bar-button'));
  buttons.forEach(x => x.classList.remove('selected'));
  activeButton.classList.add('selected');

}


function aboutShow() {
  document.getElementById("about").style.display = "block";
}

function aboutDismiss() {
  document.getElementById("about").style.display = "none";
}
