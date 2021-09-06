


/*
 * Gradient designer GUI
 */

let gradient = new Gradient();
let flowIgnoreNewHash = false;
let flowPauseHashUpdates = false;
let activeSliderElement = undefined;

function createSliderElement(){
	let slider = document.createElement("div");
	slider.classList.add("slider", "reactive");
	
	let colorLens = document.createElement("div");
	colorLens.classList.add("slider-lens");
	makeDraggable(colorLens, function (element, e) {
		// update position
		let box = element.closest('.bar').getBoundingClientRect()
		let x = e.clientX || e.touches[0].clientX;
		let value = (x - box.left) / box.width;
		flowPauseHashUpdates = true;
		actionChange(element.parentElement, 'pos', value);
		flowPauseHashUpdates = false;
	});
	slider.circle = colorLens;
	slider.appendChild(colorLens);
	
	let inputContainer = document.createElement("div");
	inputContainer.classList.add("slider-inputs");
	slider.appendChild(inputContainer);

	slider.input_pos = document.createElement("input");
	slider.input_pos.slider = slider;
	slider.input_pos.classList.add("slider-input", "slider-input-p");
	Object.assign(slider.input_pos, {title: "Anchor position (%)",
		type: "number", min: 0, max: 100});
	slider.input_pos.addEventListener("change", function(event) {
		actionChange(event.target.slider, 'pos', event.target.value/100)});
	inputContainer.appendChild(slider.input_pos);

	slider.input_col = document.createElement("input");
	slider.input_col.slider = slider;
	slider.input_col.classList.add("slider-input", "slider-input-c");
	Object.assign(slider.input_col, {title: "Anchor color (hex)",
		type: "text", pattern:"[0-9A-Fa-f]{6}"});
	slider.input_col.addEventListener("change", function(event) {
		let s = event.target.value;
		if (s.startsWith('#')) s = s.substr(1);
		if (s.length <= 3) s = Array.from(s).map(x => x+x).join("");
		actionChange(event.target.slider, 'color', parseInt(s, 16))});
	slider.input_col.addEventListener('focus', function (event) {
		activeSliderElement = event.target.slider;
		pickerSetColor(parseInt(event.target.value, 16));
		let box = event.target.getBoundingClientRect();
		let x = event.target.slider.style.left,
			y = box.bottom - document.getElementsByClassName('bar')[0].getBoundingClientRect().top + "px";
		pickerShow(x, y);
	});
	slider.input_col.addEventListener('focusout', function (){
		activeSliderElement = undefined;
		pickerHide();
	});
	inputContainer.appendChild(slider.input_col);
	
	let deleteButton = document.createElement("button");
	deleteButton.addEventListener("click", function(event) {actionDelete(event.target.parentElement)})
	deleteButton.classList.add("slider-delete");
	deleteButton.tabIndex = -1;
	deleteButton.title = "Remove anchor";
	deleteButton.textContent = "×";
	slider.appendChild(deleteButton);

	return slider;
}


function updateSlider(slider, node){
	slider.style.left = node.posPercent;
	slider.circle.style.background = "#"+node.colorHex;
	slider.input_pos.value = Math.round(node.pos*1000)/10;
	slider.input_col.value = node.colorHex;
}




function actionDelete(slider){
	let i = gradient.findIndex(x => x.slider === slider);
	gradient.splice(i, 1);
	applyGradient();
}

function actionInsert(event){
	let box = event.target.getBoundingClientRect();
	let pos = (event.clientX - box.left) / box.width;
	gradient.push(gradient.interpolate(pos));
	applyGradient();
}

function actionChange(slider, key, value){
	let i = gradient.findIndex(x => x.slider === slider);
	gradient[i][key] = value;
	applyGradient();
	if (key === 'color') {
		pickerSetColor(value);
	}
}


function actionNormalizeLightness(){
	gradient.normalizeLightness();
	applyGradient();
}

function actionReverse(){
	gradient.forEach(x => x.pos = 1-x.pos);
	applyGradient();
}

function actionDistribute(){
	gradient.distributeEvenly();
	applyGradient();
}



function applyGradient(){
	gradient.sort();
	if (!flowPauseHashUpdates){
		window.location.hash = gradient.hash();
		flowIgnoreNewHash = true;
	}
	uiRefreshAll();
}

