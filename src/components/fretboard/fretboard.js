import "./fretboard.scss";
import template from './fretboard.html'

// Component
import ModalChoice from '../modal-choice/modal-choice';

import { Fretboard, asNotes } from '../../engine';

import { /* Chord, Distance, */ Scale } from "@tonaljs/tonal";


export default class MyFretboard {

    constructor() {
        this.body = document.body;
        this.body.innerHTML = `${template}`;

        this.guitar = Fretboard({
            where: "#output",
            frets: 12
        });
        this.guitar.drawBoard();
        this.guitar.layers = [];

        // Bindings
        document.getElementById('add-btn').addEventListener('click', this.addScale.bind(this));
        document.getElementById('remove-btn').addEventListener('click', this.removeScales.bind(this));

        this.modal = new ModalChoice('modal', this.save);

        window.onresize = this.resize.bind(this);
    }

    resize () {
        // console.log(window.innerHeight, window.innerWidth);
        this.isSmall = window.innerWidth < 800;
        if (this.isSmall) {
            this.guitar.set('fretWidth', 40);
        } else {
            this.guitar.set('fretWidth', 50);
        }
    }

    getNoteVisibilityRange (scale) {
        let notes = asNotes(scale);
        notes = notes.split(' ');
        return notes.map(() => 1);
    }

    save (data) {
        console.log(data);
        let layer = `${data.root} ${data.scale}`;
        const list = document.getElementById('list');
        const id = Math.floor(Math.random() * 1000000);
        let li = document.createElement('li');
        li.classList.add('scale');
        li.id = id;
        li.innerHTML = `
            <span class="scale-txt">${layer}</span>
            <span class="visibility-btn"> o </span>
            <span class="delete-btn"> x </span>
            `;
        list.appendChild(li);
        let toBeAdded = {
            id: id,
            value: layer,
            visible: true,
            notesVisibility: this.getNoteVisibilityRange(layer)
        };
        this.guitar.layers.push(toBeAdded);
        this.guitar.add(layer);
        this.guitar.paint();
        li.querySelector('.scale-txt').addEventListener('click', (event) => {
            this.selectScale(event, id);
        });
        li.querySelector('.visibility-btn').addEventListener('click', (event) => {
            this.toggleVisibility(event, id);
        });
        li.querySelector('.delete-btn').addEventListener('click', (event) => {
            this.deleteScale(event, id);
        });
        this.updateTitle(layer);
        this.updateLayerInfo(toBeAdded);
    }

    addScale () {
        this.modal.open();
    }

    updateLayerInfo (info) {
        let scale = info.value;
        let degrees = document.querySelector('.degrees')
        let noteNames = document.querySelector('.notes')
        if (scale) {
            let [root, name] = scale.trim().split(' ');
            let { notes, intervals } = Scale.get(`${root} ${name}`);
            degrees.innerHTML = intervals.map((e, i) => `<td class="${info.notesVisibility[i] ? '' : 'disabled'}">${e}</td>`).join('');
            noteNames.innerHTML = notes.map((e, i) => `<td class="${info.notesVisibility[i] ? '' : 'disabled'}">${e}</td>`).join('');
            for (let i = 0; i < noteNames.children.length; i++) {
                const elementN = noteNames.children[i];
                elementN.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.guitar.updateLayer(i, scale);
                    elementN.classList.toggle('disabled');
                    elementD.classList.toggle('disabled');
                });
                const elementD = degrees.children[i];
                elementD.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.guitar.updateLayer(i, scale);
                    elementN.classList.toggle('disabled');
                    elementD.classList.toggle('disabled');
                });
            }
        } else {
            degrees.innerHTML = '';
            noteNames.innerHTML = '';
        }
    }

    removeScales (event) {
        event.stopPropagation();
        const list = document.getElementById('list');
        while (list.hasChildNodes()) {
            list.removeChild(list.firstChild);
        }
        this.guitar.clearNotes();
        this.guitar.layers = [];
        this.updateTitle('');
        this.updateLayerInfo();
    }

    toggleVisibility (event, id) {
        event.stopPropagation();
        let selected = this.guitar.layers.find(e => e.id === id)
        selected.visible = !selected.visible;
        let li = document.getElementById(id)
        li.querySelector('.visibility-btn').textContent = selected.visible ? 'o' : '-';
        this.guitar.repaint();
    }

    deleteScale (event, id) {
        event.stopPropagation();
        let elem = document.getElementById(id);
        elem.parentNode.removeChild(elem)
        this.guitar.layers = this.guitar.layers.filter(s => s.id !== id);
        this.guitar.repaint();
        this.updateTitle('');
        this.updateLayerInfo();
    }

    selectScale (event, id) {
        event.stopPropagation();
        document.querySelectorAll('.scale').forEach(element => {
            element.classList.remove('selected');
        });
        let li = document.getElementById(id);
        li.classList.add('selected');
        let index = this.guitar.layers.findIndex(e => e.id === id);
        let selected = this.guitar.layers.splice(index, 1)[0];
        this.guitar.layers.push(selected);
        this.updateTitle(selected.value);
        this.updateLayerInfo(selected);
        this.guitar.repaint();
    }

    updateTitle (title) {
        let output = document.querySelector('#output .scale-title')
        output.innerHTML = title;
    }
}