/*
 * Snackbar notification
 */

let snackbarTimeoutHandle = undefined;

function makeSnackbarNotification(text, duration=3000) {
    let x = document.getElementById("snackbar");
    if (x === null){
        x = document.createElement("div");
        x.id = "snackbar";
        document.getElementsByTagName("body")[0].appendChild(x);
    }
    x.innerHTML = text;
    x.className = "show";
    clearTimeout(snackbarTimeoutHandle);
    snackbarTimeoutHandle = setTimeout(function(){
        x.className = x.className.replace("show", "hide");
    }, duration);
}


/*
 * makes div draggable with specified callback
 */
function makeDraggable(element, onDragCallback) {
    element.addEventListener('mousedown', dragStart);
    element.addEventListener('touchstart', dragStart);
    element.style.cursor = 'move';
    let transitionToRestore;

    function dragStart(e) {
        e.preventDefault();
        document.addEventListener('mousemove', dragMove);
        document.addEventListener('touchmove', dragMove, { passive: false });
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);
        transitionToRestore = element.parentElement.style.transition;
        element.parentElement.style.transition = "none";
    }

    function dragMove(e) {
        e.preventDefault();
        onDragCallback(element, e);
    }

    function dragEnd() {
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('touchmove', dragMove);
        document.removeEventListener('mouseup', dragEnd);
        document.removeEventListener('touchend', dragEnd);
        element.parentElement.style.transition = transitionToRestore;
        applyGradient();
    }
}

/*
 * Create div with given class names
 */
function createDivWithClass(...classes){
    let div = document.createElement('div');
    div.classList.add(...classes);
    return div;
}