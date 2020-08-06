import "./player.scss";
import template from './player.html';

import {MySelect} from '../my-select/my-select';

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
    }

    // fired from fretboard component
    setHighLigth (index) {
        let items = document.querySelectorAll('.player-list-item');
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            item.classList.remove('highligthed');
        }
        if (index !== 'clean') {
            items[index].classList.add('highligthed');
            items[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    configureForm () {
       let options = this.list.map(e => ({ label: e.title, value: e.progressionId }));
       options.unshift({ label: 'Choose the Progression', isHeader: true });
        this.player_choice = new MySelect({
            id: "progress_pl",
            val: options[0].label,
            data: options,
            onSelect: newval => {
                this.selectedProgression = newval;
                let item = this.list.find(e => e.progressionId === this.selectedProgression);
                let list = this.element.querySelector('.player-list');
                list.innerHTML = item.progression.map((e, i) => `<span class="player-list-item">
                <span>${e.time}</span> 
                <span>${e.root}${e.chord} - ${e.octave}-${e.inversion}</span>
                </span>`).join('');
            }
        });
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

    toggle () {
        this.element.style.display = (this.element.style.display === "none" || this.element.style.display === "") ? 'block' : 'none';
        document.querySelector('.player-list').innerHTML = '';
        this.player_choice.value.innerHTML = '';
    }

    play () {
        this.playCallback.call(this.progressions, null, this.selectedProgression);
    }

    stop () {
        this.stopCallback.call(this.progressions, null, this.selectedProgression);
        clearInterval(this.interval);
    }

}
