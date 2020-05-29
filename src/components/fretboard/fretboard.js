import "./fretboard.scss";
import template from './fretboard.html'

// Components
import ModalChoice from '../modal-choice/modal-choice';
import Settings from '../settings/settings';
import Header from '../header/header';

// Musin engines
import { Fretboard, mergeArrays, createMergeColors, generateFingerings } from '../../engine';
import { Note, Scale, Interval } from "@tonaljs/tonal";
import { allIntervals, allScales } from '../../constants';

export default class MyFretboard {

    constructor(input = {}) {
        this.body = document.body;
        this.body.innerHTML = `${template}`;

        this.header = new Header('header', this.addFretboard.bind(this), this.removeAllFretboard.bind(this));
        this.modal = new ModalChoice('modal', this.save.bind(this));
        this.settings = new Settings('settings', this.updateLayerSettings.bind(this));

        this.fretboardIstances = {};
        this.selectedInterval = [];

        // così si accede alle proprietà del figlio....
        console.log(this.header.refs.progress.value, this.header.tags);

        /*
        If thre is an input data use addFretboard 
        and then for each layer use addLayer s
        */
        window.onresize = this.resize.bind(this);
    }

    resize () {
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

    getParent (evt, str) {
        let parent;
        if (!str) {
            parent = evt.target.closest("[data-id*='fretboard']");
        } else {
            parent = document.querySelector("[data-id*='" + str + "']");
        }
        return { parent, id: parent.dataset.id };
    }

    addFretboard () {
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
        fretboard.querySelector('.scale-info-btn').addEventListener('click', (evt) => this.toggleAssociation.call(this, evt));
        fretboard.querySelector('.scale-play-btn').addEventListener('click', (evt) => this.playScale.call(this, evt));

        this.fretboardIstances[id] = Fretboard({
            where: `[data-id='${id}'] .col-output .fret`,
            fretWidth: window.innerWidth < 600 ? 34 : 46,
            fretHeight: 32,
            frets: window.innerWidth > 1024 ? 15 : 12
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

    removeAllFretboard () {
        let fretboards = document.querySelectorAll('.fretboard-container')
        fretboards.forEach(element => {
            element.remove();
        });
    }

    removeFretboard (evt) {
        let { parent } = this.getParent(evt);
        parent.remove();
    }

    setBubble (slider, bubble, id) {
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

    transposeLayers (evt) {
        let { parent, id } = this.getParent(evt);

        for (let i = 0; i < this.fretboardIstances[id].layers.length; i++) {
            const layer = this.fretboardIstances[id].layers[i];
            layer.root = Note.transpose(layer.root, this.selectedInterval[id]);
            layer.notes = layer.notes.map(e => Note.transpose(e, this.selectedInterval[id]));
            if (layer.value.includes('merged')) {
                let [root1, scale1] = layer.value1.split(' ');
                let [root2, scale2] = layer.value2.split(' ');
                let newRoot1 = Note.transpose(root1, this.selectedInterval[id]);
                let newRoot2 = Note.transpose(root2, this.selectedInterval[id]);
                layer.value1 = `${newRoot1} ${scale1}`;
                layer.value2 = `${newRoot2} ${scale2}`;
                layer.value = `${layer.value1} merged with ${layer.value2}`;
                layer.fingerings = generateFingerings(layer);
                console.log(`Layer transposed ${layer.id}`, layer);
            } else {
                layer.value = `${layer.root} ${layer.scale}`;
            }
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

    playScale (evt) {
        let { id } = this.getParent(evt);
        let index = this.fretboardIstances[id].layers.findIndex(e => e.id === this.fretboardIstances[id].selectedIndex);
        let data = this.fretboardIstances[id].layers[index];
        console.log(data);
    }

    toggleAssociation (evt) {
        let { parent } = this.getParent(evt);
        let panel = parent.querySelector('.info');
        panel.style.visibility = panel.style.visibility == 'inherit' ? 'hidden' : 'inherit';
    }

    calculateAssociation (evt) {
        let { parent, id } = this.getParent(evt);
        let index = this.fretboardIstances[id].layers.findIndex(e => e.id === this.fretboardIstances[id].selectedIndex);
        let { extended, scaleChords, reduced, root, value } = this.fretboardIstances[id].layers[index];

        this.chordsList = parent.querySelector('.chords-list');
        this.chords = scaleChords;
        this.renderChords();

        this.reducedList = parent.querySelector('.reduced-list');
        /* if (reduced.length === 0) {
            parent.querySelector('.reduced').style.display = 'none';
        } else { */
            this.renderReduced(reduced, root, id);
        /* } */
        this.extendedList = parent.querySelector('.extended-list');
        this.renderExtended(extended, root, id);
    }

    renderChords () {
        this.chordsList.innerHTML = '';
        this.chords.map(item => {
            this.chordsList.innerHTML += `<li>${item}</li>`; /* <span data-chordid="${index}">&times;</span> */
        });
        /* document.querySelectorAll('[data-chordid]').forEach(element => {
            element.addEventListener('click', (evt) => {
                // TODO: this.add(element.dataset.chordid)
            });
        }); */
    }

    renderReduced (reduced, root, parentId) {
        this.reducedList.innerHTML = '';
        reduced.map(item => {
            this.reducedList.innerHTML += `<li>${item} <span data-reducedid="${item}"> + </span></li>`;
        });
        document.querySelectorAll('[data-reducedid]').forEach(element => {
            element.addEventListener('click', (evt) => {
                this.save({
                    fingering: "all",
                    parentId: parentId,
                    root: root,
                    scale: element.dataset.reducedid,
                    tuning: "E_std",
                    value: `${root} ${element.dataset.reducedid}`,
                    whatToShow: "degrees"
                })
            });
        });
    }

    renderExtended (extended, root, parentId) {
        this.extendedList.innerHTML = '';
        extended.map(item => {
            this.extendedList.innerHTML += `<li>${item} <span data-extendedid="${item}">+</span></li>`;
        });
        document.querySelectorAll('[data-extendedid]').forEach(element => {
            element.addEventListener('click', (evt) => {
                this.save({
                    fingering: "all",
                    parentId: parentId,
                    root: root,
                    scale: element.dataset.extendedid,
                    tuning: "E_std",
                    value: `${root} ${element.dataset.extendedid}`,
                    whatToShow: "degrees"
                })
            });
        });
    }

    getNoteVisibilityRange (notes) {
        return notes.map(() => 1);
    }

    openLayerSettings (evt) {
        let { id } = this.getParent(evt);
        let index = this.fretboardIstances[id].layers.findIndex(e => e.id === this.fretboardIstances[id].selectedIndex);
        this.settings.open(this.fretboardIstances[id].layers[index], this.fretboardIstances[id]);
    }

    // callback from settings panel
    updateLayerSettings (data) {
        // console.log(data);
        let id = data.parentId;
        let toBeUpdate = this.fretboardIstances[id].layers.findIndex(e => e.id === data.id);
        this.fretboardIstances[id].layers[toBeUpdate] = Object.assign(this.fretboardIstances[id].layers[toBeUpdate], data);
        this.fretboardIstances[id].repaint();
        this.updateLayerInfo(this.fretboardIstances[id].layers[toBeUpdate], id);
    }

    // callback from modal
    save (data) {
        console.log('Choose modal: ', data);
        let { parent, id } = this.getParent(null, data.parentId);
        let layer = `${data.root} ${data.scale}`;
        if (data.id && data.mergeAction) {   // MERGE SCALES
            this.createMerge(data);
        } else if (data.id) {  // EDIT MODE
            let { notes, intervals } = Scale.get(layer);
            data.notes = notes.map(e => this.safeNotes(e));
            data.intervals = intervals;
            data.notesForString = notes.length > 5 ? 3 : 2;
            data.fingerings = generateFingerings(data);
            console.log(`Layer updated ${data.id}`, data);
            const li = parent.querySelector(`[data-id='${data.id}']`);
            li.querySelector('.layer-label').innerHTML = layer;
            let toBeUpdate = this.fretboardIstances[id].layers.findIndex(e => e.id === data.id);
            this.fretboardIstances[id].layers[toBeUpdate] = Object.assign(this.fretboardIstances[id].layers[toBeUpdate], data);
            this.fretboardIstances[id].repaint();
            this.updateTitle(layer, id);
            this.updateLayerInfo(this.fretboardIstances[id].layers[toBeUpdate], id);
            this.selectLayer({ target: parent }, data.id, id);  // si seleziona automaticamente e si apre la sidebar dei settings
        } else {        // SAVE NEW
            this.renderLayer(layer, data);
        }
    }

    getIntervalsOfMerged (notes) {
        let root = notes[0];
        let intervals = [];
        for (let i = 0; i < notes.length; i++) {
            intervals.push(Interval.distance(root, notes[i]));
        }
        return intervals.sort();
    }

    createMerge (data) {
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
            <span class="visibility-btn"> &#9899; </span>
            <span class="delete-btn"> &#128298; </span>
            `;
        list.appendChild(li);
        let toBeAdded = {
            id: layerId,
            parentId: parentId,
            root: data.root,
            scale: data.scale,
            value: label_merged_layer,
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
            fingering: 'all'
        };
        let data1 = Scale.get(toBeAdded.value1);
        let data2 = Scale.get(toBeAdded.value2);
        toBeAdded.notes = mergeArrays(data1.notes.map(e => this.safeNotes(e)), data2.notes.map(e => this.safeNotes(e))).sort();
        toBeAdded.intervals = this.getIntervalsOfMerged(toBeAdded.notes);// sono riferiti alla scala di partenza
        toBeAdded.combinedColors = createMergeColors(toBeAdded.notes, data1.notes, data2.notes);
        toBeAdded.notesForString = toBeAdded.notes.length > 5 ? 3 : 2,
            toBeAdded.fingerings = generateFingerings(toBeAdded);
        console.log(`Layer merged ${toBeAdded.id}`, toBeAdded);
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
        this.selectLayer({ target: parent }, layerId, parentId);  // si seleziona automaticamente e si apre la sidebar dei settings
    }

    checkScale (scales) {
        let output = [];
        scales.forEach(scale => {
            if (allScales.includes(scale)) {
                output.push(scale)
            }
        });
        return output;
    }

    renderLayer (layer, data) {
        let { parent } = this.getParent(null, data.parentId);
        const list = parent.querySelector('.list');
        const layerId = data.id || Math.floor(Math.random() * 1000000);
        const parentId = data.parentId;
        let li = document.createElement('li');
        li.classList.add('scale');
        li.dataset.id = layerId;
        li.innerHTML = `
            <span class="layer-label">${layer}</span>
            <span class="merge-btn"> &#128279; </span>
            <span class="edit-btn"> &#128295; </span>
            <span class="visibility-btn"> &#9899; </span>
            <span class="delete-btn"> &#128298; </span>
            `;
        list.appendChild(li);
        let { notes, intervals } = Scale.get(layer);
        notes = notes.map(e => this.safeNotes(e));
        let toBeAdded = {
            id: layerId,
            parentId: parentId,
            root: data.root,
            scale: data.scale,
            value: layer,
            notes: notes,
            intervals: intervals,
            visible: true,
            notesVisibility: this.getNoteVisibilityRange(notes),
            tuning: data.tuning,
            type: data.type,
            whatToShow: data.whatToShow,
            size: 1,
            opacity: 1,
            color: 'many',
            differences: 'own',
            notesForString: notes.length > 5 ? 3 : 2,
            fingering: 'all',
            reduced: this.checkScale(Scale.reduced(data.scale)),
            extended: this.checkScale(Scale.extended(data.scale)),
            scaleChords: Scale.scaleChords(data.scale),
            modeNames: Scale.modeNames(data.scale)
        };
        toBeAdded.fingerings = generateFingerings(toBeAdded);
        console.log(`Layer ${toBeAdded.id}`, toBeAdded);
        this.fretboardIstances[parentId].layers.push(toBeAdded);
        this.fretboardIstances[parentId].addLayer(toBeAdded);
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
        this.selectLayer({ target: parent }, layerId, parentId);  // si seleziona automaticamente e si apre la sidebar dei settings
    }

    safeNotes (note) {
        let output;
        switch (note) {
            case 'B#': output = 'C'; break;
            case 'E#': output = 'F'; break;
            case 'Fb': output = 'E'; break;
            case 'Cb': output = 'B'; break;
            default: output = note; break;
        }
        return output;
    }

    addLayer (evt) {
        let { parent } = this.getParent(evt);
        let def = {
            parentId: parent.dataset.id,
            type: 'scale',          // can be scale | arpeggio
            whatToShow: 'degrees',  // can be notes | degrees | none
            tuning: 'E_std',
            root: 'A',
            scale: 'dorian',
            arpeggio: 'min7',
            title: 'New layer',
            action: 'Save &#128076;',
            fingering: 'all'
        };
        this.modal.open(def);
    }

    updateLayerInfo (info, parentId) {
        let { parent, id } = this.getParent(null, parentId);
        let degrees = parent.querySelector('.degrees')
        let noteNames = parent.querySelector('.notes')
        if (info) {
            degrees.innerHTML = info.intervals.map((e, i) => `<td class="${info.notesVisibility[i] ? '' : 'disabled'}">${e}</td>`).join('');
            noteNames.innerHTML = info.notes.map((e, i) => `<td class="label-notes ${info.notesVisibility[i] ? '' : 'disabled'}">${e}</td>`).join('');
            for (let i = 0; i < noteNames.children.length; i++) {
                const elementN = noteNames.children[i];
                elementN.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.fretboardIstances[id].updateLayer(i, info.value);
                    elementN.classList.toggle('disabled');
                    elementD.classList.toggle('disabled');
                });
                const elementD = degrees.children[i];
                elementD.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.fretboardIstances[id].updateLayer(i, info.value);
                    elementN.classList.toggle('disabled');
                    elementD.classList.toggle('disabled');
                });
            }
            if (info.differences !== 'own') {   // TODO: check
                let original, compare;
                if (info.value.includes('merged')) {
                    original = info.notes;
                } else {
                    original = Scale.get(info.value).notes;
                    original = original.map(e => this.safeNotes(e));
                }
                if (info.differences.includes('merged')) {
                    let o = this.fretboardIstances[id].layers.find(e => e.value === info.differences);
                    compare = o.notes;
                } else {
                    compare = Scale.get(info.differences).notes;
                    compare = compare.map(e => this.safeNotes(e));
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

    removeLayers (evt) {
        let { parent, id } = this.getParent(evt);
        const list = parent.querySelector('.list');
        while (list.hasChildNodes()) {
            list.removeChild(list.firstChild);
        }
        this.fretboardIstances[id].clearNotes();
        this.fretboardIstances[id].layers = [];
        this.updateTitle('', parent.dataset.id);
        this.updateLayerInfo(null, parent.dataset.id);
        this.removeFingeringBtn(parent);
        parent.querySelector('.settings-btn').style.visibility = 'hidden';
        parent.querySelector('.scale-info-btn').style.visibility = 'hidden';
        parent.querySelector('.scale-play-btn').style.visibility = 'hidden';
    }

    editLayer (evt, layerId) {
        let { id } = this.getParent(evt);
        let selected = this.fretboardIstances[id].layers.find(e => e.id === layerId);
        selected.title = 'Edit layer';
        selected.action = 'Update &#128076;';
        this.modal.open(selected);
    }

    mergeLayer (evt, layerId) {
        let { id } = this.getParent(evt);
        let selected = this.fretboardIstances[id].layers.find(e => e.id === layerId);
        selected.title = 'Merge layer';
        selected.action = 'Merge &#128076;';
        selected.mergeAction = true;
        selected.startScale = selected.value;
        this.modal.open(selected);
    }

    toggleLayerVisibility (event, id, parentId) {
        event.stopPropagation();
        let selected = this.fretboardIstances[parentId].layers.find(e => e.id === id)
        selected.visible = !selected.visible;
        let li = document.querySelector(`[data-id='${id}']`)
        li.querySelector('.visibility-btn').innerHTML = selected.visible ? ' &#9899; ' : '&#9898;';
        this.fretboardIstances[parentId].repaint();
    }

    deleteLayer (evt, id, parentId) {
        let { parent } = this.getParent(evt);
        let layer = document.querySelector(`[data-id='${id}']`);
        layer.parentNode.removeChild(layer)
        this.fretboardIstances[parentId].layers = this.fretboardIstances[parentId].layers.filter(s => s.id !== id);
        this.fretboardIstances[parentId].repaint();
        this.updateTitle('', parentId);
        this.updateLayerInfo(null, parentId);
        this.removeFingeringBtn(parent);
    }

    selectLayer (event, id, parentId) {
        let { parent } = this.getParent(null, parentId);
        this.fretboardIstances[parentId].selectedIndex = id; // id del layer

        // BTN
        parent.querySelector('.settings-btn').style.visibility = 'inherit';
        parent.querySelector('.scale-info-btn').style.visibility = 'inherit';
        parent.querySelector('.scale-play-btn').style.visibility = 'inherit';

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
        this.updateFingeringBtns(event, selected);
        this.calculateAssociation(event);
        this.fretboardIstances[parentId].repaint();
        // this.settings.open(this.fretboardIstances[parentId].layers[index], this.fretboardIstances[parentId]);
    }

    updateFingeringBtns (event, data) {
        let { parent, id } = this.getParent(event);
        let a = 0;
        let list = data.notes.map(() => {
            a++;
            return a
        });
        list.unshift('All');
        let fingeringList = parent.querySelector('.fingering-list');
        fingeringList.innerHTML = list.map(e => `<span class="fingering-item">${e}</span>`).join('');

        fingeringList.children[data.fingering === 'all' ? 0 : data.fingering].classList.add('selected');

        if (data.fingering !== 'all') {
            this.fretboardIstances[id].repaint();
        }

        // EVENTS
        for (let i = 0; i < fingeringList.children.length; i++) {
            const fingering = fingeringList.children[i];
            fingering.addEventListener('click', (event) => {
                event.stopPropagation();
                for (let item of fingeringList.children) {
                    item.classList.remove('selected');
                }
                fingering.classList.toggle('selected');
                data.fingering = i === 0 ? 'all' : i;
                this.fretboardIstances[id].repaint();
            });
        }
    }

    removeFingeringBtn (parent) {
        let fingeringList = parent.querySelector('.fingering-list');
        fingeringList.innerHTML = '';
    }

    updateTitle (title, parentId) {
        document.querySelector(`[data-id='${parentId}'] .col-output .scale-title`).innerHTML = title;
    }
}