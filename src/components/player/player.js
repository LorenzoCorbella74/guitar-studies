import "./player.scss";
import template from './player.html';

export default class Player {

    constructor(placeholderId, progressions, playCallback = () => null, stopCallback = () => null) {

        this.element = document.getElementById(placeholderId);
        this.playCallback = playCallback;
        this.stopCallback = stopCallback;
        this.progressions = progressions;
        this.list = progressions.list;

        // Load template into placeholder element
        this.element.innerHTML = template;

        this.selectedProgression = null;
        this.selectedChord = null;  // TODO:
        this.configureForm();

        // EVENTS
        document.getElementsByClassName("player-play-btn")[0].addEventListener('click', this.play.bind(this));
        document.getElementsByClassName("player-stop-btn")[0].addEventListener('click', this.stop.bind(this));

        // Change
        document.getElementById('progress_pl').addEventListener('change', (evt) => {
            this.selectedProgression = evt.target.value;
            let item = this.list.find(e => e.progressionId === this.selectedProgression);
            let list = this.element.querySelector('.player-list');
            list.innerHTML = item.progression.map((e, i) => `<span class="player-list-item"><span>${e.time}</span> <span>${e.root}${e.chord}</span></span>`).join('');
        });

        this.pos1 = 0;
        this.pos2 = 0;
        this.pos3 = 0;
        this.pos4 = 0;
        this.header = this.element.querySelector('.player-header');
        if (this.header) {
            /* if present, the header is where you move the DIV from:*/
            this.header.onmousedown = this.dragMouseDown.bind(this);
        } else {
            /* otherwise, move the DIV from anywhere inside the DIV:*/
            this.element.onmousedown = this.dragMouseDown.bind(this);
        }

        // TODO: eventi per evidenziare l'accordo al momento suonato
        this.element.addEventListener('chord',  (e) => { 
            console.log('Custom event', e.detail)
         }, false);
    }

    configureForm () {
        this.fillOptions('progress_pl', this.list.map(e => ({ text: e.title, value: e.progressionId })));
    }

    fillOptions (id, options) {
        var select = document.getElementById(id);
        for (let i = select.length - 1; i >= 1; i--) {
            select.remove(i);
        }
        for (var i = 0; i < options.length; i++) {
            var opt = options[i];
            var el = document.createElement("option");
            el.textContent = opt.text;
            el.value = opt.value;
            select.appendChild(el);
        }
    }

    dragMouseDown (e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        this.pos3 = e.clientX;
        this.pos4 = e.clientY;
        document.onmouseup = this.closeDragElement.bind(this);
        // call a function whenever the cursor moves:
        document.onmousemove = this.elementDrag.bind(this);
    }

    elementDrag (e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        this.pos1 = this.pos3 - e.clientX;
        this.pos2 = this.pos4 - e.clientY;
        this.pos3 = e.clientX;
        this.pos4 = e.clientY;
        // set the element's new position:
        this.element.style.top = (this.element.offsetTop - this.pos2) + "px";
        this.element.style.left = (this.element.offsetLeft - this.pos1) + "px";
    }

    /* stop moving when mouse button is released:*/
    closeDragElement () {
        document.onmouseup = null;
        document.onmousemove = null;
    }

    /*     fillForm(data) {
            this.id = data.id;
            this.refs.note.value = data.note;        
        } */

    toggle () {
        this.element.style.display = this.element.style.display === "none" ? 'block' : 'none';
    }

    play () {
        this.playCallback.call(this.progressions, null, this.selectedProgression);
    }

    stop () {
        this.stopCallback.call(this.progressions, null, this.selectedProgression);
    }

}
