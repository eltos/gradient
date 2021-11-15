 
/**
 * Code for gallery.html
 *
 */

function hasFavourites(){
	return getFavourites().length > 0;
}

function getFavourites(){
	return JSON.parse(window.localStorage.getItem('favs')) || [];
}

function setFavourites(list){
	window.localStorage.setItem('favs', JSON.stringify(list));
}

function clearFavourites(){
	if (confirm('Remove all favourite gradients?')) {
		window.localStorage.removeItem('favs');
		makeSnackbarNotification("Favourites cleared");
		populateGallery();
	}
}

function addFavourite(hash){
	let favs = getFavourites();
	favs.unshift(hash);
	setFavourites(favs);
	makeSnackbarNotification("Added to favourites");
	populateGallery();
}

function removeFavourite(hash){
	if (confirm('Remove this gradient from favourites?')){
		let favs = getFavourites();
		favs.splice(favs.indexOf(hash), 1);
		setFavourites(favs);
		populateGallery();
	}
}

function addDefaultFavourites(){
	let favs = getFavourites();
	favs = favs.concat([
		"F5515F-A1051D",
		"B3EB50-429421",
		"0FF0B3-036ED9",
		"F36265-961276",
		"E3E3E3-506874",
		"0:020024-35:090979-100:00D4FF",
		"F3DC00-FAA300-FF6201-FF1E02-F3DC00",
		"1F4E5A-15:029C8E-FFDB69-85:FFA658-EA5F40",
		"9C4F96-FF6355-FBA949-FAE442-8BD448-2AA8F2",
		"Plasma=0C0786-6A00A7-AF2890-E06461-FCA635-EFF821",
		"gist ncar=0:000080-5.1:005F05-5.6:005E0C-10.7:0000FF-15.8:00B7FF-21.4:00FEFD-26.5:00FA9D-32.1:01FE00-37.2:62CE00-42.9:80FF01-53.6:FFFD00-64.3:FFB50E-68.4:FF5C03-75:FF0008-80.1:FF00FC-85.7:9E33FE-90.8:ED81EE-100:FCECFC"
	]);
	setFavourites(favs);
	populateGallery();
}



function createGalleryElement(hash, tmp=false){
	let gradient = Gradient.fromHash(hash);
	let node = document.createElement("div");
	node.hash = hash;
	node.classList.add("gradient-box");
	node.style.background = CodeFlavourCSS.generate(gradient);
	
	let link = document.createElement("a");
	link.title = "Edit gradient"
	link.href = "./#" + hash;
	node.appendChild(link);
	
	if (tmp){ // temporary entry, add "add to gallery" plus-button
		let p = document.createElement("button");
		p.addEventListener("click", function(event) {addFavourite(event.target.parentElement.hash)});
		p.classList.add("item-add");
		p.title = "Add to favourites";
		p.textContent = "＋";
		node.appendChild(p);
		
	} else { // regular entry, add "delete" x-button
		let x = document.createElement("button");
		x.addEventListener("click", function(event) {removeFavourite(event.target.parentElement.hash)});
		x.classList.add("item-delete");
		x.title = "Remove from favourites";
		x.textContent = "×";
		node.appendChild(x);
	}

	if (gradient.name){
		let t = document.createElement("div");
		t.classList.add("item-title");
		t.innerText = gradient.name;
		node.appendChild(t);
	}
	
	return node;
}

function populateGallery(){
	
	// hint with option to add example favourites
	document.getElementById("gradient-box-hint").style.display = hasFavourites() ? "none" : "";
	
	// populate table
	let newhash = Gradient.fromHash(window.location.hash).hash();
	let favs = getFavourites();
		
	let table = document.getElementById("gradient-box-table");
	Array.from(table.children).forEach(x => table.removeChild(x));
	
	if (newhash !== "" && !favs.includes(newhash)){
		table.appendChild(createGalleryElement(newhash, true));
	}
	
	favs.forEach(hash => table.appendChild(createGalleryElement(hash)));
	
	if (table.children.length === 0){
		table.appendChild(createGalleryElement("AAAAAA", true));
	}
}