function onLoad(){
	initPicker('picker', function (color) {
		if (activeSliderElement === undefined) return;
		let i = gradient.findIndex(x => x.slider === activeSliderElement);
		gradient[i].color = color;
		flowPauseHashUpdates = true;
		applyGradient();
		flowPauseHashUpdates = false;
	});
	onHashChanged();
}

function onHashChanged(){
	if (flowIgnoreNewHash){
		flowIgnoreNewHash = false;
		return;
	}
	gradient = Gradient.fromHash(window.location.hash);
	if (gradient.length === 0){
		// redirect to default gradient
		window.location.hash = "0:093391-33:019C5C-56:ABCD39-64:BFD336-77:B7D135-100:84CE34";
		makeSnackbarNotification('Click on the bar to add anchors');
	}
	uiRefreshAll();
}

function uiRefreshAll(){
	// update sliders
	let box = document.getElementById("sliders");
	let obsolete = Array.from(box.children);
	for (let i = 0; i < gradient.length; i++) {
		if (!gradient[i].slider){
			gradient[i].slider = createSliderElement();
			box.appendChild(gradient[i].slider);
		}
		updateSlider(gradient[i].slider, gradient[i]);
		obsolete = obsolete.filter(x => x !== gradient[i].slider);
	}
	obsolete.forEach(x => box.removeChild(x))


	// update gradient visualisation
	let backgrounds = document.getElementsByClassName("gradient-background");
	let cyclic = document.getElementById('setting-cyclic').checked;
	let style = CodeFlavourCSS.generate(gradient);
	for (let i = 0; i < backgrounds.length; i++) {
		if (!cyclic && (backgrounds[i].classList.contains("left") || backgrounds[i].classList.contains("right"))){
			backgrounds[i].style.background = "#" + gradient.interpolate(backgrounds[i].classList.contains("left") ? 0 : 255).colorHex;
		} else {
			backgrounds[i].style.background = style;
		}
	}
		
	
	// update code output
	for (let flavour of codeFlavours){
		let codeBox = document.getElementById(flavour.id);
		if (!codeBox){

			// create new code tab
			codeBox = document.createElement('code');
			codeBox.id = flavour.id;
			codeBox.classList.add('code', 'tab-body-container', flavour.language);
			let pre = document.createElement('pre');
			pre.style.display = flavour.id === codeFlavourDefault ? 'block' : 'none';
			pre.appendChild(codeBox);
			document.getElementById('tab-body-box').appendChild(pre);

			// create tab button
			let button = document.createElement('button');
			button.classList.add('tab-bar-button', 'codestyle');
			if (flavour.id === codeFlavourDefault) { button.classList.add('selected'); }
			button.innerHTML = flavour.title;
			button.addEventListener('click', (function(){
				const i=flavour.id;
				return function(e){
					openTab(i, e.target)
				};
			})());
			document.getElementById('tab-bar-box').appendChild(button);
		}
		codeBox.textContent = flavour.generate(gradient, codeGradientName,
			"Edit this gradient at " + window.location.href);
	}
	
}
 
async function copyCode(){
	let codeBoxes = document.getElementsByClassName('code');
	let visibleCodeBox = Array.from(codeBoxes).find(x => x.offsetParent);
	await navigator.clipboard.writeText(visibleCodeBox.textContent);
	makeSnackbarNotification(codeFlavours.find(x => x.id === visibleCodeBox.id).title + ' code copied to clipboard!');
}

function downloadVirtualFile(filename, extension, contents){
	let element = document.createElement('a');
	element.href = 'data:application/' + extension + ';charset=utf-8,' + encodeURIComponent(contents);
	element.download = filename + "." + extension;
	element.click();
	makeSnackbarNotification(element.download + ' ready for download');
}

function downloadCode(){
	let codeBoxes = document.getElementsByClassName('code');
	let visibleCodeBox = Array.from(codeBoxes).find(x => x.offsetParent);
	let flavour = codeFlavours.find(x => x.id === visibleCodeBox.id);
	let contents = flavour.hasOwnProperty("file") ? flavour.file(visibleCodeBox.textContent) : visibleCodeBox.textContent;
	downloadVirtualFile(codeGradientName, flavour.extension, contents);
}


function openTab(id, activeButton){
	let tabs = Array.from(document.getElementsByClassName('tab-body-container'));
	tabs.forEach(x => x.parentElement.style.display = x.id === id ? "block" : "none");
	let buttons = Array.from(document.getElementsByClassName('tab-bar-button'));
	buttons.forEach(x => x.classList.remove('selected'));
	activeButton.classList.add('selected');
	
}

