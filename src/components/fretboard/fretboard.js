import "./fretboard.scss";
import template from './fretboard.html'

// Component
import ModalChoice from '../modal-choice/modal-choice';
import Settings from '../settings/settings';

import { Fretboard } from '../../engine';

import { /* Chord, Distance, */ Note, Scale } from "@tonaljs/tonal";

import { allIntervals } from '../../constants';

export default class MyFretboard {

    constructor(input) {
        this.body = document.body;
        this.body.innerHTML = `${template}`;

        this.guitar = Fretboard({
            where: "#output",
            frets: 12
        });
        this.guitar.drawBoard();
        this.guitar.layers = input || [];
        this.selectedIndex = null;

        document.getElementById('settings-btn').style.visibility = 'hidden';

        // EVENTS
        document.getElementById('add-btn').addEventListener('click', this.addLayer.bind(this));
        document.getElementById('remove-btn').addEventListener('click', this.removeLayers.bind(this));
        document.getElementById('settings-btn').addEventListener('click', this.openLayerSettings.bind(this));
        document.getElementById('transpose-btn').addEventListener('click', this.transposeLayers.bind(this));
        window.onresize = this.resize.bind(this);

        this.modal = new ModalChoice('modal', this.save.bind(this));
        this.settings = new Settings('settings', this.updateLayerSettings.bind(this))

        // SLIDER RANGE
        const slider = document.querySelector(".slidecontainer .slider");
        const bubble = document.querySelector(".slidecontainer .bubble");
        slider.addEventListener("input", () => {
            this.setBubble(slider, bubble);
        });
        this.setBubble(slider, bubble);
    }

    setBubble (slider, bubble) {
        const val = slider.value;
        const min = slider.min ? slider.min : 0;
        const max = slider.max ? slider.max : 100;
        const newVal = Number(((val - min) * 100) / (max - min));
        let selectedInterval = allIntervals[val];
        bubble.innerHTML = selectedInterval;

        // Sorta magic numbers based on size of the native UI thumb
        bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;

        if (selectedInterval !== '1P') {
            this.selectedInterval = selectedInterval;
        }
    }

    transposeLayers () {
        for (let i = 0; i < this.guitar.layers.length; i++) {
            const layer = this.guitar.layers[i];
            layer.root = Note.transpose(layer.root, this.selectedInterval);
            layer.value = `${layer.root} ${layer.scale}`;
        }
        // layers are deselected
        document.querySelectorAll('.scale').forEach(element => {
            element.classList.remove('selected');
        });
        // updating labels
        document.querySelectorAll('.scale').forEach((element, index) => {
            element.querySelector('.layer-label').innerHTML = this.guitar.layers[index].value;
        });
        // Layer info are removed
        this.updateTitle('');
        this.updateLayerInfo();
        // repaint layers
        this.guitar.repaint();
        // resetting range
        const slider = document.querySelector(".slidecontainer .slider");
        const bubble = document.querySelector(".slidecontainer .bubble");
        slider.value = '0';
        this.setBubble(slider, bubble);
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
        let data = Scale.get(scale);
        return data.notes.map(() => 1);
    }

    openLayerSettings () {
        let index = this.guitar.layers.findIndex(e => e.id === this.selectedIndex);
        this.settings.open(this.guitar.layers[index]);
    }

    // callback from settings panel
    updateLayerSettings (data) {
        console.log(data)
    }

    // callback from modal
    save (data) {
        console.log(data);
        let layer = `${data.root} ${data.scale}`;
        if (data.id) {  // EDIT MODE
            const li = document.getElementById(data.id);
            li.querySelector('.layer-label').innerHTML = layer;
            let toBeUpdate = this.guitar.layers.findIndex(e => e.id === data.id);
            this.guitar.layers[toBeUpdate] = Object.assign(this.guitar.layers[toBeUpdate], data);
            this.guitar.repaint();
            this.updateTitle(layer);
            this.updateLayerInfo(this.guitar.layers[toBeUpdate]);
        } else {        // SAVE NEW
            this.renderLayer(layer, data);
        }
    }

    renderLayer (layer, data) {
        const list = document.getElementById('list');
        const id = data.id || Math.floor(Math.random() * 1000000);
        let li = document.createElement('li');
        li.classList.add('scale');
        li.id = id;
        li.innerHTML = `
            <span class="layer-label">${layer}</span>
            <span class="edit-btn"> e </span>
            <span class="visibility-btn"> o </span>
            <span class="delete-btn"> x </span>
            `;
        list.appendChild(li);
        let toBeAdded = {
            id: id,
            root: data.root,
            scale: data.scale,
            value: layer,
            visible: true,
            notesVisibility: this.getNoteVisibilityRange(layer),
            tuning: data.tuning,
            type: data.type,
            whatToShow: data.whatToShow,
            size: 1,
            opacity: 1,
            color: 'many',
            differences: 'own',
        };
        this.guitar.layers.push(toBeAdded);
        this.guitar.addLayer(layer);
        this.guitar.paint();
        li.querySelector('.layer-label').addEventListener('click', (event) => {
            this.selectLayer(event, id);
        });
        li.querySelector('.edit-btn').addEventListener('click', (event) => {
            this.editLayer(event, id);
        });
        li.querySelector('.visibility-btn').addEventListener('click', (event) => {
            this.toggleLayerVisibility(event, id);
        });
        li.querySelector('.delete-btn').addEventListener('click', (event) => {
            this.deleteLayer(event, id);
        });
        this.updateTitle(layer);
        this.updateLayerInfo(toBeAdded);
    }

    addLayer () {
        let def = {
            type: 'scale',      // can be scale | arpeggio
            whatToShow: 'degrees', // can be notes | degrees
            tuning: 'E_std',
            root: 'A',
            scale: 'dorian',
            arpeggio: 'min7',
            title: 'New layer',    // can be 
            action: 'Save'    // can be 
        };
        this.modal.open(def);
    }

    updateLayerInfo (info) {
        let degrees = document.querySelector('.degrees')
        let noteNames = document.querySelector('.notes')
        if (info) {
            let scale = info.value;
            let { notes, intervals } = Scale.get(scale);
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

    removeLayers (event) {
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

    editLayer (event, id) {
        let selected = this.guitar.layers.find(e => e.id === id);
        selected.title = 'Edit layer';
        selected.action = 'Update';
        this.modal.open(selected);
    }

    toggleLayerVisibility (event, id) {
        event.stopPropagation();
        let selected = this.guitar.layers.find(e => e.id === id)
        selected.visible = !selected.visible;
        let li = document.getElementById(id)
        li.querySelector('.visibility-btn').textContent = selected.visible ? 'o' : '-';
        this.guitar.repaint();
    }

    deleteLayer (event, id) {
        event.stopPropagation();
        let elem = document.getElementById(id);
        elem.parentNode.removeChild(elem)
        this.guitar.layers = this.guitar.layers.filter(s => s.id !== id);
        this.guitar.repaint();
        this.updateTitle('');
        this.updateLayerInfo();
    }

    selectLayer (event, id) {
        this.selectedIndex = id;
        document.getElementById('settings-btn').style.visibility = 'inherit';
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
        document.querySelector('#output .scale-title').innerHTML = title;
    }
}