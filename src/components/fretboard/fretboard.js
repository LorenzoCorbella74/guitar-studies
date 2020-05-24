import "./fretboard.scss";
import template from './fretboard.html'

// Component
import ModalChoice from '../modal-choice/modal-choice';
import Settings from '../settings/settings';

import { Fretboard, mergeArrays, createMergeColors } from '../../engine';

import { Note, Scale } from "@tonaljs/tonal";

import { allIntervals } from '../../constants';

export default class MyFretboard {

    constructor(input = {}) {
        this.body = document.body;
        this.body.innerHTML = `${template}`;

        // events
        document.getElementById('add-general-btn').addEventListener('click', this.addFretboard.bind(this));
        document.getElementById('remove-general-btn').addEventListener('click', this.removeAllFretboard.bind(this));
        document.getElementById('tags-general-btn').addEventListener('click', this.toggleTabsPanel.bind(this));

        window.onresize = this.resize.bind(this);

        this.modal = new ModalChoice('modal', this.save.bind(this));
        this.settings = new Settings('settings', this.updateLayerSettings.bind(this));

        this.fretboardIstances = {};
        this.selectedInterval = [];

        /*
            If thre is an input data use addFretboard 
            and then for each layer use addLayer s
        */

        // SLIDER RANGE
        const header = document.querySelector('.header');
        const slider = header.querySelector(".progress-range .slider");
        const bubble = header.querySelector(".progress-bubble");
        slider.addEventListener("input", () => {
            this.setBubbleProgress(slider, bubble);
        });
        this.setBubbleProgress(slider, bubble);

        // TAGS
        const txt = document.getElementById('tag-input');
        this.taglist = document.getElementById('tag-list');
        this.tags = [];
        txt.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                let val = txt.value;
                if (val !== '') {
                    if (this.tags.indexOf(val) >= 0) {
                        // tag già presente
                    } else {
                        this.tags.push(val);
                        this.renderTag();
                        txt.value = '';
                        txt.focus();
                    }
                } else {
                    console.log('Input is empty')
                }
            }
        });
        this.renderTag();
    }

    renderTag() {
        this.taglist.innerHTML = '';
        this.tags.map((item, index) => {
            this.taglist.innerHTML += `<li>${item} <span data-tagid="${index}">&times;</span></li>`;
        });
        document.querySelectorAll('[data-tagid]').forEach(element => {
            element.addEventListener('click', (evt) => {
                this.remove(element.dataset.tagid)
            });
        });

    }

    remove(i) {
        this.tags = this.tags.filter(item => this.tags.indexOf(item) != i);
        this.renderTag();
    }

    getParent(evt, str) {
        let parent;
        if (!str) {
            parent = evt.target.closest("[data-id*='fretboard']");
        } else {
            parent = document.querySelector("[data-id*='" + str + "']");
        }
        return { parent, id: parent.dataset.id };
    }

    toggleTabsPanel() {
        document.querySelector('.header-description').classList.toggle('hide');
        document.querySelector('.header-tags-container').classList.toggle('hide');
    }

    addFretboard() {
        var temp = document.getElementsByTagName("template")[0];
        var clone = temp.content.cloneNode(true);
        let id = 'fretboard' + Math.floor(Math.random() * 1000000);
        clone.firstElementChild.dataset.id = id;

        document.querySelector('.content').appendChild(clone);

        let fretboard = document.querySelector(`[data-id='${id}']`);

        // EVENTS
        fretboard.querySelector('.add-btn').addEventListener('click', (evt) => this.addLayer.call(this, evt));
        fretboard.querySelector('.remove-btn').addEventListener('click', (evt) => this.removeLayers.call(this, evt));
        fretboard.querySelector('.settings-btn').addEventListener('click', (evt) => this.openLayerSettings.call(this, evt));
        fretboard.querySelector('.transpose-btn').addEventListener('click', (evt) => this.transposeLayers.call(this, evt));
        fretboard.querySelector('.remove-fret-btn').addEventListener('click', (evt) => this.removeFretboard.call(this, evt));

        this.fretboardIstances[id] = Fretboard({
            where: `[data-id='${id}'] .col-output`,
            fretWidth: window.innerWidth < 600 ? 34 : 46,
            fretHeight: 32,
            frets: 12 // window.innerWidth > 1000 ? 15 : 12
        });
        this.fretboardIstances[id].drawBoard();
        this.fretboardIstances[id].layers = [];
        this.fretboardIstances[id].selectedIndex = null;

        fretboard.scrollIntoView({ behavior: 'smooth', block: 'end' });

        // SLIDER RANGE
        const slider = fretboard.querySelector(".slidecontainer .slider");
        const bubble = fretboard.querySelector(".slidecontainer .bubble");
        slider.addEventListener("input", () => {
            this.setBubble(slider, bubble, id);
        });
        this.setBubble(slider, bubble, id);
    }

    removeAllFretboard() {
        let fretboards = document.querySelectorAll('.fretboard-container')
        fretboards.forEach(element => {
            element.remove();
        });
    }

    removeFretboard(evt) {
        let { parent } = this.getParent(evt);
        parent.remove();
    }

    setBubble(slider, bubble, id) {
        const val = slider.value;
        const min = slider.min ? slider.min : 0;
        const max = slider.max ? slider.max : 100;
        const newVal = Number(((val - min) * 100) / (max - min));
        let selectedInterval = allIntervals[val];
        bubble.innerHTML = selectedInterval;

        // Sorta magic numbers based on size of the native UI thumb
        bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;

        if (selectedInterval !== '1P') {
            this.selectedInterval[id] = selectedInterval;
        }
    }

    setBubbleProgress(slider, bubble) {
        const val = slider.value;
        const min = slider.min ? slider.min : 0;
        const max = slider.max ? slider.max : 100;
        const newVal = Number(((val - min) * 100) / (max - min));
        bubble.innerHTML = val;
        // Sorta magic numbers based on size of the native UI thumb
        // bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.10}px))`;
    }

    transposeLayers(evt) {

        let { parent, id } = this.getParent(evt);

        for (let i = 0; i < this.fretboardIstances[id].layers.length; i++) {
            const layer = this.fretboardIstances[id].layers[i];
            layer.root = Note.transpose(layer.root, this.selectedInterval[id]);
            layer.value = `${layer.root} ${layer.scale}`;
        }
        // layers are deselected
        parent.querySelectorAll('.scale').forEach(element => {
            element.classList.remove('selected');
        });
        // updating labels
        parent.querySelectorAll('.scale').forEach((element, index) => {
            element.querySelector('.layer-label').innerHTML = this.fretboardIstances[id].layers[index].value;
        });
        // Layer info are removed
        this.updateTitle('', id);
        this.updateLayerInfo(null, id);
        // repaint layers
        this.fretboardIstances[id].repaint();
        // resetting range
        const slider = parent.querySelector(".slidecontainer .slider");
        const bubble = parent.querySelector(".slidecontainer .bubble");
        slider.value = '0';
        this.setBubble(slider, bubble);
    }

    resize() {
        // console.log(window.innerHeight, window.innerWidth);
        this.isSmall = window.innerWidth < 800;
        for (const key in this.fretboardIstances) {
            const fretboard = this.fretboardIstances[key];
            if (this.isSmall) {
                fretboard.set('fretWidth', 40);
            } else {
                fretboard.set('fretWidth', 50);
            }
        }
    }

    getNoteVisibilityRange(scale) {
        let data = Scale.get(scale);
        return data.notes.map(() => 1);
    }

    openLayerSettings(evt) {
        let { id } = this.getParent(evt);
        let index = this.fretboardIstances[id].layers.findIndex(e => e.id === this.fretboardIstances[id].selectedIndex);
        this.settings.open(this.fretboardIstances[id].layers[index], this.fretboardIstances[id]);
    }

    // callback from settings panel
    updateLayerSettings(data) {
        // console.log(data);
        let id = data.parentId;
        let toBeUpdate = this.fretboardIstances[id].layers.findIndex(e => e.id === data.id);
        this.fretboardIstances[id].layers[toBeUpdate] = Object.assign(this.fretboardIstances[id].layers[toBeUpdate], data);
        this.fretboardIstances[id].repaint();
        this.updateLayerInfo(this.fretboardIstances[id].layers[toBeUpdate], id);
    }

    // callback from modal
    save(data) {
        console.log(data);
        let { parent, id } = this.getParent(null, data.parentId);
        let layer = `${data.root} ${data.scale}`;
        if (data.id && data.mergeAction) {   // MERGE SCALES
            this.createMerge(data);
        } else if (data.id) {  // EDIT MODE
            const li = parent.querySelector(`[data-id='${data.id}']`);
            li.querySelector('.layer-label').innerHTML = layer;
            let toBeUpdate = this.fretboardIstances[id].layers.findIndex(e => e.id === data.id);
            this.fretboardIstances[id].layers[toBeUpdate] = Object.assign(this.fretboardIstances[id].layers[toBeUpdate], data);
            this.fretboardIstances[id].repaint();
            this.updateTitle(layer, id);
            this.updateLayerInfo(this.fretboardIstances[id].layers[toBeUpdate], id);
        } else {        // SAVE NEW
            this.renderLayer(layer, data);
        }
    }

    createMerge(data) {
        let { parent } = this.getParent(null, data.parentId);
        const list = parent.querySelector('.list');
        const layerId = Math.floor(Math.random() * 1000000);
        const parentId = data.parentId;
        let li = document.createElement('li');
        li.classList.add('scale');
        li.dataset.id = layerId;
        let label_merged_layer = `${data.startScale} merged with ${data.value}`;
        li.innerHTML = `
            <span class="layer-label">${label_merged_layer}</span>
            <span class="visibility-btn"> &#9728; </span>
            <span class="delete-btn"> x </span>
            `;
        list.appendChild(li);
        let toBeAdded = {
            id: layerId,
            parentId: parentId,
            root: data.root,
            scale: data.scale,
            value: label_merged_layer,
            name: label_merged_layer,
            value1: data.startScale,
            value2: data.value,
            visible: true,
            merge: true,
            notesVisibility: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // TODO:,
            tuning: data.tuning,
            type: data.type,
            whatToShow: data.whatToShow,
            size: 1,
            opacity: 1,
            color: 'many',
            differences: 'own',
        };
        let data1 = Scale.get(toBeAdded.value1);
        let data2 = Scale.get(toBeAdded.value2);
        toBeAdded.notes = mergeArrays(data1.notes, data2.notes);
        toBeAdded.intervals = mergeArrays(data1.intervals, data2.intervals);
        toBeAdded.combinedColors = createMergeColors(toBeAdded.notes, data1.notes, data2.notes);
        this.fretboardIstances[parentId].layers.push(toBeAdded);
        this.fretboardIstances[parentId].addMergeLayer(toBeAdded);
        this.fretboardIstances[parentId].paint();
        li.querySelector('.layer-label').addEventListener('click', (event) => {
            this.selectLayer(event, layerId, parentId);
        });
        li.querySelector('.visibility-btn').addEventListener('click', (event) => {
            this.toggleLayerVisibility(event, layerId, parentId);
        });
        li.querySelector('.delete-btn').addEventListener('click', (event) => {
            this.deleteLayer(event, layerId, parentId);
        });
        this.updateTitle(label_merged_layer, parentId);
        this.updateLayerInfo(toBeAdded, parentId);
    }

    renderLayer(layer, data) {
        let { parent } = this.getParent(null, data.parentId);
        const list = parent.querySelector('.list');
        const layerId = data.id || Math.floor(Math.random() * 1000000);
        const parentId = data.parentId;
        let li = document.createElement('li');
        li.classList.add('scale');
        li.dataset.id = layerId;
        li.innerHTML = `
            <span class="layer-label">${layer}</span>
            <span class="merge-btn"> m </span>
            <span class="edit-btn"> e </span>
            <span class="visibility-btn"> &#9728; </span>
            <span class="delete-btn"> x </span>
            `;
        list.appendChild(li);
        let toBeAdded = {
            id: layerId,
            parentId: parentId,
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
        this.fretboardIstances[parentId].layers.push(toBeAdded);
        this.fretboardIstances[parentId].addLayer(layer);
        this.fretboardIstances[parentId].paint();
        li.querySelector('.layer-label').addEventListener('click', (event) => {
            this.selectLayer(event, layerId, parentId);
        });
        li.querySelector('.merge-btn').addEventListener('click', (event) => {
            this.mergeLayer(event, layerId, parentId);
        });
        li.querySelector('.edit-btn').addEventListener('click', (event) => {
            this.editLayer(event, layerId, parentId);
        });
        li.querySelector('.visibility-btn').addEventListener('click', (event) => {
            this.toggleLayerVisibility(event, layerId, parentId);
        });
        li.querySelector('.delete-btn').addEventListener('click', (event) => {
            this.deleteLayer(event, layerId, parentId);
        });
        this.updateTitle(layer, parentId);
        this.updateLayerInfo(toBeAdded, parentId);
    }

    addLayer(evt) {
        let { parent } = this.getParent(evt);
        let def = {
            parentId: parent.dataset.id,
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

    updateLayerInfo(info, parentId) {
        let { parent, id } = this.getParent(null, parentId);
        let degrees = parent.querySelector('.degrees')
        let noteNames = parent.querySelector('.notes')
        if (info) {
            let notes, intervals, scale;
            scale = info.value;
            if (info.merge) {
                let data1 = Scale.get(info.value1);
                let data2 = Scale.get(info.value2);
                notes = mergeArrays(data1.notes, data2.notes);
                intervals = mergeArrays(data1.intervals, data2.intervals);
            } else {
                let data = Scale.get(scale);
                notes = data.notes;
                intervals = data.intervals;
            }
            degrees.innerHTML = intervals.map((e, i) => `<td class="${info.notesVisibility[i] ? '' : 'disabled'}">${e}</td>`).join('');
            noteNames.innerHTML = notes.map((e, i) => `<td class="label-notes ${info.notesVisibility[i] ? '' : 'disabled'}">${e}</td>`).join('');
            for (let i = 0; i < noteNames.children.length; i++) {
                const elementN = noteNames.children[i];
                elementN.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.fretboardIstances[id].updateLayer(i, scale);
                    elementN.classList.toggle('disabled');
                    elementD.classList.toggle('disabled');
                });
                const elementD = degrees.children[i];
                elementD.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.fretboardIstances[id].updateLayer(i, scale);
                    elementN.classList.toggle('disabled');
                    elementD.classList.toggle('disabled');
                });
            }
            if (info.differences !== 'own') {
                let original, compare;
                if (info.value.includes('merged')) {
                    original = info.notes;
                } else {
                    original = Scale.get(info.value).notes;
                }
                if (info.differences.includes('merged')) {
                    let o = this.fretboardIstances[id].layers.find(e => e.value === info.differences);
                    compare = o.notes;
                } else {
                    compare = Scale.get(info.differences).notes;
                }
                let comparison = original.map(e => compare.includes(e) ? 1 : 0);
                parent.querySelectorAll('.label-notes').forEach((element, i) => {
                    if (!comparison[i]) {
                        element.classList.add('red')
                    }
                });
            }
        } else {
            degrees.innerHTML = '';
            noteNames.innerHTML = '';
        }
    }

    removeLayers(evt) {
        let { parent, id } = this.getParent(evt);
        const list = parent.querySelector('.list');
        while (list.hasChildNodes()) {
            list.removeChild(list.firstChild);
        }
        this.fretboardIstances[id].clearNotes();
        this.fretboardIstances[id].layers = [];
        this.updateTitle('', parent.dataset.id);
        this.updateLayerInfo(null, parent.dataset.id);
        parent.querySelector('.settings-btn').style.visibility = 'inherit';
    }

    editLayer(evt, layerId) {
        let { id } = this.getParent(evt);
        let selected = this.fretboardIstances[id].layers.find(e => e.id === layerId);
        selected.title = 'Edit layer';
        selected.action = 'Update';
        this.modal.open(selected);
    }

    mergeLayer(evt, layerId) {
        let { id } = this.getParent(evt);
        let selected = this.fretboardIstances[id].layers.find(e => e.id === layerId);
        selected.title = 'Merge layer';
        selected.action = 'Merge';
        selected.mergeAction = true;
        selected.startScale = selected.value;
        this.modal.open(selected);
    }

    toggleLayerVisibility(event, id, parentId) {
        event.stopPropagation();
        let selected = this.fretboardIstances[parentId].layers.find(e => e.id === id)
        selected.visible = !selected.visible;
        let li = document.querySelector(`[data-id='${id}']`)
        li.querySelector('.visibility-btn').innerHTML = selected.visible ? ' &#9728; ' : '&#9788;';
        this.fretboardIstances[parentId].repaint();
    }

    deleteLayer(event, id, parentId) {
        event.stopPropagation();
        let layer = document.querySelector(`[data-id='${id}']`);
        layer.parentNode.removeChild(layer)
        this.fretboardIstances[parentId].layers = this.fretboardIstances[parentId].layers.filter(s => s.id !== id);
        this.fretboardIstances[parentId].repaint();
        this.updateTitle('', parentId);
        this.updateLayerInfo(null, parentId);
    }

    selectLayer(event, id, parentId) {
        let { parent } = this.getParent(null, parentId);
        this.fretboardIstances[parentId].selectedIndex = id; // id del layer
        parent.querySelector('.settings-btn').style.visibility = 'inherit';
        event.stopPropagation();
        parent.querySelectorAll('.scale').forEach(element => {
            element.classList.remove('selected');
        });
        let li = parent.querySelector(`[data-id='${id}']`);
        li.classList.add('selected');
        let index = this.fretboardIstances[parentId].layers.findIndex(e => e.id === id);
        let selected = this.fretboardIstances[parentId].layers.splice(index, 1)[0];
        this.fretboardIstances[parentId].layers.forEach(layer => {
            layer.color = 'one';
        });
        selected.color = 'many';
        this.fretboardIstances[parentId].layers.push(selected);
        this.updateTitle(selected.value, parentId);
        this.updateLayerInfo(selected, parentId);
        this.fretboardIstances[parentId].repaint();
    }

    updateTitle(title, parentId) {
        document.querySelector(`[data-id='${parentId}'] .col-output .scale-title`).innerHTML = title;
    }
}