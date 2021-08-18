

/*
 * GUI general
 */

function makeSnackbarNotification(text, duration=3000) {
	let x = document.getElementById("snackbar");
	x.innerHTML = text;
	x.className = "show";
	setTimeout(function(){ x.className = x.className.replace("show", ""); }, duration);
}









/*
 * Gradient designer GUI
 */

let gradient = new Gradient();
let flowIgnoreNewHash = false;
let flowPauseHashUpdates = false;


function createInputElement(slider, classname, title, callback){
	let dot = document.createElement("input");
	dot.slider = slider;
	dot.classList.add("slider-input", classname);
	dot.title = title;
	dot.type = "number";
	dot.min = 0;
	dot.max = 255;
	if (callback){
		dot.addEventListener("change", callback);
	} else {
		dot.readOnly = true;
	}
	return dot;
}

function createSliderElement(){
	let slider = document.createElement("div");
	slider.classList.add("slider", "reactive");
	
	let colorLens = document.createElement("div");
	colorLens.classList.add("slider-lens");
	makeSliderDraggable(colorLens);
	slider.circle = colorLens;
	slider.appendChild(colorLens);
	
	let inputContainer = document.createElement("div");
	inputContainer.classList.add("slider-inputs");
	slider.input_p = createInputElement(slider, "slider-input-p", "Anchor position",       function(event) {actionChange(event.target.slider, 'pos', event.target.value/100)});
	slider.input_r = createInputElement(slider, "slider-input-r", "Red color component",   function(event) {actionChange(event.target.slider, 'r', event.target.value)});
	slider.input_g = createInputElement(slider, "slider-input-g", "Green color component", function(event) {actionChange(event.target.slider, 'g', event.target.value)});
	slider.input_b = createInputElement(slider, "slider-input-b", "Blue color component",  function(event) {actionChange(event.target.slider, 'b', event.target.value)});
	inputContainer.appendChild(slider.input_p);
	inputContainer.appendChild(slider.input_r);
	inputContainer.appendChild(slider.input_g);
	inputContainer.appendChild(slider.input_b);
	slider.appendChild(inputContainer);
	
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
	slider.input_p.value = Math.round(node.pos*1000)/10;
	slider.input_r.value = node.r;
	slider.input_g.value = node.g;
	slider.input_b.value = node.b;
}


function makeSliderDraggable(element) {
	element.addEventListener('mousedown', dragStart);
	element.addEventListener('touchstart', dragStart);
	let transitionToRestore;
	
	function dragStart(e) {
		e.preventDefault();
		document.addEventListener('mousemove', dragMove);
		document.addEventListener('touchmove', dragMove, { passive: false });
		document.addEventListener('mouseup', dragEnd);
		document.addEventListener('touchend', dragEnd);
		flowPauseHashUpdates = true;
		transitionToRestore = element.parentElement.style.transition;
		element.parentElement.style.transition = "none";
	}

	function dragMove(e) {
		e.preventDefault();
		// update position
		let box = element.closest('.bar').getBoundingClientRect()
		let x = e.clientX || e.touches[0].clientX;
		let value = (x - box.left) / box.width;
		actionChange(element.parentElement, 'pos', value);
	}

	function dragEnd() {
		document.removeEventListener('mousemove', dragMove);
		document.removeEventListener('touchmove', dragMove);
		document.removeEventListener('mouseup', dragEnd);
		document.removeEventListener('touchend', dragEnd);
		flowPauseHashUpdates = false;
		element.parentElement.style.transition = transitionToRestore;
		applyGradient();
	}
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

function onHashChanged(){
	if (flowIgnoreNewHash){
		flowIgnoreNewHash = false;
		return;
	}
	gradient = Gradient.fromHash(window.location.hash);
	if (gradient.length === 0){
		// TODO: redirect to default gradient?
		makeSnackbarNotification('Start adding anchors by clicking on the bar');
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
	let style = gradient_as_css(gradient);
	for (let i = 0; i < backgrounds.length; i++) {
		if (!cyclic && (backgrounds[i].classList.contains("left") || backgrounds[i].classList.contains("right"))){
			backgrounds[i].style.background = "#" + gradient.interpolate(backgrounds[i].classList.contains("left") ? 0 : 255).colorHex;
		} else {
			backgrounds[i].style.background = style;
		}
	}
		
	
	// update code output
	for (let id in code_flavours){
		let [title, builder, language] = code_flavours[id];

		let codeBox = document.getElementById(id);
		if (!codeBox){

			// create new code tab
			codeBox = document.createElement('code');
			codeBox.id = id;
			codeBox.classList.add('code', 'tab-body-container', language);
			let pre = document.createElement('pre');
			pre.style.display = id === code_flavour_default ? 'block' : 'none';
			pre.appendChild(codeBox);
			document.getElementById('tab-body-box').appendChild(pre);

			// create tab button
			let button = document.createElement('button');
			button.classList.add('tab-bar-button', 'codestyle');
			if (id === code_flavour_default) { button.classList.add('selected'); }
			button.innerHTML = title;
			button.addEventListener('click', (function(){
				const i=id;
				return function(e){
					openTab(i, e.target)
				};
			})());
			document.getElementById('tab-bar-box').appendChild(button);
			//document.getElementById('tab-bar-box').insertBefore(button, document.getElementById('tab-bar-box').lastElementChild);
		}
		codeBox.innerHTML = builder(gradient, code_palette_name);
	}
	
}
 
async function copyCode(){
	let codeBoxes = document.getElementsByClassName('code');
	for (let i = 0; i < codeBoxes.length; i++) {
		if (codeBoxes[i].parentElement.style.display !== "none"){
			await navigator.clipboard.writeText(codeBoxes[i].innerHTML);
			makeSnackbarNotification(code_flavours[codeBoxes[i].id][0] + ' code copied to clipboard!');
			break;
		}
	}
}

function openTab(id, activeButton){
	let tabs = Array.from(document.getElementsByClassName('tab-body-container'));
	tabs.forEach(x => x.parentElement.style.display = x.id === id ? "block" : "none");
	let buttons = Array.from(document.getElementsByClassName('tab-bar-button'));
	buttons.forEach(x => x.classList.remove('selected'));
	activeButton.classList.add('selected');
	
}

