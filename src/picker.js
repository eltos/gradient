


function color2hsv(color) {
    // input: 3 byte color, out: h in [0,360) and s,v in [0,1]
    let r = ((color >> 16) & 0xFF) / 255,
        g = ((color >>  8) & 0xFF) / 255,
        b = ((color >>  0) & 0xFF) / 255;
    let v = Math.max(r,g,b);
    let c = v - Math.min(r,g,b);
    let h = c && ((v===r) ? (g-b)/c : ((v===g) ? 2+(b-r)/c : 4+(r-g)/c));
    return [60*(h<0?h+6:h), v&&c/v, v];
}

function hsv2color(h,s,v) {
    // input: h in [0,360] and s,v in [0,1] - output: 3 byte color
    let f = (n,k=(n+h/60)%6) => 255 * (v - v*s*Math.max( Math.min(k,4-k,1), 0));
    return (f(5) << 16) + (f(3) << 8) + f(1) << 0;
}

function color2hex(color){
	return "#" + color.toString(16).padStart(6, "0").toUpperCase();
}



function pickerShow(x, y){
    picker.style.display = 'block';
    picker.style.left = x;
    picker.style.top = y;
	let margin = window.getComputedStyle(picker).marginLeft;
	picker.style.transform = "translateX(calc(-" + x + " - " + margin + "))";
}

function pickerHide(){
    picker.style.display = 'none';
}


function pickerSetColor(color) {
	console.log("picker set color: " + color);
    [pickerH, pickerS, pickerV] = color2hsv(color)
    pickerRefreshUI();
}





function pickerRefreshUI(){
	// hue in 0..360 degree
    pickerHueDot.style.left = Math.sin(Math.PI*pickerH/180)*100 + "%";
    pickerHueDot.style.top = -Math.cos(Math.PI*pickerH/180)*100 + "%";
	pickerHueDot.style.background = color2hex(hsv2color(pickerH, 1, 1));
	
	// saturation along right side of triangle, value as distance to lower left edge
	pickerSvDot.style.left = 100 * Math.cos(30*Math.PI/180) * ( pickerV * ( 2 - pickerS ) - 1 ) + "%";
	pickerSvDot.style.top = 50 - 150 * pickerV * pickerS + "%";
	pickerSvDot.style.background = color2hex(hsv2color(pickerH, pickerS, pickerV));
	
	// triangle
	document.getElementById("picker-svg-triangle-color-bg").style.fill = color2hex(hsv2color(pickerH, 1, 1));
}


let picker = undefined, 
    pickerHueDot = undefined,
    pickerSvDot = undefined;
let pickerH = 0, pickerS = 1, pickerV = 1;

function initPicker(id, onColorChangedCallback){
    picker = document.getElementById(id);

    picker.addEventListener('mousedown', function (e){e.preventDefault()});
    picker.addEventListener('touchstart', function (e){e.preventDefault()});

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


    // init interactive elements
    makeDraggable(pickerHueDot, function (element, e) {
        // update position
        let x = e.clientX || e.touches[0].clientX,
            y = e.clientY || e.touches[0].clientY;
        let box = element.parentElement.getBoundingClientRect();
        let dx = (x - box.left) / box.width,
            dy = (y - box.top) / box.height;
        
		pickerH = 180*Math.atan2(dx, -dy)/Math.PI;
        
		pickerRefreshUI();
        onColorChangedCallback(hsv2color(pickerH, pickerS, pickerV));
    });
	
	makeDraggable(pickerSvDot, function (element, e) {
        // update position
        let x = e.clientX || e.touches[0].clientX,
            y = e.clientY || e.touches[0].clientY;
        let box = element.parentElement.getBoundingClientRect();
        let dx = (x - box.left) / box.width, // -1 .. +1
            dy = (y - box.top) / box.height;
		
		let v = dx/Math.cos(30*Math.PI/180)/2 + 0.5 + (0.5-dy)/3,
		    s = (0.5-dy)/1.5/v;
		pickerV = Math.min(Math.max(v, 0), 1);		
		pickerS = Math.min(Math.max(s, 0), 1);
        
		pickerRefreshUI();
        onColorChangedCallback(hsv2color(pickerH, pickerS, pickerV));
    });

    pickerHide();

}
