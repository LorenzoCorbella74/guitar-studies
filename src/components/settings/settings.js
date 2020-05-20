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

            this.configureForm();

            document.getElementsByClassName("close")[0].addEventListener('click', this.close.bind(this));
            document.getElementsByClassName("save")[0].addEventListener('click', this.save.bind(this));

            // When the user clicks anywhere outside of the modal, close it
            window.onclick = (event) => {
                if (event.target == this.element) {
                    this.element.firstChild.style.display = "none";
                }
            }
        }
    }

    setRadioValue (name) {
        let radioElements = document.getElementsByName(name);
        for (let i = 0; i < radioElements.length; i++) {
            if (radioElements[i].value === name) {
                radioElements[i].checked = true;
            } else {
                radioElements[i].checked = false;
            }
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

    fillForm (data) {
        this.id = data.id;
        this.refs.size.value = data.size;
        this.refs.opacity.value = data.opacity;
        this.refs.comparison.value = data.comparison;
        this.setRadioValue('whatToShow', data.whatToShow);
    }

    configureForm () {
        this.fillOptions('comparison', []);
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

    /* resetForm () {
        // this.refs.tuning.value = '';
        this.refs.scale.value = '';
        this.refs.root.value = '';
        this.refs.arpeggio.value = '';
        this.resetRadio('whatToShow')
    } */

    open (data) {
        this.element.firstChild.style.display = "block";
        this.fillForm(data);
    }

    close () {
        this.element.firstChild.style.display = "none";
    }

    save () {
        this.data = {
            id: this.id,
            whatToShow: this.getRadioValue('whatToShow'),   // can be notes | degrees
            size: this.refs.size.value,
            opacity: this.refs.opacity.value,
            comparison: this.refs.comparison.value
        }
        this.close();
        // this.resetForm();
        this.callback(this.data);
    }

}