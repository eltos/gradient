/*
 * GUI general
 */

function makeSnackbarNotification(text) {
	let x = document.getElementById("snackbar");
	if (x == undefined){
		x = document.createElement("div");
		x.id = "snackbar";
		document.getElementsByTagName("body")[0].appendChild(x);
	}
	x.innerHTML = text;
	x.className = "show";
	setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}


