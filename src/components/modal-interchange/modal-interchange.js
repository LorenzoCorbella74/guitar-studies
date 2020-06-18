import "./modal-interchange.scss";
import template from './modal-interchange.html';

import state from '../../state';

export default class ModalInterchange {

    constructor(placeholderId) {

        this.element = document.getElementById(placeholderId);
        
        // Load template into placeholder element
        this.element.innerHTML = template;

        // Find all refs in component
        this.refs = {}
        const refElems = this.element.querySelectorAll('[ref]')
        refElems.forEach((elem) => { this.refs[elem.getAttribute('ref')] = elem })

        document.getElementsByClassName("close-interchange")[0].addEventListener('click', this.close.bind(this));

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = (event) => {
            if (event.target == this.element) {
                this.element.style.display = "none";
            }
        }
    }

    fillForm() {
        this.refs.interchangeroot.innerHTML = state.interchangeroot;        
    }

    open() {
        this.element.style.display = "block";
        this.fillForm();
    }

    close() {
        this.element.style.display = "none";
        state.interchangeroot = this.refs.interchangeroot.innerHTML; 
    }
}
