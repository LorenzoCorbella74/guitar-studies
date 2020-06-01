import "./modal-note.scss";
import template from './modal-note.html';

export default class ModalNote {

    constructor(placeholderId, callback = () => null) {

        this.element = document.getElementById(placeholderId);
        this.callback = callback;

        // Load template into placeholder element
        this.element.innerHTML = template;

        // Find all refs in component
        this.refs = {}
        const refElems = this.element.querySelectorAll('[ref]')
        refElems.forEach((elem) => { this.refs[elem.getAttribute('ref')] = elem })

        document.getElementsByClassName("close-note")[0].addEventListener('click', this.close.bind(this));
        document.getElementsByClassName("save-note")[0].addEventListener('click', this.save.bind(this));

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = (event) => {
            if (event.target == this.element) {
                this.element.style.display = "none";
            }
        }
    }

    fillForm(data) {
        this.id = data.id;
        this.parentId = data.parentId;
        this.refs.note.innerHTML = data.note;        
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
            note: this.refs.note.value,
        }
        this.element.style.display = "none";
        this.callback(this.data)
    }
}
