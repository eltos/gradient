
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

function createDivWithClass(...classes){
    let div = document.createElement('div');
    div.classList.add(...classes);
    return div;
}