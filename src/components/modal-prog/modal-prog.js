import "./modal-prog.scss";
import template from './modal-prog.html';

import { ChordType, Note } from "@tonaljs/tonal";

import { allIntervals } from '../../constants';

const optionsRitmo = ['Ritmo1', 'Ritmo2'].map(e => {        // TODO: 
    return { text: e, value: e };
});

const optionsNotes = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'].map(e => {
    return { text: e, value: e };
});

const optionsChords = ChordType.all().map(e => {
    return { text: e.aliases[0], value: e.aliases[0] };
}).sort((a, b) => a.text + b.text);

const optionsTimeSignatures = Array.from(Array(16), (_, i) => i + 1).map(e => {
    return { text: e + '/4', value: e + '/4' };
});

export default class ModalProgression {

    constructor(placeholderId, callback = () => null) {

        this.element = document.getElementById(placeholderId);
        this.element.innerHTML = template; // Load template into placeholder element

        this.callback = callback;

        // Find all refs in component
        this.refs = {}
        const refElems = this.element.querySelectorAll('[ref]')
        refElems.forEach((elem) => { this.refs[elem.getAttribute('ref')] = elem })

        this.progression = [];
        this.setDefaults();

        this.configureForm();

        // EVENTS
        document.getElementsByClassName("close-mp")[0].addEventListener('click', this.close.bind(this));
        document.getElementsByClassName("save-mp")[0].addEventListener('click', this.save.bind(this));
        document.getElementsByClassName("add-mp")[0].addEventListener('click', this.addToProgressionItem.bind(this));
        document.getElementsByClassName('save-item')[0].addEventListener('click', this.saveProgressionItem.bind(this));
        document.getElementsByClassName('transpose-mp')[0].addEventListener('click', this.transposeAll.bind(this));

        document.getElementById('root_mp').addEventListener('change', (evt) => this.selectedNote = evt.target.value);
        document.getElementById('chord_mp').addEventListener('change', (evt) => this.selectedChord = evt.target.value);
        document.getElementById('timeSignature_mp').addEventListener('change', (evt) => this.selectedTimeSignature = evt.target.value);

        // When the user clicks anywhere outside of the modal, close it
        /* window.onclick = (event) => {
            if (event.target == this.element) {
                this.element.style.display = "none";
            }
        } */

        // SLIDER RANGE
        this.slider = this.element.querySelector(".slidecontainer .slider");
        this.bubble = this.element.querySelector(".slidecontainer .bubble");
        this.slider.addEventListener("input", () => {
            this.setBubble();
        });
        this.setBubble();
    }

    setDefaults () {
        this.selectedInterval = '1P';
        this.selectedChord = 'maj7';
        this.selectedNote = 'C';
        this.selectedTimeSignature = '4/4';
    }

    // Input range for transpose
    setBubble () {
        const val = this.slider.value;
        const min = this.slider.min ? this.slider.min : 0;
        const max = this.slider.max ? this.slider.max : 100;
        const newVal = Number(((val - min) * 100) / (max - min));
        let selectedInterval = allIntervals[val];
        this.bubble.innerHTML = selectedInterval;

        // Sorta magic numbers based on size of the native UI thumb
        this.bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;

        if (selectedInterval !== '1P') {
            this.selectedInterval = selectedInterval;
        }
    }

    fillForm (data = {}) {
        this.studyId = data.studyId;
        this.progressionId = data.progressionId;
        this.refs.title_mp.value = data.title || '';
        this.refs.description_mp.value = data.description || '';
        this.refs.bpm_mp.value = data.bpm || 80;
        this.refs.ritmo_mp.value = data.ritmos || 'Ritmo1';
        this.refs.timeSignature_mp.value = this.selectedTimeSignature;
        this.refs.chord_mp.value = this.selectedChord;
        this.refs.root_mp.value = this.selectedNote;
        this.progression = data.progression || [];
        this.progression.forEach(element => {
            this.renderChord(element);
        });
    }

    configureForm () {
        this.fillOptions('ritmos_mp', optionsRitmo);
        this.fillOptions('root_mp', optionsNotes);
        this.fillOptions('chord_mp', optionsChords);
        this.fillOptions('timeSignature_mp', optionsTimeSignatures);
    }

    fillOptions (id, options) {
        var select = document.getElementById(id);
        for (var i = 0; i < options.length; i++) {
            var opt = options[i];
            var el = document.createElement("option");
            el.textContent = opt.text;
            el.value = opt.value;
            select.appendChild(el);
        }
    }

