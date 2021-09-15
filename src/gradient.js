/**
 * Base model for a color gradient
 * as a list of nodes each with position and rgb color
 *
 * Hash format: PP:RRGGBB-PP:RRGGBB-PP:RRGGBB-...
 * PP = position in percent (float, optional)
 * RRGGBB = color in RGB hex format
 *
 */


/**
 * A color node
 */
class Node {
	
	#p = 0;  // position as 0..1
	#c = 0;  // rgb color as 3 bytes

	/**
	 * Create a color node
	 *
	 * @param pos node position as fraction from 0 to 1
	 * @param color node color as 3 byte RGB integer
	 */
	constructor(pos, color){
		this.pos = pos;
		this.color = color;
	}


	/**
	 * Node position
	 */
	get pos() { return this.#p; }
	set pos(pos) { this.#p = Math.min(Math.max(pos, 0), 1) || 0; }

	get pos255() { return (this.#p * 255) & 255; }
	get posPercent() { return (this.#p * 100).toFixed(1) + "%"; }


	/**
	 * Node color as standard RGB: red in [0, 255], green in [0, 255], blue in [0, 255]
	 */
	get color() { return this.#c; }
	set color(color) { this.#c = color & 0xFFFFFF; }

	get colorHex() { return (this.#c).toString(16).padStart(6, "0").toUpperCase(); }

	get r() { return (this.#c >> 16) & 0xFF; }
	set r(v) { this.color = (this.color & 0x00FFFF) + ((Math.min(Math.max(Math.round(v), 0), 255) & 255) << 16); }
	get g() { return (this.#c >> 8) & 0xFF; }
	set g(v) { this.color = (this.color & 0xFF00FF) + ((Math.min(Math.max(Math.round(v), 0), 255) & 255) << 8); }
	get b() { return this.#c & 0xFF; }
	set b(v) { this.color = (this.color & 0xFFFF00) + (Math.min(Math.max(Math.round(v), 0), 255) & 255); }
	get rgb() { return [this.r, this.g, this.b]; }
	set rgb([r, g, b]) { [this.r, this.g, this.b] = [r, g, b]; }


	/**
	 * Node color as HSV/HSL: hue in [0,360), saturation in [0,1], value or lightness in [0,1]
	 */
	get hue() {
		let h = this.chroma === 0 ? 0 :
			this.value === this.r/255 ? (this.g-this.b)/this.chroma/255 :
				this.value === this.g/255 ? 2+(this.b-this.r)/this.chroma/255 :
					this.value === this.b/255 ? 4+(this.r-this.g)/this.chroma/255 : 0;
		return 60 * (h<0 ? h+6 : h);
	}
	get value() { return Math.max(...this.rgb)/255; }
	get lightness() { return (Math.max(...this.rgb) + Math.min(...this.rgb))/2/255; }
	get chroma() { return (Math.max(...this.rgb) - Math.min(...this.rgb))/255; }

	get hsv() {
		let sat_v = this.value === 0 ? 0 : this.chroma / this.value;
		return [this.hue, sat_v, this.value];
	}
	set hsv([h, s, v]){
		let f = (n, k=(n+h/60)%6) => 255 * (v - v*s*Math.max( Math.min(k,4-k,1), 0));
		this.color = (f(5) << 16) + (f(3) << 8) + f(1) << 0;
	}

	get hsl() {
		let n = 1 - Math.abs(2*this.lightness - 1);
		let sat_l = n === 0 ? 0 : 2 * (this.value - this.lightness) / n;
		return [this.hue, sat_l, this.lightness];
	}
	set hsl([h, s, l]){
		let f = (n, k=(n+h/30)%12) => 255 * (l - s*Math.min(l, 1-l)*Math.max( Math.min(k-3,9-k,1), -1));
		this.color = (f(0) << 16) + (f(8) << 8) + f(4) << 0;
	}


	/**
	 * Node color as CIE XYZ: X,Y,Z in [0,1]
	 * Using standard sRGB and D65 reference white
	 */
	get xyz() {
		// inverse companding
		let [r, g, b] = this.rgb.map(v => v/255).map(v => v <= 0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4);
		// linear RGB to XYZ (sRGB D65 reference white)
		return [(0.4124564*r + 0.3575761*g + 0.1804375*b),
				(0.2126729*r + 0.7151522*g + 0.0721750*b),
				(0.0193339*r + 0.1191920*g + 0.9503041*b)];
	}
	set xyz([x, y, z]) {
		// linear XYZ to RGB (sRGB D65 reference white)
		let r =   3.2404542*x - 1.5371385*y - 0.4985314*z,
		    g =  -0.9692660*x + 1.8760108*y + 0.0415560*z,
		    b =   0.0556434*x - 0.2040259*y + 1.0572252*z;
		// companding
		this.rgb = [r, g, b].map(v => v <= 0.0031308 ? v*12.92 : 1.055*v**(1/2.4) - 0.055).map(v => v*255);
	}

	/**
	 * Node color as CIE Luv/LCH(uv): hue in [0,360)
	 * Using standard illuminant D65 (6500 K) and standard 2° observer
	 * Based on formulas from http://www.brucelindbloom.com/index.html?Math.html
	 */
	#illuminant = [0.95047, 1, 1.08883] // [X, Y, Z] for standard illuminant D65 (6500 K) and standard 2° observer

	get luv(){
		let [Xr, Yr, Zr] = this.#illuminant;
		let [X, Y, Z] = this.xyz;
		let L = Y/Yr > 0.008856 ? 116*(Y/Yr)**(1/3)-16 : 903.3*(Y/Yr);
		let u = 13*L*(4*X/(X+15*Y+3*Z) - 4*Xr/(Xr+15*Yr+3*Zr)),
			v = 13*L*(9*Y/(X+15*Y+3*Z) - 9*Yr/(Xr+15*Yr+3*Zr));
		return [L, u, v];
	}
	set luv([L, u, v]){
		let [Xr, Yr, Zr] = this.#illuminant;
		let ur = 4*Xr/(Xr+15*Yr+3*Zr),
			vr = 9*Yr/(Xr+15*Yr+3*Zr),
			a = (52*L/(u + 13*L*ur) - 1)/3,
			d = (39*L/(v + 13*L*vr) - 5);
		let Y = L > 903.3*0.008856 ? ((L+16)/116)**3 : L/903.3,
			X = Y*(d+5)/(a+1/3),
			Z = X*a - 5*Y;
		this.xyz = [X, Y, Z];
	}

	get hlc_uv(){
		let [L, u, v] = this.luv;
		let C = (u**2 + v**2)**0.5,
			H = Math.atan2(v, u)/Math.PI*180;
		return [H<0 ? H+360 : H, L, C];
	}
	set hlc_uv([H, L, C]){
		let u = C*Math.cos(H/180*Math.PI),
			v = C*Math.sin(H/180*Math.PI);
		this.luv = [L, u, v];
	}


}


/**
 * A color gradient as an array of color {@link Node}s
 */
class Gradient extends Array {

	name = undefined;

	/**
	 * Build a gradient from a hash, e.g.
	 *   "0:FF0000-25:00FF00-87.3:0000FF"
	 *   "FF0000-AABBCC"
	 *
	 * @param hash hash describing the gradient
	 * @returns {Gradient} new gradient
	 */
	static fromHash(hash){
		// parse hash
		let name = undefined;
		if (hash.startsWith("#")) { hash = hash.substr(1); }
		if (hash.includes('=')) {
			[name, hash] = hash.split('=', 2);
			name = decodeURIComponent(name);
		}
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
		let g = new Gradient(...pos.map((p, i) => new Node(p, colors[i])));
		g.name = name;
		return g;
	}

	/**
	 * Return a hash describing this gradient
	 * The hash can be used with {@link Gradient#fromHash} to reconstruct the gradient
	 *
	 * @returns {string} hash
	 */
	hash(){
		let hash = this.name ? this.name + '=' : '';
		if (this.isDistributedEvenly()){
			hash += this.map(x => x.colorHex).join("-");
		} else {
			hash += this.map(x => Math.round(x.pos*1000)/10 + ":" + x.colorHex).join("-");
		}
		return hash;
	}

	/**
	 * Generate a somewhat random gradient
	 */
	static random(){
		let a = new Node(0),
			b = new Node(1);
		a.hsv = [360*Math.random(), 0.5+0.5*Math.random(), 0.5+0.5*Math.random()];
		b.hsv = [360*Math.random(), 0.2+0.8*Math.random(), 0.2+0.8*Math.random()];
		let g = new Gradient(a, b);
		g.subdivide(3, 'hlc_uv');
		g.name = 'Random gradient ' + Math.round(9999*Math.random());
		return g;
	}

	/**
	 * Sort the nodes of this color gradient in place
	 *
	 * @returns {Array} this gradient
	 */
	sort(){
		return super.sort((a, b) => a.pos - b.pos);
	}

	/**
	 * Distribute the color nodes evenly along the gradient in place
	 */
	distributeEvenly(){
		return this.forEach((x, i) => x.pos = i/(this.length-1));
	}

	/**
	 * Check if the color nodes of this gradient are distributed evenly,
	 * that is exactly like {@link distributeEvenly} would do
	 *
	 * @returns {boolean} true if the nodes are distributed evenly
	 */
	isDistributedEvenly(){
		return this.length <= 1 || this.every((x, i) => x.pos === i/(this.length-1));
	}

	/**
	 * Determine the color of this gradient at a given position by interpolation
	 *
	 * @param pos the position in range 0..1
	 * @param interpolation the node color triplet property to interpolate, e.g. 'rgb', 'hsv', 'hsl', 'xyz', 'luv' or 'hlc_uv'
	 * @param shortest_hue if true, interpolate across the 360°-0° transit of hue if this is shorter
	 * @returns {Node} interpolated color node
	 */
	colorAt(pos, interpolation='rgb', shortest_hue=true){
		shortest_hue &= interpolation.startsWith('h') // hue based, make sure to interpolate shortest angle
		let n = new Node(pos);
		let right = this.slice().sort().find(x => x.pos >= pos);
		let left = this.slice().sort().reverse().find(x => x.pos < pos);
		if (left && right){
			let a_left = left[interpolation], a_right = right[interpolation];
			if (shortest_hue){
				// adjust hue to interpolate shortest angle
				if (Math.abs(a_left[0]-360-a_right[0]) < Math.abs(a_left[0]-a_right[0])) a_left[0] -= 360;
				if (Math.abs(a_left[0]+360-a_right[0]) < Math.abs(a_left[0]-a_right[0])) a_left[0] += 360;
			}
			let interp = (a1, p1, p, p2, a2) => a1.map((_,i) => (a1[i] * (p2 - p) + a2[i] * (p - p1)) / (p2 - p1));
			let a_new = interp(a_left, left.pos, pos, right.pos, a_right);
			if (shortest_hue){
				// correct for negative angle
				while (a_new[0] < 0) a_new[0] += 360;
				while (a_new[0] >= 360) a_new[0] -= 360;
			}
			n[interpolation] = a_new;

		} else if (left){
			n.color = left.color;
		} else if (right){
			n.color = right.color;
		}
		return n;
	}

	/**
	 * Divide the gradient into smaller segments by inserting new nodes in place
	 *
	 * @param n number of new nodes inserted in between each two existing nodes
	 * @param interpolation interpolation type, see {@link colorAt}
	 */
	subdivide(n = 1, interpolation = 'rgb'){
		let new_nodes = [];
		for (let i = 0; i < this.length - 1; i++) {
			for (let k = 1; k <= n; k++){
				let pos = this[i].pos * k / (n+1) + this[i+1].pos * (n+1-k) / (n+1);
				new_nodes.push(this.colorAt(pos, interpolation))
			}
		}
		this.push(...new_nodes)
		this.sort();
	}

	/**
	 * Normalize the gradient according to the specified colorspace and axis in place
	 *
	 * @param colorspace the colorspace used for normalisation, e.g. 'rgb', 'hsv', 'hsl', 'xyz', 'luv' or 'hlc_uv'
	 * @param axis the axis of the colorspace to normalize, e.g. 2 for value in hsv or 0 for red in rgb
	 */
	normalize(colorspace = 'luv', axis = 0){
		let mean = gradient.map(x => x[colorspace][axis]).reduce((a, b) => (a + b) / 2);
		for (let i = 0; i < gradient.length; i++) {
			let vals = gradient[i][colorspace];
            vals[axis] = mean;
            gradient[i][colorspace] = vals;
		}
	}

}





