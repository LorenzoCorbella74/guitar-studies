import "./settings.scss";
import template from './settings.html';

export default class Settings {

    constructor(placeholderId, callback = () => null) {

        this.element = document.getElementById(placeholderId);
        this.callback = callback;

        if (template) {
            // Load template into placeholder element
            this.element.innerHTML = template;

            // Find all refs in component
            this.refs = {}
            const refElems = this.element.querySelectorAll('[ref]')
            refElems.forEach((elem) => { this.refs[elem.getAttribute('ref')] = elem })

            document.getElementsByClassName("close")[0].addEventListener('click', this.close.bind(this));
            document.getElementsByClassName("save")[0].addEventListener('click', this.save.bind(this));

            // When the user clicks anywhere outside of the modal, close it
            window.onclick = (event) => {
                if (event.target == this.element) {
                    this.element.firstChild.style.display = "none";
                }
            }

            // RANGE SLIDERS
            const allRanges = document.querySelectorAll(".range-container");
            allRanges.forEach(wrap => {
                const range = wrap.querySelector(".slider");
                const bubble = wrap.querySelector(".bubble");

                range.addEventListener("input", () => {
                    this.setBubble(range, bubble);
                });
                this.setBubble(range, bubble);
            });
        }
    }

    setBubble (range, bubble) {
        const val = range.value;
        const min = range.min ? range.min : 0;
        const max = range.max ? range.max : 100;
        const newVal = Number(((val - min) * 100) / (max - min));
        bubble.innerHTML = val;

        // Sorta magic numbers based on size of the native UI thumb
        bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
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

    fillForm (data) {
        this.id = data.id;
        this.parentId = data.parentId;
        this.refs.size.value = data.size;
        this.refs.opacity.value = data.opacity;
        this.setRadioValue('whatToShow', data.whatToShow);
        this.setRadioValue('color', data.color);
        // aggiorna i bubble
        const allRanges = document.querySelectorAll(".range-container");
        allRanges.forEach(wrap => {
            const range = wrap.querySelector(".slider");
            const bubble = wrap.querySelector(".bubble");
            this.setBubble(range, bubble);
        });
        this.configureForm(data);
    }

    configureForm (data) {
        let others = this.guitar.layers.filter(e => e.id !== this.id);
        this.fillOptions('differences', others);
        this.refs.differences.value = data.differences;
    }

    fillOptions (id, options) {
        var select = document.getElementById(id);
        // remove all but first
        var length = select.options.length;
        for (i = length - 1; i >= 1; i--) {
            select.options[i] = null;
        }
        // 
        for (var i = 0; i < options.length; i++) {
            var opt = options[i];
            var el = document.createElement("option");
            el.textContent = opt.value;
            el.value = opt.value;
            select.appendChild(el);
        }
    }

    open (data, guitar) {
        this.guitar = guitar;
        this.element.firstChild.style.display = "block";
        this.fillForm(data);
    }

    close () {
        this.element.firstChild.style.display = "none";
    }

    save () {
        this.data = {
            id: this.id,
            parentId: this.parentId,
            size: this.refs.size.value,
            opacity: this.refs.opacity.value,
            differences: this.refs.differences.value,
            whatToShow: this.getRadioValue('whatToShow'),   // can be notes | degrees | none
            color: this.getRadioValue('color')              // can be one | triads | many
        }
        this.close();
        // this.resetForm();
        this.callback(this.data);
    }

}