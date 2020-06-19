import "./modal-fifths.scss";
import template from './modal-fifths.html';

import state from '../../state';

import { generateCircleOfFifths } from '../../engine';

export default class ModalFifths {

    constructor(placeholderId) {

        this.element = document.getElementById(placeholderId);

        // Load template into placeholder element
        this.element.innerHTML = template;

        // Find all refs in component
        this.refs = {}
        const refElems = this.element.querySelectorAll('[ref]')
        refElems.forEach((elem) => { this.refs[elem.getAttribute('ref')] = elem })

        // EVENTS
        document.getElementsByClassName("close-fifths")[0].addEventListener('click', this.close.bind(this));
        this.element.querySelector('#selectedMode').addEventListener('change', (evt) => this.buildTable.call(this, evt));
        this.table = this.element.querySelector('.fifths-table');
        this.comparison = this.element.querySelector('.comparison-table');

        this.roots = [];
        this.selectedMode = state.selectedMode || 'major';
        this.degrees = ['', '1°', '2°', '3°', '4°', '5°', '6°', '7°'];
        this.optionsModes = [
            { text: 'Major', value: 'major' },
            { text: 'Dorian', value: 'dorian' },
            { text: 'Phrygian', value: 'phrygian' },
            { text: 'Lydian', value: 'lydian' },
            { text: 'Mixolydian', value: 'mixolydian' },
            { text: 'Aeolian', value: 'aeolian' },
            { text: 'Locrian', value: 'locrian' }
        ];
        this.selectedScales = [];

        this.configureForm();
        this.buildTable({
            target: {
                value: this.selectedMode
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
        let rows = this.table.querySelectorAll('.fifths-row');
        if (rows) {
            rows.forEach(element => {
                element.remove();           // remove the html element
            });
        }
        let header = this.table.querySelector('.fifths-header')
        this.roots = generateCircleOfFifths(root);
        console.log('Modal fifths table: ', this.roots);
        header.innerHTML = this.degrees.map((e, i) => `<th>${e}</th>`).join('');
        for (let i = 0; i < this.roots.length; i++) {
            const row = this.roots[i];
            let rowHtml = document.createElement('tr');
            rowHtml.classList.add('fifths-row');
            rowHtml.data = row;
            rowHtml.innerHTML = `<td class="fifths-header">${row.tonic}</td>` + `${row.chords.map((e, i) => `<td>${e}</td>`).join('')}`;
            this.table.appendChild(rowHtml);
        }
        let rowsEvents = this.table.querySelectorAll('.fifths-row');
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
        if (this.selectedScales.length < 2 && this.selectedScales.findIndex(x => x.name == scale.name) == -1) {
            this.selectedScales.push(scale);
        } else {
            let index = this.selectedScales.findIndex(x => x.name == scale.name);
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
            notesRow.innerHTML = `<td class="fifths-header">${row.name}</td>` + `${row.notes.map((e, i) => `<td >${e}</td>`).join('')}`;
            this.comparison.appendChild(notesRow);
        }
        let secondRow = this.comparison.querySelectorAll('.notes-row')[1];
        if (secondRow) {
            let notes = secondRow.querySelectorAll('td');
            notes.forEach((note, i) => {
                if (i !== 0) {
                    if (!this.selectedScales[0].notes.includes(note.textContent)) {
                        note.classList.add('red');
                    }
                }
            });
        }

    }

    setColorInRows () {
        let rows = this.table.querySelectorAll('.fifths-row');
        if (this.selectedScales.length) {
            this.selectedOne = this.roots.find(x => x.name == this.selectedScales[0].name);
        } else {
            this.selectedOne = null;
        }
        if (this.selectedScales.length > 1) {
            this.selectedTwo = this.roots.find(x => x.name == this.selectedScales[1].name);
        } else {
            this.selectedTwo = null;
        }
        rows.forEach(row => {
            row.classList.remove('table-primary', 'table-secondary');
        });
        rows.forEach(row => {
            if (this.selectedOne && this.selectedOne.name === row.data.name) {
                row.classList.add('table-primary');
            }
            if (this.selectedTwo && this.selectedTwo.name === row.data.name) {
                row.classList.add('table-secondary');
            }
        });
    }

    configureForm () {
        this.fillOptions('selectedMode', this.optionsModes);
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
        this.selectedMode = state.selectedMode || 'major';
        this.refs.selectedMode.value = this.selectedMode;
    }

    open () {
        this.element.style.display = "block";
        this.fillForm();
    }

    close () {
        this.element.style.display = "none";
        state.selectedMode = this.refs.selectedMode.value;
    }
}
