import "./modal-prog.scss";
import template from './modal-prog.html';

import { /* ChordType, */ Note, Chord } from "@tonaljs/tonal";

import { allIntervals, allOptionsNotes, allChords } from '../../constants';
import { ac } from '../../index';

import { applyInversion } from '../../engine';

import { MySelect } from './../my-select/my-select';

/* 
    // TODO: 
    const optionsRitmo = ['Ritmo1', 'Ritmo2'].map(e => {       
        return { text: e, value: e };
    }); 
*/

const optionsOctaves = [
    { label: 'Choose the octave', isHeader: true },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' }
];

const optionsInversions = [
    { label: 'Choose the inversion', isHeader: true },
    { label: 'no', value: 'no' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' }
];

const optionsChords = allChords; /* ChordType.all().map(e => {
    return { label: e.aliases[0], value: e.aliases[0] };
}).sort((a, b) => a.label + b.label);
 */
let optionsTimeSignatures = Array.from(Array(16), (_, i) => i + 1).map(e => {
    return { label: e + '/4', value: e + '/4' };
});
optionsTimeSignatures.unshift({ label: 'Choose the time signature', isHeader: true })

export default class ModalProgression {

    constructor(placeholderId, callback = () => null, app) {

        this.element = document.getElementById(placeholderId);
        this.element.innerHTML = template; // Load template into placeholder element

        this.callback = callback;
        this.app = app;

        // Find all refs in component
        this.refs = {}
        const refElems = this.element.querySelectorAll('[ref]')
        refElems.forEach((elem) => { this.refs[elem.getAttribute('ref')] = elem })

        this.currentlyInEditing = false;
        this.progression = [];
        this.loop = null;
        this.configureForm();

        // EVENTS
        document.getElementsByClassName("close-mp")[0].addEventListener('click', this.close.bind(this));
        document.getElementsByClassName("save-mp")[0].addEventListener('click', this.save.bind(this));
        document.getElementsByClassName("add-mp")[0].addEventListener('click', this.addToProgressionItem.bind(this));
        document.getElementsByClassName('save-item')[0].addEventListener('click', this.saveProgressionItem.bind(this));
        document.getElementsByClassName('transpose-mp')[0].addEventListener('click', this.transposeAll.bind(this));
        document.getElementsByClassName('play-mp')[0].addEventListener('click', this.play.bind(this));
        document.getElementsByClassName('stop-mp')[0].addEventListener('click', this.stop.bind(this));

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
        this.progressionId = data.progressionId;
        this.refs.title_mp.value = data.title || '';
        this.refs.description_mp.value = data.description || '';
        this.refs.bpm_mp.value = data.bpm || 80;
        this.progression = data.progression || [];
        this.progression.forEach(element => {
            this.renderChord(element);
        });
    }

    configureForm () {
        this.key = new MySelect({
            id: "prog-key",
            val: "C",
            data: allOptionsNotes,
            onSelect: newval => console.log('Key: ', newval)
        });
        this.root = new MySelect({
            id: "prog-root",
            val: "C",
            data: allOptionsNotes,
            onSelect: newval => console.log('Root: ', newval)
        });
        this.chord = new MySelect({
            id: "prog-chord",
            val: "maj7",
            data: optionsChords,
            onSelect: newval => console.log('Chord: ', newval)
        });
        this.time = new MySelect({
            id: "prog-time",
            val: "4/4",
            data: optionsTimeSignatures,
            onSelect: newval => console.log('Time Signature: ', newval)
        });
        this.octave = new MySelect({
            id: "prog-octave",
            val: "3",
            data: optionsOctaves,
            onSelect: newval => console.log('Octave: ', newval)
        });
        this.inversion = new MySelect({
            id: "prog-inversion",
            val: "no",
            data: optionsInversions,
            onSelect: newval => console.log('Inversion: ', newval)
        });
        // console.log(JSON.stringify(optionsChords));
    }

    resetForm () {
        this.refs.title_mp.value = '';
        this.refs.description_mp.value = '';
        this.refs.bpm_mp.value = '';
       /*  this.refs.ritmo_mp.value = ''; */
        this.key.value.innerHTML = '';
        this.root.value.innerHTML = '';
        this.chord.value.innerHTML = '';
        this.time.value.innerHTML = '';
        this.octave.value.innerHTML = '';
        this.inversion.value.innerHTML = '';
        this.progression = [];
        document.querySelector('.item-list').innerHTML = '';
    }

    open (data) {
        this.element.style.display = "block";
        this.fillForm(data);
    }

    close () {
        this.element.style.display = "none";
        this.resetForm();
    }

    save () {
        this.data = {
            progressionId: this.progressionId,
            title: this.refs.title_mp.value,
            bpm: this.refs.bpm_mp.value,
            key: this.key.value.innerHTML,
            description: this.refs.description_mp.value,
            /* ritmo: this.refs.ritmo_mp.value, */
            progression: this.progression,
            creation: new Date()
        }
        this.element.style.display = "none";
        this.resetForm();
        this.callback(this.data)
    }

    addToProgressionItem () {
        if ([
            this.key.value.innerHTML,
            this.root.value.innerHTML,
            this.chord.value.innerHTML,
            this.time.value.innerHTML,
            this.octave.value.innerHTML,
            this.inversion.value.innerHTML,
        ].some(e => (e.includes('Choose') || e === ''))) {
            return
        }
        let newItem = {
            id: Math.floor(Math.random() * 1000000),
            root: this.root.value.innerHTML,
            chord: this.chord.value.innerHTML,
            time: this.time.value.innerHTML,
            octave: this.octave.value.innerHTML,
            inversion: this.inversion.value.innerHTML,
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
        item.refs.chord.textContent = `${input.root}${input.chord}`;
        item.refs.octave.textContent = `${input.octave}`;
        item.refs.inversion.textContent = `${input.inversion}`;

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
        if (!this.currentlyInEditing) {
            let { id } = this.getParent(evt);
            this.progression = this.progression.filter(e => e.id !== Number(id));
            document.querySelectorAll('.progression-item').forEach(e => {
                if (e.dataset.id === id) {
                    e.remove();
                }
            });
        }
    }

    editProgressionItem (evt) {
        if (!this.currentlyInEditing) {
            this.currentlyInEditing = true;
            let { parent, id } = this.getParent(evt);
            parent.classList.toggle('selected-item');
            let progression = this.progression.find(e => e.id === Number(id));
            progression.editMode = true;
            this.time.value.innerHTML = progression.time;
            this.chord.value.innerHTML = progression.chord;
            this.root.value.innerHTML = progression.root;
            this.octave.value.innerHTML = progression.octave;
            this.inversion.value.innerHTML = progression.inversion;
            document.getElementsByClassName('save-item')[0].classList.remove('hide');
            document.getElementsByClassName('add-mp')[0].classList.add('hide');
        }
    }

    saveProgressionItem (evt) {
        let item = this.progression.find(e => e.editMode === true);
        item.time = this.time.value.innerHTML;
        item.chord = this.chord.value.innerHTML;
        item.root = this.root.value.innerHTML;
        item.key = this.key.value.innerHTML;
        item.octave = this.octave.value.innerHTML;
        item.inversion = this.inversion.value.innerHTML;
        item.editMode = false;
        document.querySelectorAll('.progression-item').forEach(e => {
            if (Number(e.dataset.id) === item.id) {
                e.refs.time.textContent = item.time;
                e.refs.chord.textContent = `${item.root} ${item.chord}`;
                e.refs.octave.textContent = `${item.octave}`;
                e.refs.inversion.textContent = `${item.inversion}`;
                e.classList.toggle('selected-item');
                document.getElementsByClassName('save-item')[0].classList.add('hide');
                document.getElementsByClassName('add-mp')[0].classList.remove('hide');
            }
        });
        this.currentlyInEditing = false;
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

    play () {
        let chords = this.progression.map(e => ({ inversion: e.inversion, ...Chord.getChord(e.chord, e.root + e.octave) }));
        chords = applyInversion(chords);
        let times = this.progression.map(e => Number(e.time.charAt(0))); // indicano quanti beat ci stanno in ogni battuta
        let percussionTimes = [...times, ...times, ...times, ...times];
        let totalTime = times.reduce((a, b) => a + b, 0);
        let bpm = 60 / this.refs.bpm_mp.value; // durata del singolo beat in secondi
        let global_time = ac.currentTime + 0.25;
        let percussion_time = ac.currentTime + 0.25;
        let event_time = 0;
        let when = [event_time];
        percussionTimes.forEach((e, i) => {
            this.app.drumSounds.play(37, percussion_time, { duration: percussionTimes[i] * bpm, gain: 0.35/* , decay: 0.05, attack: 0.05  */ });
            percussion_time += percussionTimes[i] / 4 * bpm; // è il tempo tra un accordo ed il successivo...
        })
        chords.forEach((accordo, i) => {
            accordo.notes.forEach((nota, i2) => {
                this.app.ambientSounds.play(nota, global_time, { duration: times[i] * bpm, gain: 0.65/* , decay: 0.05, attack: 0.05  */ }); // accordo
                this.app.drumSounds.play(35, global_time, { duration: times[i] * bpm, gain: 0.35/* , decay: 0.05, attack: 0.05  */ });
            });
            global_time += times[i] * bpm; // è il tempo tra un accordo ed il successivo...
            event_time += times[i] * bpm;
            when.push(event_time * 1000);
        });
        when.splice(-1);
        this.timeout = {}
        when.forEach((t, i) => {
            this.timeout[i.toString()] = setTimeout(() => this.setHighLigth(i), t);
        });
        this.loop = setTimeout(() => this.play(), totalTime * bpm * 1000);
    }

    stop () {
        this.app.ambientSounds.stop();
        this.app.drumSounds.stop();
        clearTimeout(this.loop);
        for (const key in this.timeout) {
            clearTimeout(this.timeout[key]);
        }
        this.timeout = {};
        this.setHighLigth('clean');
    }

    // fired from modal-prog component
    setHighLigth (index) {
        let items = document.querySelector('.item-list');
        for (let i = 0; i < items.children.length; i++) {
            const item = items.children[i];
            item.classList.remove('highligthed');
        }
        if (index !== 'clean') {
            items.children[index].classList.add('highligthed');
            items.children[index].scrollIntoView();
        }
    }
}


/*

35 B0 Acoustic Bass Drum    59 B2 Ride Cymbal 2
36 C1 Bass Drum 1           60 C3 Hi Bongo
37 C#1 Side Stick           61 C#3 Low Bongo
38 D1 Acoustic Snare        62 D3 Mute Hi Conga
39 Eb1 Hand Clap            63 Eb3 Open Hi Conga
40 E1 Electric Snare        64 E3 Low Conga
41 F1 Low Floor Tom         65 F3 High Timbale
42 F#1 Closed Hi Hat        66 F#3 Low Timbale
43 G1 High Floor Tom        67 G3 High Agogo
44 Ab1 Pedal Hi-Hat         68 Ab3 Low Agogo
45 A1 Low Tom 69            A3 Cabasa
46 Bb1 Open Hi-Hat          70 Bb3 Maracas
47 B1 Low-Mid Tom           71 B3 Short Whistle
48 C2 Hi Mid Tom            72 C4 Long Whistle
49 C#2 Crash Cymbal 1       73 C#4 Short Guiro
50 D2 High Tom              74 D4 Long Guiro
51 Eb2 Ride Cymbal 1        75 Eb4 Claves
52 E2 Chinese Cymbal        76 E4 Hi Wood Block
53 F2 Ride Bell             77 F4 Low Wood Block
54 F#2 Tambourine           78 F#4 Mute Cuica
55 G2 Splash Cymbal         79 G4 Open Cuica
56 Ab2 Cowbell              80 Ab4 Mute Triangle
57 A2 Crash Cymbal 2        81 A4 Open Triangle
58 Bb2 Vibraslap

*/