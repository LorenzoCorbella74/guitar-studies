import "./progressions.scss";
import template from './progressions.html';

import { Progression, Chord } from "@tonaljs/tonal";

import { ac } from '../../index';

import ModalProgression from '../modal-prog/modal-prog';

export default class Progressions {

    constructor(app, studyId, list) {
        this.element = document.querySelector('.progression-content');
        this.element.innerHTML = `${template}`;
        this.app = app;
        this.list = list || [];
        this.studyId = studyId;

        // EVENTS: si passa la save e il play/stop
        this.modal_prog = new ModalProgression('modal-prog',
            this.save.bind(this),
            this.app
        );
    }

    generateItems (list) {
        this.list = list;
        document.querySelector('.progression-list').innerHTML = '';
        this.list.forEach((el, i) => {
            this.renderProgression(el, i);
        });
    }

    getParent (evt) {
        let parent = evt.target.closest("[data-id]");
        return { parent, id: Number(parent.dataset.id) };
    }

    renderDate (date) {
        let year = date.getFullYear();
        let month = (1 + date.getMonth()).toString();
        month = month.length > 1 ? month : '0' + month;
        let day = date.getDate().toString();
        day = day.length > 1 ? day : '0' + day;
        return `${month}/${day}/${year}`;
    }

    checkDate (date) {
        if (Object.prototype.toString.call(date) === '[object Date]') {
            return date
        } else {
            return new Date(date);
        }
    }

    renderProgression (input) {
        var temp = document.getElementsByTagName("template")[0];
        var clone = temp.content.cloneNode(true);
        input.progressionId = input.progressionId || 'progression' + Math.floor(Math.random() * 1000000);    // si valorizza l'id
        clone.firstElementChild.dataset.id = input.progressionId;

        document.querySelector('.progression-list').appendChild(clone);

        let progression = document.querySelector(`[data-id='${input.progressionId}']`);

        // Find all refs in component
        progression.refs = {}
        const refElems = document.body.querySelectorAll('[ref]')
        refElems.forEach((elem) => { progression.refs[elem.getAttribute('ref')] = elem })

        progression.refs.titleP.textContent = input.title;
        progression.refs.dateP.textContent = this.renderDate(this.checkDate(input.creation));

        let numeralsContainer = progression.querySelector('.progression-numerals');

        // EVENTS
        progression.querySelector('.progression-info').addEventListener('click', (evt) => this.openProgression.call(this, evt, input.progressionId));
        progression.querySelector('.progression-delete-btn').addEventListener('click', (evt) => this.removeProgression.call(this, evt, input.progressionId));
        progression.querySelector('.progression-play-btn').addEventListener('click', (evt) => this.playProgression.call(this, evt, input.progressionId));
        progression.querySelector('.progression-stop-btn').addEventListener('click', (evt) => this.stopProgression.call(this, evt, input.progressionId));

        progression.scrollIntoView({ behavior: 'smooth', block: 'end' });
        input.progression.forEach(element => {
            let span = document.createElement('span');
            span.classList.add('numeral');
            span.textContent = element.chord; // Progression.toRomanNumerals("C", ["CMaj7", "Dm7", "G7"]);
            numeralsContainer.appendChild(span);
        });
    }

    updateProgression (input) {
        let progression = document.querySelector(`[data-id='${input.progressionId}']`)
        progression.refs.titleP.textContent = input.title;
        progression.refs.dateP.textContent = this.renderDate(this.checkDate(input.creation));
        // TODO: 
    }

    removeAllProgression () {
        this.app.confirmModal.style.display = "block";
        this.app.setCallback(this.doRemoveAllProgressions.bind(this));
    }

    doRemoveAllProgressions () {
        this.list.length = 0;
        document.querySelector('.progression-list').innerHTML = '';
        this.app.confirmModal.style.display = "none";
    }
    removeProgression (evt, progressionId) {
        this.app.confirmModal.style.display = "block";
        this.app.setCallback(this.doRemoveProgression.bind(this, evt, progressionId));
    }

    doRemoveProgression (evt, progressionId) {
        let index = this.list.findIndex(e => e.progressionId === progressionId);
        this.list.splice(index, 1);
        document.querySelector(`[data-id='${progressionId}']`).remove();
        this.app.confirmModal.style.display = "none";
    }

    openProgression (evt, progressionId) {
        let index = this.list.findIndex(e => e.progressionId === progressionId);
        this.modal_prog.open(this.list[index]);
    }

    // coming back from modal-prog
    save (data) {
        if (data.progressionId) {
            let toBeUpdate = this.list.findIndex(e => e.progressionId === data.progressionId);
            this.list[toBeUpdate] = Object.assign(this.list[toBeUpdate], data);
            this.updateProgression(data);
        } else {
            this.list.push(data);
            this.renderProgression(data);
        }
    }

    addProgression () {
        let toBeAdded = {
            studyId: this.studyId,
        }
        this.modal_prog.open(toBeAdded);
    }

    playProgression (evt, progressionId) {
        // TODO:
        let item = this.list.find(e => e.progressionId === progressionId);
        // console.log('Play progression: ', item);
        let chords = item.progression.map(e => Chord.getChord(e.chord, e.root + e.octave));
        let times = item.progression.map(e => Number(e.time.charAt(0))); // indicano quanti beat ci stanno in ogni battuta
        let totalTime = times.reduce((a, b) => a + b, 0);
        let bpm = 60 / item.bpm; // durata del singolo beat in secondi
        let global_time = ac.currentTime + 0.25;
        chords.forEach((accordo, i) => {
            accordo.notes.forEach((nota, i2) => {
                this.app.ambientSounds.play(nota, global_time, { duration: times[i] * bpm, gain: 0.75/* , decay: 0.05, attack: 0.05  */ }); // accordo
            });
            global_time += times[i] * bpm; // è il tempo tra un accordo ed il successivo...
        });
        this.loop = setTimeout(() => this.play(), totalTime * bpm * 1000);
    }

    stopProgression (evt, progressionId) {
        let item = this.list.find(e => e.progressionId === progressionId);
        console.log('Stop progression: ', item);
        this.app.ambientSounds.stop();
        clearTimeout(this.loop);
    }
}


/*


https://github.com/tonaljs/tonal/tree/master/packages/progression

Progression.toRomanNumerals("C", ["CMaj7", "Dm7", "G7"]);
// => "IMaj7", "IIm7", "V7"]

*/