    resetForm () {
        this.refs.title_mp.value = '';
        this.refs.description_mp.value = '';
        this.refs.bpm_mp.value = '';
        this.refs.ritmo_mp.value = '';
        this.refs.timeSignature_mp.value = '';
        this.refs.chord_mp.value = '';
        this.refs.root_mp.value = '';
        this.progression = [];
        document.querySelector('.item-list').innerHTML = '';
    }

    open (data) {
        this.element.style.display = "block";
        this.fillForm(data);
    }

    close () {
        this.element.style.display = "none";
    }

    save () {
        if ([this.refs.root_mp.value, this.refs.chord_mp.value, this.refs.timeSignature_mp.value].some(e => e.includes('Choose'))) {
            return
        }
        this.data = {
            studyId: this.studyId,
            progressionId: this.progressionId,
            title: this.refs.title_mp.value,
            bpm: this.refs.bpm_mp.value,
            description: this.refs.description_mp.value,
            ritmo: this.refs.ritmo_mp.value,
            progression: this.progression,
            creation: new Date()
        }
        this.element.style.display = "none";
        this.resetForm();
        this.callback(this.data)
    }

    addToProgressionItem () {
        let newItem = {
            id: Math.floor(Math.random() * 1000000),
            root: this.selectedNote,
            chord: this.selectedChord,
            time: this.selectedTimeSignature,
            editMode: false
        };
        this.progression.push(newItem);
        this.renderChord(newItem);
    }

    renderChord (input) {
        var temp = document.getElementById("item"); // get template
        var clone = temp.content.cloneNode(true);
        clone.firstElementChild.dataset.id = input.id;

        let list = document.querySelector('.item-list')
        list.appendChild(clone);
        let item = list.querySelector(`[data-id='${input.id}']`);

        // Find all refs in component
        item.refs = {}
        const refElems = document.body.querySelectorAll('[ref]')
        refElems.forEach((elem) => { item.refs[elem.getAttribute('ref')] = elem })

        item.refs.time.textContent = input.time;
        item.refs.chord.textContent = `${input.root} ${input.chord}`;

        // EVENTS
        item.querySelector('.item-delete-btn').addEventListener('click', (evt) => this.removeProgressionItem.call(this, evt));
        item.querySelector('.item-edit-btn').addEventListener('click', (evt) => this.editProgressionItem.call(this, evt));

        item.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    getParent (evt) {
        let parent = evt.target.closest("[data-id]");
        return { parent, id: parent.dataset.id };
    }

    removeProgressionItem (evt) {
        let { id } = this.getParent(evt);
        this.progression = this.progression.filter(e => e.id !== Number(id));
        document.querySelectorAll('.progression-item').forEach(e => {
            if (e.dataset.id === id) {
                e.remove();
            }
        });
    }

    editProgressionItem (evt) {
        let { parent, id } = this.getParent(evt);
        parent.classList.toggle('selected-item');
        let progression = this.progression.find(e => e.id === Number(id));
        progression.editMode = true;
        this.refs.timeSignature_mp.value = progression.time;
        this.refs.chord_mp.value = progression.chord;
        this.refs.root_mp.value = progression.root;
        document.getElementsByClassName('save-item')[0].classList.remove('hide');
        document.getElementsByClassName('add-mp')[0].classList.add('hide');
    }

    saveProgressionItem (evt) {
        let progression = this.progression.find(e => e.editMode === true);
        progression.time = this.refs.timeSignature_mp.value;
        progression.chord = this.refs.chord_mp.value;
        progression.root = this.refs.root_mp.value;
        progression.editMode = false;
        document.querySelectorAll('.progression-item').forEach(e => {
            if (Number(e.dataset.id) === progression.id) {
                e.refs.time.textContent = progression.time;
                e.refs.chord.textContent = `${progression.root} ${progression.chord}`;
                e.classList.toggle('selected-item');
                document.getElementsByClassName('save-item')[0].classList.add('hide');
                document.getElementsByClassName('add-mp')[0].classList.remove('hide');
            }
        });
    }

    transposeAll (evt) {
        this.progression.forEach(element => {
            element.root = Note.transpose(element.root, this.selectedInterval);
        });
        document.querySelectorAll('.progression-item').forEach((e, i) => {
            e.refs.chord.textContent = `${this.progression[i].root} ${this.progression[i].chord}`;
        });
        // resetting range
        this.slider.value = '0';
        this.setBubble();
    }
}
