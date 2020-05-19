import "./modal-choice.scss";
import template from './modal-choice.html';

import { Scale } from "@tonaljs/tonal";

const optionsScaleUsArp = [
    { text: 'Scale', value: 'scala' },
    { text: 'Arpeggio', value: 'arpeggio' }
];

const optionsNoteUsDegree = [
    { text: 'Note', value: 'nota' },
    { text: 'Degree', value: 'grado' }
];

const optionsScales = Scale.names().map(e => {
    return { text: e, value: e };
});

const optionsArp = [
    { text: 'Maj', value: 'maj 1P 3M 5P' },
    { text: '7', value: '7 1P 3M 5P 7m' },
    { text: 'min', value: 'min 1P 3m 5P' },
    { text: 'min7', value: 'min7 1P 3m 5P 7m' },
    { text: 'min7/b5', value: 'min7/b5 1P 3m 5d 7m' },
    { text: 'dim', value: 'dim 1P 3m 5d' },
    { text: 'dim7', value: 'dim7 1P 3m 5d 7d' },
    { text: 'aug', value: 'aug 1P 3M 5A' }
];

const optionsNotes = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'].map(e => {
    return { text: e, value: e };
});
const optionsTuning = [
    { text: 'E 4Ths', value: 'E_4Ths' },
    { text: 'E standard', value: 'E_std' },
    { text: 'Drop D', value: 'Drop_D' },
    { text: 'G open', value: 'G_open' }
];

export default class ModalChoice {

    constructor(placeholderId, callback = () => null) {

        this.element = document.getElementById(placeholderId);
        this.callback = callback;
        this.data = {
            type: 'scale',    // can be scale | arpeggio
            whatToShow: 'notes', // can be notes | degrees
            tuning: 'E_std',
            root: 'A',
            scale: 'dorian',
            arpeggio: 'min7',
            action: 'Titolo'    // can be 
        };

        if (template) {
            // Load template into placeholder element
            this.element.innerHTML = template;

            // Find all refs in component
            this.refs = {}
            const refElems = this.element.querySelectorAll('[ref]')
            refElems.forEach((elem) => { this.refs[elem.getAttribute('ref')] = elem })

            this.configureForm();
            // this.fillForm();

            document.getElementsByClassName("close")[0].addEventListener('click', this.close.bind(this));
            document.getElementsByClassName("save")[0].addEventListener('click', this.save.bind(this));

            // When the user clicks anywhere outside of the modal, close it
            window.onclick = (event) => {
                if (event.target == this.element) {
                    this.element.style.display = "none";
                }
            }
        }
    }

    setRadioValue(name){
        let radioElements = document.getElementsByName(name);
        for (let i = 0; i < radioElements.length; i++) {
            // TODO
        }
    }

    getRadioValue (name) {
        let radioElements = document.getElementsByName(name);
        for (let i = 0; i < radioElements.length; i++) {
            if (radioElements[i].checked) {
                return radioElements[i].value
            }
        }
    }

    resetRadio (name) {
        let radioElements = document.getElementsByName(name);
        for (let i = 0; i < radioElements.length; i++) {
            radioElements[i].checked = false;
        }
    }

    fillForm () {
        this.refs.tuning.value = this.data.tuning;
        this.refs.scale.value = this.data.scale;
        this.refs.root.value = this.data.root;
        this.refs.arpeggio.value = this.data.arpeggio;
        this.setRadioValue('type');
        this.setRadioValue('whatToShow');
    }

    configureForm () {
        this.refs.title.innerHTML = this.data.action;
        this.fillOptions('scale', optionsScales);
        this.fillOptions('tuning', optionsTuning);
        this.fillOptions('root', optionsNotes);
        this.fillOptions('arpeggio', optionsArp);
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

    resetForm(){
        this.refs.tuning.value = '';
        this.refs.scale.value = '';
        this.refs.root.value = '';
        this.refs.arpeggio.value = '';
        this.resetRadio('type')
        this.resetRadio('whatToShow')
    }

    open () {
        this.element.style.display = "block";
    }

    close () {
        this.element.style.display = "none";
    }

    save () {
        this.data = {
            type: this.getRadioValue('type'),               // can be scale | arpeggio
            whatToShow: this.getRadioValue('whatToShow'),   // can be notes | degrees
            tuning: this.refs.tuning.value,
            root: this.refs.root.value,
            scale: this.refs.scale.value,
            arpeggio: this.refs.arpeggio.value
        }
        this.element.style.display = "none";
        this.resetForm();
        this.callback(this.data)
    }
}
