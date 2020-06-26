import "./modal-choice.scss";
import template from './modal-choice.html';

import {allScales} from '../../constants';


const optionsScales = /* Scale.names() */allScales.map(e => {   // TODO: scelta scale...
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

    getRadioValue (name) {
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
        this.merge = data.merge;    // se è un merge
        this.startScale = data.startScale;      // la scala iniziale da mergiare
        this.id = data.id;
        this.refs.title.innerHTML = data.title;
        this.refs.action.innerHTML = data.action;
        this.refs.tuning.value = data.tuning;
        this.refs.scale.value = data.scale;
        this.refs.root.value = data.root;
        this.setRadioValue('whatToShow-choice', data.whatToShow);
    }

    configureForm() {
        this.fillOptions('scale', optionsScales);
        this.fillOptions('tuning', optionsTuning);
        this.fillOptions('root', optionsNotes);
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
        this.fingering = '';
        this.parentId = '';
        this.merge = '';    // se è un merge
        this.startScale = '';      // la scala iniziale da mergiare
        this.id = '';
        // this.refs.tuning.value = '';
        this.refs.scale.value = '';
        this.refs.root.value = '';
        this.merge= '';
        this.resetRadio('whatToShow-choice')
    }

    open(data) {
        this.element.style.display = "block";
        this.fillForm(data);
    }

    close() {
        this.element.style.display = "none";
    }

    save() {
        if([this.refs.tuning.value,this.refs.root.value, this.refs.scale.value].some(e=>e.includes('Choose'))){
            return 
        }
        this.data = {
            id: this.id,
            parentId: this.parentId,
            whatToShow: this.getRadioValue('whatToShow-choice'),   // can be notes | degrees
            tuning: this.refs.tuning.value,
            root: this.refs.root.value,
            scale: this.refs.scale.value,
            value: `${this.refs.root.value} ${this.refs.scale.value}`,
            // if it's a merge action
            merge: this.merge,
            startScale: this.startScale,
            fingering: this.fingering
        }
        this.element.style.display = "none";
        this.resetForm();
        this.callback(this.data)
    }
}
