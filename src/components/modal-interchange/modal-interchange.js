import "./modal-interchange.scss";
import template from './modal-interchange.html';

import state from '../../state';

import { generateChordsForModalInterchange } from '../../engine';

export default class ModalInterchange {

    constructor(placeholderId) {

        this.element = document.getElementById(placeholderId);

        // Load template into placeholder element
        this.element.innerHTML = template;

        // Find all refs in component
        this.refs = {}
        const refElems = this.element.querySelectorAll('[ref]')
        refElems.forEach((elem) => { this.refs[elem.getAttribute('ref')] = elem })

        // EVENTS
        document.getElementsByClassName("close-interchange")[0].addEventListener('click', this.close.bind(this));
        this.element.querySelector('#selectedNote').addEventListener('change', (evt) => this.buildTable.call(this, evt));
        this.table = this.element.querySelector('.interchange-table');
        this.comparison = this.element.querySelector('.comparison-table');

        this.roots = [];
        this.selectedNote = state.selectedNote || 'c';
        this.degrees = ['', '1°', '2°', '3°', '4°', '5°', '6°', '7°'];
        this.optionsNotes = [
            { text: 'C', value: 'c' },
            { text: 'C#/Db', value: 'c#' },
            { text: 'D', value: 'd' },
            { text: 'D#/Eb', value: 'd#' },
            { text: 'E', value: 'e' },
            { text: 'F', value: 'f' },
            { text: 'F#/Gb', value: 'f#' },
            { text: 'G', value: 'g' },
            { text: 'G#/Ab', value: 'g#' },
            { text: 'A', value: 'a' },
            { text: 'A#/Bb', value: 'a#' },
            { text: 'B', value: 'b' }
        ];
        this.selectedScales = [];

        this.configureForm();
        this.buildTable({
            target: {
                value: this.selectedNote
            }
        });

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = (event) => {
            if (event.target == this.element) {
                this.element.style.display = "none";
            }
        }
    }

    buildTable (evt) {
        let root = evt.target.value;
        this.selectedScales.length = 0;
        let rows = this.table.querySelectorAll('.interchange-row');
        if (rows) {
            rows.forEach(element => {
                element.remove();           // remove the html element
            });
        }
        let header = this.table.querySelector('.interchange-header')
        this.roots = generateChordsForModalInterchange(root);
        console.log('Modal interchange table: ', this.roots);
        header.innerHTML = this.degrees.map((e, i) => `<th>${e}</th>`).join('');
        for (let i = 0; i < this.roots.length; i++) {
            const row = this.roots[i];
            let rowHtml = document.createElement('tr');
            rowHtml.classList.add('interchange-row');
            rowHtml.data = row;
            rowHtml.innerHTML = `<td class="interchange-header">${row.type}</td>` + `${row.chords.map((e, i) => `<td>${e}</td>`).join('')}`;
            this.table.appendChild(rowHtml);
        }
        let rowsEvents = this.table.querySelectorAll('.interchange-row');
        if (rowsEvents) {
            rowsEvents.forEach(element => {
                element.addEventListener('click', (evt) => this.selectScale(evt));
            });
        }
        this.setColorInRows();
        this.buildComparison();
    }

    selectScale (evt) {
        let scale = evt.target.parentElement.data;
        if (this.selectedScales.length < 2 && this.selectedScales.findIndex(x => x.type == scale.type) == -1) {
            this.selectedScales.push(scale);
        } else {
            let index = this.selectedScales.findIndex(x => x.type == scale.type);
            this.selectedScales.splice(index, 1);
        }
        this.setColorInRows();
        this.buildComparison();
    }

    buildComparison () {
        let rows = this.comparison.querySelectorAll('.intervals-row, .notes-row');
        if (rows) {
            rows.forEach(element => {
                element.remove();           // remove the html element
            });
        }
        for (let i = 0; i < this.selectedScales.length; i++) {
            const row = this.selectedScales[i];
            let intervalRow = document.createElement('tr');
            intervalRow.classList.add('intervals-row');
            intervalRow.innerHTML = `<td></td>` + `${row.intervals.map((e, i) => `<td>${e}</td>`).join('')}`;
            this.comparison.appendChild(intervalRow);
            let notesRow = document.createElement('tr');
            notesRow.classList.add('notes-row');
            notesRow.innerHTML = `<td class="interchange-header">${row.name}</td>` + `${row.notes.map((e, i) => `<td >${e}</td>`).join('')}`;
            this.comparison.appendChild(notesRow);
        }
        let secondRow = this.comparison.querySelectorAll('.notes-row')[1];
        if (secondRow) {
            let notes = secondRow.querySelectorAll('td');
            notes.forEach((note, i) => {
                if (i !== 0) {
                    if (!this.selectedScales[0].notes.includes(note.textContent)){
                        note.classList.add('red');
                    }
                }
            });
        }

    }

    setColorInRows () {
        let rows = this.table.querySelectorAll('.interchange-row');
        if (this.selectedScales.length) {
            this.selectedOne = this.roots.find(x => x.type == this.selectedScales[0].type);
        } else {
            this.selectedOne = null;
        }
        if (this.selectedScales.length > 1) {
            this.selectedTwo = this.roots.find(x => x.type == this.selectedScales[1].type);
        } else {
            this.selectedTwo = null;
        }
        rows.forEach(row => {
            row.classList.remove('table-primary', 'table-secondary');
        });
        rows.forEach(row => {
            if (this.selectedOne && this.selectedOne.type === row.data.type) {
                row.classList.add('table-primary');
            }
            if (this.selectedTwo && this.selectedTwo.type === row.data.type) {
                row.classList.add('table-secondary');
            }
        });
    }

    configureForm () {
        this.fillOptions('selectedNote', this.optionsNotes);
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

    fillForm () {
        this.selectedNote = state.selectedNote || 'c';
        this.refs.selectedNote.value = this.selectedNote;
    }

    open () {
        this.element.style.display = "block";
        this.fillForm();
    }

    close () {
        this.element.style.display = "none";
        state.selectedNote = this.refs.selectedNote.value;
    }
}
