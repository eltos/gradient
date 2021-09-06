


class Node {
	
	#p = 0;  // position as 0..1
	#c = 0;  // rgb color as 3 bytes
	
	constructor(pos, color){
		this.pos = pos;
		this.color = color;
	}
	
	set pos(pos) { this.#p = Math.min(Math.max(pos, 0), 1) || 0; }
	get pos() { return this.#p; }
	set color(color) { this.#c = color & 0xFFFFFF; }
	get color() { return this.#c; }
	get r() { return (this.#c >> 16) & 0xFF; }
	set r(v) { this.color = (this.color & 0x00FFFF) + ((Math.min(Math.max(v, 0), 255) & 255) << 16); }
	get g() { return (this.#c >> 8) & 0xFF; }
	set g(v) { this.color = (this.color & 0xFF00FF) + ((Math.min(Math.max(v, 0), 255) & 255) << 8); }
	get b() { return this.#c & 0xFF; }
	set b(v) { this.color = (this.color & 0xFFFF00) + (Math.min(Math.max(v, 0), 255) & 255); }
	get rgb() { return [this.r, this.g, this.b]; }
	set rgb(rgb) { [this.r, this.g, this.b] = rgb; }
	get value() { return Math.max(...this.rgb); }
	get lightness(){ return (Math.max(...this.rgb) + Math.min(...this.rgb))/2; }
	get luma(){ return 0.2126*this.r + 0.7152*this.g + 0.0722*this.b; }
	
	get pos255() { return (this.#p * 255) & 255; }
	get posHex() { return this.pos255.toString(16).padStart(2, "0").toUpperCase();}
	get posPercent() { return (this.#p * 100).toFixed(1) + "%"; }
	get colorHex() { return (this.#c).toString(16).padStart(6, "0").toUpperCase(); }
	
}




class Gradient extends Array {
	
	static fromHash(hash){
		// parse hash
		if (hash.startsWith("#")) { hash = hash.substr(1); }
		hash = hash.trim();
		if (!hash) { return new Gradient(); }
		let pos_colors = hash.split('-').map(x => x.indexOf(":") < 0 ? [undefined, x] : x.split(':'));
		// sort and parse values
		pos_colors.sort((a,b) => a[0] - b[0]);
		let pos = pos_colors.map(x => parseFloat(x[0]) / 100);
		let colors = pos_colors.map(x => parseInt(x[1], 16));
		// interpolate missing positions
		pos = pos.map((x, i) => isNaN(x) && i===0 ? 0 :  isNaN(x) && i===pos.length-1 ? 1 : x);
		for (let i = 0; i < pos.length; i++) {
			if (isNaN(pos[i])){
				let n = pos.slice(i).findIndex(x => !isNaN(x));
				for (let j = 0; j < n; j++) {
					pos[i+j] = pos[i-1] + (j+1) * (pos[i+n]-pos[i-1]) / (n+1);
				}
			}
		}
		// build gradient
		let g = new Gradient();
		g.push(...pos.map((p, i) => new Node(p, colors[i])));
		return g;
	}
	
	sort(){
		return super.sort((a, b) => a.pos - b.pos);
	}
	
	hash(){
		if (this.isDistributedEvenly()){
			return this.map(x => x.colorHex).join("-");
		}
		return this.map(x => Math.round(x.pos*1000)/10 + ":" + x.colorHex).join("-");
	}
	
	distributeEvenly(){
		return this.forEach((x, i) => x.pos = i/(this.length-1));
	}
	
	isDistributedEvenly(){
		return this.length <= 1 || this.every((x, i) => x.pos === i/(this.length-1));
	}
	
	interpolate(pos){
		let n = new Node(pos);
		let right = this.slice().sort().find(x => x.pos >= pos);
		let left = this.slice().sort().reverse().find(x => x.pos < pos);
		if (left && right){
			n.r = (left.r * (right.pos-pos) + right.r * (pos-left.pos)) / (right.pos-left.pos);
			n.g = (left.g * (right.pos-pos) + right.g * (pos-left.pos)) / (right.pos-left.pos);
			n.b = (left.b * (right.pos-pos) + right.b * (pos-left.pos)) / (right.pos-left.pos);
		} else if (left){
			n.color = left.color;
		} else if (right){
			n.color = right.color;
		}
		return n;
	}
	
	normalizeLightness(){
		let mean_l = gradient.map(x => x.lightness).reduce((a, b) => (a + b) / 2);
		for (let i = 0; i < gradient.length; i++) {
			let factor = mean_l / gradient[i].lightness;
			gradient[i].rgb = gradient[i].rgb.map(v => v*factor);
		}
	}
}





