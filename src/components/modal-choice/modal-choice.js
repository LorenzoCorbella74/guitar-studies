import "./modal-choice.scss";
import template from './modal-choice.html';

import { Scale } from "@tonaljs/tonal";

import {allScales} from '../../constants';


const optionsScaleUsArp = [
    { text: 'Scale', value: 'scala' },
    { text: 'Arpeggio', value: 'arpeggio' }
];

const optionsNoteUsDegree = [
    { text: 'Note', value: 'nota' },
    { text: 'Degree', value: 'grado' }
];

// TODO: 
const optionsScales = /* Scale.names() */allScales.map(e => {
    return { text: e, value: e };
});

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

        // Load template into placeholder element
        this.element.innerHTML = template;

        // Find all refs in component
        this.refs = {}
        const refElems = this.element.querySelectorAll('[ref]')
        refElems.forEach((elem) => { this.refs[elem.getAttribute('ref')] = elem })

        this.configureForm();

        document.getElementsByClassName("close")[0].addEventListener('click', this.close.bind(this));
        document.getElementsByClassName("save")[0].addEventListener('click', this.save.bind(this));

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = (event) => {
            if (event.target == this.element) {
                this.element.style.display = "none";
            }
        }
    }

    setRadioValue(name, value) {
        let radioElements = document.getElementsByName(name);
        for (let i = 0; i < radioElements.length; i++) {
            if (radioElements[i].name === name && radioElements[i].value === value) {
                radioElements[i].checked = true;
            } else {
                radioElements[i].checked = false;
            }
        }
    }

    getRadioValue(name) {
        let radioElements = document.getElementsByName(name);
        for (let i = 0; i < radioElements.length; i++) {
            if (radioElements[i].name === name && radioElements[i].checked) {
                return radioElements[i].value;
            }
        }
    }

    resetRadio(name) {
        let radioElements = document.getElementsByName(name);
        for (let i = 0; i < radioElements.length; i++) {
            radioElements[i].checked = false;
        }
    }

    fillForm(data) {
        this.fingering = data.fingering;
        this.parentId = data.parentId;
        this.mergeAction = data.mergeAction;    // se è un merge
        this.startScale = data.startScale;      // la scala iniziale da mergiare
        this.id = data.id;
        this.refs.title.innerHTML = data.title;
        this.refs.action.innerHTML = data.action;
        this.refs.tuning.value = data.tuning;
        this.refs.scale.value = data.scale;
        this.refs.root.value = data.root;
        // this.refs.arpeggio.value = data.arpeggio;
        // this.setRadioValue('type', data.type);
        this.setRadioValue('whatToShow', data.whatToShow);
    }

    configureForm() {
        this.fillOptions('scale', optionsScales);
        this.fillOptions('tuning', optionsTuning);
        this.fillOptions('root', optionsNotes);
        // this.fillOptions('arpeggio', optionsArp);
    }

    fillOptions(id, options) {
        var select = document.getElementById(id);
        for (var i = 0; i < options.length; i++) {
            var opt = options[i];
            var el = document.createElement("option");
            el.textContent = opt.text;
            el.value = opt.value;
            select.appendChild(el);
        }
    }

    resetForm() {
        // this.refs.tuning.value = '';
        this.refs.scale.value = '';
        this.refs.root.value = '';
        /* this.refs.arpeggio.value = '';
        this.resetRadio('type') */
        this.resetRadio('whatToShow')
    }

    open(data) {
        this.element.style.display = "block";
        this.fillForm(data);
    }

    close() {
        this.element.style.display = "none";
    }

    save() {
        this.data = {
            id: this.id,
            parentId: this.parentId,
            type: this.getRadioValue('type'),               // can be scale | arpeggio
            whatToShow: this.getRadioValue('whatToShow'),   // can be notes | degrees
            tuning: this.refs.tuning.value,
            root: this.refs.root.value,
            scale: this.refs.scale.value,
            //arpeggio: this.refs.arpeggio.value,
            value: `${this.refs.root.value} ${this.refs.scale.value}`,
            // if it's a merge action
            mergeAction: this.mergeAction,
            startScale: this.startScale,
            fingering: this.fingering
        }
        this.element.style.display = "none";
        this.resetForm();
        this.callback(this.data)
    }
}
