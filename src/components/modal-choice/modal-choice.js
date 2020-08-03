import "./modal-choice.scss";
import template from './modal-choice.html';

import { allScales, allOptionsNotes, allOptionsTunings } from '../../constants';

import { MySelect } from '../my-select/my-select';

const optionsScales = allScales;
const optionsNotes = allOptionsNotes;
const optionsTuning = allOptionsTunings; 

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

    setRadioValue (name, value) {
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

    resetRadio (name) {
        let radioElements = document.getElementsByName(name);
        for (let i = 0; i < radioElements.length; i++) {
            radioElements[i].checked = false;
        }
    }

    fillForm (data) {
        this.fingering = data.fingering;
        this.parentId = data.parentId;
        this.merge = data.merge;    // se è un merge
        this.startScale = data.startScale;      // la scala iniziale da mergiare
        this.id = data.id;
        this.refs.title.innerHTML = data.title;
        this.refs.action.innerHTML = data.action;
        this.root.value.innerHTML = data.root;
        this.tuning.value.innerHTML = data.tuning;
        this.scale.value.innerHTML = data.scale;
        this.setRadioValue('whatToShow-choice', data.whatToShow);
    }

    configureForm () {
        this.tuning = new MySelect({
            id: "opt-tuning",
            val: "",
            data: optionsTuning,
            onSelect: newval => console.log('Tuning: ', newval)
        });
        this.root = new MySelect({
            id: "opt-root",
            val: "",
            data: optionsNotes,
            onSelect: newval => console.log('Root: ', newval)
        });
        this.scale = new MySelect({
            id: "opt-scale",
            val: "",
            data: optionsScales,
            onSelect: newval => console.log('Scale: ', newval)
        });
    }

    resetForm () {
        this.fingering = '';
        this.parentId = '';
        this.merge = '';    // se è un merge
        this.startScale = '';      // la scala iniziale da mergiare
        this.id = '';
        this.tuning.value.innerHTML = '';
        this.root.value.innerHTML = '';
        this.scale.value.innerHTML = '';
        this.merge = '';
        this.resetRadio('whatToShow-choice')
    }

    open (data) {
        this.element.style.display = "block";
        this.fillForm(data);
    }

    close () {
        this.element.style.display = "none";
    }

    save () {
        if ([
            this.tuning.value.innerHTML,
            this.root.value.innerHTML,
            this.scale.value.innerHTML
        ].some(e => (e.includes('Choose') || e === ''))) {
            return
        }
        this.data = {
            id: this.id,
            parentId: this.parentId,
            whatToShow: this.getRadioValue('whatToShow-choice'),   // can be notes | degrees
            tuning: this.tuning.value.innerHTML,
            root: this.root.value.innerHTML,
            scale: this.scale.value.innerHTML,
            value: `${this.root.value.innerHTML} ${this.scale.value.innerHTML}`,
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
