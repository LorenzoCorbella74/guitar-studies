import "./fretboard.scss";
import template from './fretboard.html'

import state from '../../state';

// Components
import ModalChoice from '../modal-choice/modal-choice';
import Settings from '../settings/settings';
import Header from '../header/header';
import ModalNote from '../modal-note/modal-note';
import ModalInterchange from '../modal-interchange/modal-interchange';
import ModalFifths from "../modal-fifths/modal-fifths";

import { ac } from '../../index';

// Music engine
import { Fretboard, mergeArrays, createMergeColors, generateFingerings, safeNotes } from '../../engine';
import { Note, Scale, Interval } from "@tonaljs/tonal";
import { allIntervals, allScales } from '../../constants';

export default class MyFretboard {

    constructor(app, input = {}) {
        this.app = app;

        this.studyId = input.studyId || Math.floor(Math.random() * 1000000);
        this.creation = input.creation || new Date();
        this.favourite = input.favourite || false;
        this.img = input.img;

        this.body = document.getElementById('content');
        this.body.innerHTML = `${template}`;

        this.header = new Header('header',
            this.addFretboard.bind(this),
            this.removeAllFretboard.bind(this),
            this.backToList.bind(this),
            this.backToList.bind(this, false),
            this.openModalInterchange.bind(this),
            this.openModalFifth.bind(this)
        );
        this.modal = new ModalChoice('modal', this.save.bind(this));
        this.modal_note = new ModalNote('modal-note', this.saveNote.bind(this));
        this.modal_interchange = new ModalInterchange('modal-interchange');
        this.modal_fifths = new ModalFifths('modal-fifths');
        this.settings = new Settings('settings', this.updateLayerSettings.bind(this));

        this.fretboardIstances = {};
        this.selectedInterval = [];

        this.generateFretboards(input);

        window.onresize = this.resize.bind(this);
    }

    generateFretboards (input) {
        this.header.refs.title.textContent = input.title || 'Add title...';
        this.header.refs.description.value = input.description || 'Add Description...';
        this.header.tags = input.tags || [];
        this.header.renderTags()
        this.header.refs.progress.value = input.progress || 0;
        this.header.setBubbleProgress();
        for (const fret in input.frets) {
            const fretboard = input.frets[fret];
            this.addFretboard(fretboard);
            fretboard.layers.forEach(l => {
                if (l.merge) {
                    this.renderMergedLayer(l);
                } else {
                    this.renderLayer(l);
                }
            })
        }
    }

    getIconPath () {
        let imgNum = Math.floor(Math.random() * 20) + 1;
        if (imgNum > 20) {
            imgNum = imgNum % 20;
        }
        return imgNum;
    }

    backToList (noredirect) {
        let copy = JSON.parse(JSON.stringify(this.fretboardIstances));
        for (const key in copy) {
            const fret = copy[key]; // si rimuove tutto ciò che sarà ricreato dinamicamente
            delete fret.notes;
            delete fret.svgContainer;
            fret.layers.forEach(element => {
                delete element.intervals;
                delete element.reduced;
                delete element.extended;
                delete element.scaleChords;
                delete element.modeNames;
                delete element.fingerings;
                delete element.copynotesVisibility
            });
        }
        state.saveOrUpdate({
            studyId: this.studyId,
            img: this.img || this.getIconPath(),
            title: this.header.refs.title.textContent,
            description: this.header.refs.description.value,
            favourite: this.favourite,
            tags: this.header.tags,
            progress: this.header.refs.progress.value,
            creation: this.creation,
            frets: copy
        });
        if (noredirect && 'cancelable' in noredirect) { // "save" btn or "back to list" btn
            this.app.goTo('list');
        }
    }

    resize () {
        // console.log(window.innerHeight, window.innerWidth);
        this.isSmall = window.innerWidth < 1025;
        if (this.app.currentRoute === 'study') {
            for (const key in this.fretboardIstances) {
                const fretboard = this.fretboardIstances[key];
                if (this.isSmall) {
                    fretboard.set('fretWidth', 40);
                } else {
                    fretboard.set('fretWidth', 50);
                }
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

    addFretboard (input) {
        var temp = document.getElementsByTagName("template")[0];
        var clone = temp.content.cloneNode(true);
        let id = input.id || 'fretboard' + Math.floor(Math.random() * 1000000);
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
        fretboard.querySelector('.scale-toggle-btn').addEventListener('click', (evt) => this.toggleScale.call(this, evt));
        fretboard.querySelector('.scale-play-btn').addEventListener('click', (evt) => this.playScale.call(this, evt));
        fretboard.querySelector('.note-btn').addEventListener('click', (evt) => this.openNoteModal.call(this, evt));
        fretboard.querySelector('.toggle-btn').addEventListener('click', (evt) => this.togglePanel.call(this, evt));

        this.fretboardIstances[id] = Fretboard({
            id: id,
            where: `[data-id='${id}'] .col-output .fret`,
            fretWidth: window.innerWidth < 600 ? 34 : 46,
            fretHeight: input.fretHeight || 32,
            frets: input.frets || window.innerWidth > 1025 ? 15 : 12
        });
        this.fretboardIstances[id].drawBoard();
        this.fretboardIstances[id].layers = [];
        this.fretboardIstances[id].selectedIndex = null;
        this.fretboardIstances[id].visible = input.visible === false ? false : true;
        this.fretboardIstances[id].note = input.note || '',   // testo info 
            fretboard.querySelector(`.note-btn`).innerHTML = this.fretboardIstances[id].note.length > 0 ? '&#128221;' : '&#128196;';

        if (!this.fretboardIstances[id].visible) {
            fretboard.querySelector('.col-output-two').classList.toggle('hide');
            fretboard.querySelector('.col-output').classList.toggle('hide');
            let btn = fretboard.querySelector(`.toggle-btn`)
            btn.innerHTML = this.fretboardIstances[id].visible ? '&#9899;' : '&#9898;';
        }

        fretboard.scrollIntoView({ behavior: 'smooth', block: 'end' });

        // SLIDER RANGE
        const slider = fretboard.querySelector(".slidecontainer .slider");
        const bubble = fretboard.querySelector(".slidecontainer .bubble");
        slider.addEventListener("input", () => {
            this.setBubble(slider, bubble, id);
        });
        this.setBubble(slider, bubble, id);

        return fretboard;
    }

    removeAllFretboard () {
        this.app.confirmModal.style.display = "block";
        this.app.setCallback(this.doRemoveAllFretboard.bind(this));
    }
    doRemoveAllFretboard () {
        let fretboards = document.querySelectorAll('.fretboard-container');
        fretboards.forEach(element => {
            element.remove();           // remove the html element
        });
        this.fretboardIstances = {};    // remove the model
        this.app.confirmModal.style.display = "none";
    }

    removeFretboard (evt) {
        this.app.confirmModal.style.display = "block";
        this.app.setCallback(this.doRemoveFretboard.bind(this, evt));
    }
    doRemoveFretboard (evt) {
        let { parent, id } = this.getParent(evt);
        parent.remove();                    // remove the html element
        delete this.fretboardIstances[id]; // remove the model
        this.app.confirmModal.style.display = "none";
    }

    togglePanel (evt) {
        let { parent, id } = this.getParent(evt);
        this.fretboardIstances[id].visible = !this.fretboardIstances[id].visible;
        parent.querySelector('.col-output-two').classList.toggle('hide');
        parent.querySelector('.col-output').classList.toggle('hide');
        let btn = parent.querySelector(`.toggle-btn`)
        btn.innerHTML = this.fretboardIstances[id].visible ? '&#9899;' : '&#9898;';
    }

    // Input range for transpose
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
                layer.fingerings = generateFingerings(layer);
            }
        }
        let prevLayerId = this.fretboardIstances[id].layers.length > 0 ? this.fretboardIstances[id].layers[0].id : null;
        if (prevLayerId) {
            // updating labels
            parent.querySelectorAll('.scale').forEach((element, index) => {
                element.querySelector('.layer-label').innerHTML = this.fretboardIstances[id].layers[index].value;
            });
            this.selectLayer(evt, prevLayerId, id);
        } else {
            parent.querySelector('.settings-btn').style.visibility = 'hidden';
            parent.querySelector('.scale-info-btn').style.visibility = 'hidden';
            parent.querySelector('.scale-toggle-btn').style.visibility = 'hidden';
            parent.querySelector('.scale-play-btn').style.visibility = 'hidden';
            parent.querySelector('.note-btn').style.visibility = 'hidden';
            let panel = parent.querySelector('.info');
            panel.style.visibility = 'hidden';
            this.fretboardIstances[id].selectedIndex = null;
            this.fretboardIstances[id].repaint();
            this.updateTitle('', id);
            this.updateLayerInfo(null, id);
            this.removeFingeringBtn(parent);
            this.calculateComparison(parent, id);
            this.calculateAssociation(parent, id);
        }
        // resetting range
        const slider = parent.querySelector(".slidecontainer .slider");
        const bubble = parent.querySelector(".slidecontainer .bubble");
        slider.value = '0';
        this.setBubble(slider, bubble);
    }

    playScale (evt) {
        let { id } = this.getParent(evt);
        let index = this.fretboardIstances[id].layers.findIndex(e => e.id === this.fretboardIstances[id].selectedIndex);
        let layer = this.fretboardIstances[id].layers[index];
        let num = layer.fingering === 'all' ? 0 : layer.fingering - 1;
        let sequence = layer.fingerings[num].trim();
        let triplets = sequence.split(" ");
        let notes = [];
        triplets.forEach((triplet) => {
            const [string, note, interval] = triplet.split(":");
            notes.push(note);
        });
        let scaleDIS, scaleASC;
        scaleDIS = notes.splice(0, layer.notes.length + 1);
        scaleASC = scaleDIS.slice(0).reverse();
        scaleASC.shift();
        let scaleToBePlayed = scaleDIS.concat(scaleASC);
        console.log(scaleToBePlayed);
        let time = ac.currentTime + 0.22;
        scaleToBePlayed.forEach(note => {
            // console.log("Scheduling...", note, time);
            this.app.guitarSounds.play(note, time, 0.22);
            time += 0.22;
        });
    }

    toggleScale (evt) {
        let { parent, id } = this.getParent(evt);
        let index = this.fretboardIstances[id].layers.findIndex(e => e.id === this.fretboardIstances[id].selectedIndex);
        let layer = this.fretboardIstances[id].layers[index];
        parent.querySelector('.scale-toggle-btn').innerHTML = layer.type === 'scale' ? '&#127925;' : '&#127926;';
        if (layer.type === 'scale') {
            layer.notesVisibility = layer.intervals.map(e => (e.includes('1') || e.includes('3') || e.includes('5') || e.includes('7')) ? 1 : 0);
            layer.copynotesVisibility = [...layer.notesVisibility];
            layer.notesVisibility = this.transformByFingering(layer.copynotesVisibility, layer.fingering);
            layer.type = 'arpeggio';
        } else {
            layer.notesVisibility = this.getNoteVisibilityRange(layer.notes);
            layer.copynotesVisibility = [...layer.notesVisibility];
            layer.type = 'scale';
        }
        this.fretboardIstances[id].repaint();
        this.updateLayerInfo(layer, id);
    }

    /*  ----------------------------- "MODAL INTERCHANGE" MODAL ----------------------------- */
    openModalInterchange () {
        this.modal_interchange.open();
    }
    /*  ----------------------------- "CIRCLE OF FIFTHS" MODAL ----------------------------- */
    openModalFifth () {
        this.modal_fifths.open();
    }
    /*  -----------------------------     LAYER NOTES MODAL     ----------------------------- */

    openNoteModal (evt) {
        let { id } = this.getParent(evt);
        let data = this.fretboardIstances[id];
        this.modal_note.open(data);
    }

    saveNote (data) {
        this.fretboardIstances[data.id].note = data.note;
        let { parent } = this.getParent(null, data.id);
        parent.querySelector(`.note-btn`).innerHTML = data.note.length > 0 ? '&#128221;' : '&#128196;';
    }

    /*  ----------------------------- COMPARISON PANEL ----------------------------- */

    calculateComparison (parent, id) {
        let index = this.fretboardIstances[id].layers.findIndex(e => e.id === this.fretboardIstances[id].selectedIndex);
        if (index >= 0) {
            this.comparisonTable = parent.querySelector('.col-output-two .comparison-table');
            this.renderComparison(parent, id, index);
        } else {
            this.comparisonTable.innerHTML = '';
        }
    }

    renderComparison (parent, id, index) {
        this.comparisonTable.innerHTML = '';
        let base = this.fretboardIstances[id].layers[index];
        base.intervalsFromSelected = base.intervals;
        let otherThanBase = this.fretboardIstances[id].layers.filter((e, i) => i !== index && e.visible);   // solo le scale visibili
        otherThanBase.forEach(element => {
            element.intervalsFromSelected = element.notes.map(e => Interval.distance(base.root, e))
        });
        console.log('comparison list....', this.fretboardIstances[id].layers, base, otherThanBase);
        this.renderTable([base]);
        this.renderTable(otherThanBase, base);
    }

    renderTable (array, base) {
        for (let i = 0; i < array.length; i++) {
            const row = array[i];
            let intervalRow = document.createElement('tr');
            intervalRow.classList.add('intervals-row');
            intervalRow.innerHTML = `<td></td>` + `${row.intervalsFromSelected.map((e, i) => `<td>${e}</td>`).join('')}`;
            this.comparisonTable.appendChild(intervalRow);
            let notesRow = document.createElement('tr');
            notesRow.classList.add('notes-row');
            let name;
            if (row.merge) {
                name = `${row.startScale} merged with ${row.value}`;
            } else {
                name = row.value;
            }
            notesRow.innerHTML = `<td class="comparison-header">${name}</td>` + `${row.notes.map((e, i) => `<td >${e}</td>`).join('')}`;
            this.comparisonTable.appendChild(notesRow);
        }
        if (base) {
            let rows = this.comparisonTable.querySelectorAll('.notes-row');
            if (rows.length > 1) {
                rows.forEach((row, index) => {
                    if (index) {
                        let notes = row.querySelectorAll('td');
                        notes.forEach((note, i) => {
                            if (i !== 0) {
                                if (!base.notes.includes(note.textContent)) {
                                    note.classList.add('red');
                                }
                            }
                        });
                    }
                });
            }
        }
    }

    /*  ----------------------------- DETAIL FOOTER (CHORDS, REDUCED, EXTENDED) ----------------------------- */

    toggleAssociation (evt) {
        let { parent } = this.getParent(evt);
        let panel = parent.querySelector('.info');
        panel.style.visibility = panel.style.visibility == 'inherit' ? 'hidden' : 'inherit';
    }

    calculateAssociation (parent, id) {
        let index = this.fretboardIstances[id].layers.findIndex(e => e.id === this.fretboardIstances[id].selectedIndex);
        let { extended, scaleChords, reduced, root, value } = this.fretboardIstances[id].layers[index];

        this.chordsList = parent.querySelector('.chords-list');
        this.chords = scaleChords;
        this.renderChords();

        this.reducedList = parent.querySelector('.reduced-list');
        this.renderReduced(reduced, root, id);

        this.extendedList = parent.querySelector('.extended-list');
        this.renderExtended(extended, root, id);
    }

    renderChords () {
        this.chordsList.innerHTML = '';
        if (this.chords) {    // se è mergiato non ha generalemente accordi...
            this.chords.map(item => {
                this.chordsList.innerHTML += `<li>${item}</li>`;
            });
        }
    }

    renderReduced (reduced, root, parentId) {
        this.reducedList.innerHTML = '';
        if (reduced) {
            reduced.map(item => {
                this.reducedList.innerHTML += `<li>${item} <span data-reducedid="${item}"> + </span></li>`;
            });
            document.querySelectorAll('[data-reducedid]').forEach(element => {
                element.addEventListener('click', evt => {
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
    }

    renderExtended (extended, root, parentId) {
        this.extendedList.innerHTML = '';
        if (extended) {
            extended.map(item => {
                this.extendedList.innerHTML += `<li>${item} <span data-extendedid="${item}">+</span></li>`;
            });
            document.querySelectorAll('[data-extendedid]').forEach(element => {
                element.addEventListener('click', evt => {
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
        let id = data.parentId;
        let toBeUpdate = this.fretboardIstances[id].layers.findIndex(e => e.id === data.id);
        this.fretboardIstances[id].layers[toBeUpdate] = Object.assign(this.fretboardIstances[id].layers[toBeUpdate], data);
        this.fretboardIstances[id].repaint();
        this.updateLayerInfo(this.fretboardIstances[id].layers[toBeUpdate], id);
    }

    // callback from modal choice
    save (data) {
        // console.log('Choose modal: ', data);
        let { parent, id } = this.getParent(null, data.parentId);
        data.value = `${data.root} ${data.scale}`;
        if (data.merge) {   // MERGE SCALES
            this.renderMergedLayer(data);
        } else if (data.id) {  // EDIT MODE
            let { notes, intervals } = Scale.get(data.value);
            data.notes = notes.map(e => safeNotes(e));
            data.intervals = intervals;
            data.notesForString = notes.length > 5 ? 3 : 2;
            data.fingerings = generateFingerings(data);
            console.log(`Layer updated ${data.id}`, data);
            const li = parent.querySelector(`[data-id='${data.id}']`);
            li.querySelector('.layer-label').innerHTML = data.value;
            let toBeUpdate = this.fretboardIstances[id].layers.findIndex(e => e.id === data.id);
            this.fretboardIstances[id].layers[toBeUpdate] = Object.assign(this.fretboardIstances[id].layers[toBeUpdate], data);
            this.fretboardIstances[id].repaint();
            this.updateTitle(data.value, id);
            this.updateLayerInfo(this.fretboardIstances[id].layers[toBeUpdate], id);
            this.selectLayer({ target: parent }, data.id, id);  // si seleziona automaticamente
        } else {        // SAVE NEW
            this.renderLayer(data);
        }
    }

    compare (a, b) {
        if (a[0] < b[0]) {
            return -1;
        }
        if (a[0] > b[0]) {
            return 1;
        }
        if (a[1] == 'b') {
            return -1;
        }
        if (b[1] == 'b') {
            return 1;
        }
        if (a[1] == '#') {
            return 1;
        }
        if (b[1] == '#') {
            return -1;
        }
        // a deve essere uguale a b
        return 0;
    }

    getIntervalsOfMerged (notes) {
        let root = notes[0];
        let intervals = [];
        for (let i = 0; i < notes.length; i++) {
            intervals.push(Interval.distance(root, notes[i]));
        }
        return intervals;
    }

    moveToRoot ({ notes, value1 }) {
        let root = value1.split(' ')[0];
        let index = notes.indexOf(root);
        let copy = [...notes];
        let cut = copy.splice(0, index);
        return [...copy, ...cut];
    }

    renderMergedLayer (data) {
        let { parent } = this.getParent(null, data.parentId);
        const list = parent.querySelector('.list');
        const layerId = data.id || Math.floor(Math.random() * 1000000);
        const parentId = data.parentId;
        let li = document.createElement('li');
        li.classList.add('scale');
        li.dataset.id = layerId;
        let label_merged_layer = `${data.startScale} merged with ${data.value}`;
        let visibility = data.visible || data.visible === false ? data.visible : true;
        li.innerHTML = `
            <span class="layer-label">${label_merged_layer}</span>
            <span class="visibility-btn"> ${visibility ? '&#9899;' : '&#9898;'}  </span>
            <span class="delete-btn"> &#128298; </span>
            `;
        list.appendChild(li);
        let toBeAdded = {
            id: layerId,
            parentId: parentId,
            root: data.root,
            scale: data.scale,
            value: data.value,
            value1: data.startScale,
            value2: data.value,
            visible: visibility,
            merge: true,
            tuning: data.tuning,
            type: data.type || 'scale',
            whatToShow: data.whatToShow,
            size: data.size || 1,
            opacity: data.opacity || 1,
            color: data.color || 'many',
            fingering: data.fingering || 'all',
            startScale: data.startScale
        };
        let data1 = Scale.get(toBeAdded.value1);
        let data2 = Scale.get(toBeAdded.value2);
        toBeAdded.notes = mergeArrays(data1.notes.map(e => safeNotes(e)), data2.notes.map(e => safeNotes(e))).sort(this.compare);
        toBeAdded.notes = this.moveToRoot(toBeAdded);
        toBeAdded.notesVisibility = data.notesVisibility || this.getNoteVisibilityRange(toBeAdded.notes),
            toBeAdded.copynotesVisibility = [...toBeAdded.notesVisibility];
        toBeAdded.notesForString = data.notesForString || (toBeAdded.notes.length > 5 ? 3 : 2);
        toBeAdded.intervals = this.getIntervalsOfMerged(toBeAdded.notes);// sono riferiti alla scala di partenza
        toBeAdded.combinedColors = createMergeColors(toBeAdded.notes, data1.notes, data2.notes);
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
        this.selectLayer({ target: parent }, layerId, parentId);  // si seleziona automaticamente
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

    renderLayer (data) {
        let { parent } = this.getParent(null, data.parentId);
        const list = parent.querySelector('.list');
        const layerId = data.id || Math.floor(Math.random() * 1000000);
        const parentId = data.parentId;
        let li = document.createElement('li');
        li.classList.add('scale');
        li.dataset.id = layerId;
        let visibility = data.visible || data.visible === false ? data.visible : true;
        li.innerHTML = `
            <span class="layer-label">${data.value}</span>
            <span class="visibility-btn"> ${visibility ? '&#9899;' : '&#9898;'} </span>
            <div class="dropdown">
                <div class="dropbtn">&#128296;</div>
                <div class="dropdown-content">
                <span class="edit-btn"> &#128295; Edit</span>
                <span class="delete-btn"> &#128298; Delete</span>
                <span class="merge-btn"> &#128279; Merge with </span>
                <span class="clone-btn"> &#128108; Clone </span>
                <span class="move-btn"> &#127381; Make new fret with</span>
                </div>
            </div>`;
        list.appendChild(li);
        let { notes, intervals } = Scale.get(data.value);
        notes = notes.map(e => safeNotes(e));
        let toBeAdded = {
            id: layerId,
            parentId: parentId,
            root: data.root,
            scale: data.scale,
            value: data.value,
            notes: notes,
            intervals: intervals,
            visible: visibility,
            notesVisibility: data.notesVisibility || this.getNoteVisibilityRange(notes),
            tuning: data.tuning,
            type: data.type || 'scale',
            whatToShow: data.whatToShow,
            size: data.size || 1,
            opacity: data.opacity || 1,
            color: data.color || 'many',
            notesForString: data.notesForString || (notes.length > 5 ? 3 : 2),
            fingering: data.fingering || 'all',
            reduced: this.checkScale(Scale.reduced(data.scale)),
            extended: this.checkScale(Scale.extended(data.scale)),
            scaleChords: Scale.scaleChords(data.scale),
            modeNames: Scale.modeNames(data.scale)
        };
        toBeAdded.fingerings = generateFingerings(toBeAdded);
        toBeAdded.copynotesVisibility = [...toBeAdded.notesVisibility];
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
        li.querySelector('.clone-btn').addEventListener('click', () => {
            this.cloneLayer(toBeAdded);
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
        li.querySelector('.move-btn').addEventListener('click', (event) => {
            this.makeNewFretWith(event, layerId, parentId);
        });
        this.selectLayer({ target: parent }, layerId, parentId);  // si seleziona automaticamente quando si aggiunge
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
            arpeggio: 'min7',         // deprecated
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
            degrees.innerHTML = info.intervals.map((e, i) => `<td class="${info.copynotesVisibility[i] ? '' : 'disabled'}">${e}</td>`).join('');
            noteNames.innerHTML = info.notes.map((e, i) => `<td class="label-notes ${info.copynotesVisibility[i] ? '' : 'disabled'}">${e}</td>`).join('');
            for (let i = 0; i < noteNames.children.length; i++) {
                const elementN = noteNames.children[i];
                elementN.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.fretboardIstances[id].updateLayer(i, info.id);
                    elementN.classList.toggle('disabled');
                    elementD.classList.toggle('disabled');
                });
                const elementD = degrees.children[i];
                elementD.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.fretboardIstances[id].updateLayer(i, info.id);
                    elementN.classList.toggle('disabled');
                    elementD.classList.toggle('disabled');
                });
            }
        } else {
            degrees.innerHTML = '';
            noteNames.innerHTML = '';
        }
    }

    removeLayers (evt) {
        this.app.confirmModal.style.display = "block";
        this.app.setCallback(this.doRemoveLayers.bind(this, evt));
    }
    doRemoveLayers (evt) {
        let { parent, id } = this.getParent(evt);
        const list = parent.querySelector('.list');
        while (list.hasChildNodes()) {
            list.removeChild(list.firstChild);
        }
        this.fretboardIstances[id].clearNotes();
        this.fretboardIstances[id].layers = [];
        this.fretboardIstances[id].selectedIndex = null;
        this.updateTitle('', parent.dataset.id);
        this.updateLayerInfo(null, parent.dataset.id);
        this.removeFingeringBtn(parent);
        parent.querySelector('.settings-btn').style.visibility = 'hidden';
        parent.querySelector('.scale-info-btn').style.visibility = 'hidden';
        parent.querySelector('.scale-toggle-btn').style.visibility = 'hidden';
        parent.querySelector('.scale-play-btn').style.visibility = 'hidden';
        parent.querySelector('.note-btn').style.visibility = 'hidden';
        this.calculateComparison(parent, id);
        this.app.confirmModal.style.display = "none";
    }

    editLayer (evt, layerId) {
        let { id } = this.getParent(evt);
        let selected = this.fretboardIstances[id].layers.find(e => e.id === layerId);
        selected.title = 'Edit layer';
        selected.action = 'Update &#128076;';
        this.modal.open(selected);
    }

    cloneLayer (base) {
        let copy = Object.assign({}, base);
        delete copy.id;
        this.renderLayer(copy);
    }

    mergeLayer (evt, layerId) {
        let { id } = this.getParent(evt);
        let selected = Object.assign({}, this.fretboardIstances[id].layers.find(e => e.id === layerId));
        selected.title = 'Merge layer';
        selected.action = 'Merge &#128076;';
        selected.merge = true;
        selected.startScale = selected.value;
        delete selected.id;
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

    deleteLayer (evt, layerId, parentId) {
        let { parent } = this.getParent(evt);
        let layer = document.querySelector(`[data-id='${layerId}']`);
        layer.parentNode.removeChild(layer)
        this.fretboardIstances[parentId].layers = this.fretboardIstances[parentId].layers.filter(s => s.id !== layerId);
        let prevLayerId = this.fretboardIstances[parentId].layers.length > 0 ? this.fretboardIstances[parentId].layers[0].id : null;
        if (prevLayerId) {
            this.selectLayer(evt, prevLayerId, parentId);
        } else {
            parent.querySelector('.settings-btn').style.visibility = 'hidden';
            parent.querySelector('.scale-info-btn').style.visibility = 'hidden';
            parent.querySelector('.scale-toggle-btn').style.visibility = 'hidden';
            parent.querySelector('.scale-play-btn').style.visibility = 'hidden';
            parent.querySelector('.note-btn').style.visibility = 'hidden';
            let panel = parent.querySelector('.info');
            panel.style.visibility = 'hidden';
            this.fretboardIstances[parentId].selectedIndex = null;
            this.fretboardIstances[parentId].repaint();
            this.updateTitle('', parentId);
            this.updateLayerInfo(null, parentId);
            this.removeFingeringBtn(parent);
            this.calculateComparison(parent, parentId);
        }
    }

    makeNewFretWith (evt, id, parentId) {
        let theOneToReplicate = Object.assign({}, this.fretboardIstances[parentId].layers.find(s => s.id === id));
        let fretboard = this.addFretboard({});
        delete theOneToReplicate.id;    // fresh new layer
        theOneToReplicate.parentId = fretboard.dataset.id;  // in the new parent fret
        this.renderLayer(theOneToReplicate);
    }

    selectLayer (event, id, parentId) {
        let { parent } = this.getParent(null, parentId);
        this.fretboardIstances[parentId].selectedIndex = id; // id del layer
        // BTN
        parent.querySelector('.settings-btn').style.visibility = 'inherit';
        parent.querySelector('.scale-info-btn').style.visibility = 'inherit';
        parent.querySelector('.scale-toggle-btn').style.visibility = 'inherit';
        parent.querySelector('.scale-play-btn').style.visibility = 'inherit';
        parent.querySelector('.note-btn').style.visibility = 'inherit';

        parent.querySelectorAll('.scale').forEach(element => {
            element.classList.remove('selected');
        });
        let li = parent.querySelector(`[data-id='${id}']`);
        li.classList.add('selected');
        let index = this.fretboardIstances[parentId].layers.findIndex(e => e.id === id);
        let selected = this.fretboardIstances[parentId].layers.splice(index, 1)[0];
        this.fretboardIstances[parentId].layers.forEach(layer => {
            layer.color = 'one';
            layer.opacity = 0.25;
        });
        selected.color = 'many';
        selected.opacity = 1;
        this.fretboardIstances[parentId].layers.push(selected);
        if (selected.merge) {
            let title = `${selected.startScale} merged with ${selected.value}`;
            this.updateTitle(title, parentId);
        } else {
            this.updateTitle(selected.value, parentId);
        }
        this.updateLayerInfo(selected, parentId);
        this.updateFingeringBtns(parent, parentId, selected);
        this.calculateAssociation(parent, parentId);
        this.calculateComparison(parent, parentId);
        this.fretboardIstances[parentId].repaint();
    }

    updateFingeringBtns (parent, parentId, data) {
        let a = 0;
        let list = data.notes.map(() => {
            a++;
            return a
        });
        let listOfOptions = [2, 3, 4];
        list.unshift('All');
        let fingeringList = parent.querySelector('.fingering-list');
        let optionsFingering = parent.querySelector('.options-fingering');
        fingeringList.innerHTML = list.map(e => `<span class="fingering-item">${e}</span>`).join('');
        fingeringList.children[data.fingering === 'all' ? 0 : data.fingering].classList.add('selected');

        optionsFingering.innerHTML = listOfOptions.map(e => `<span class="fingering-item" data-id="${e}"> ${e} </span>`).join('|') + 'nps';

        for (let option of optionsFingering.children) {
            if (Number(option.dataset.id) === data.notesForString) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        }

        if (data.fingering !== 'all') {
            this.fretboardIstances[parentId].repaint();
        }

        // EVENTS for options of fingering  (2,3,4 notes for string)
        for (let i = 0; i < optionsFingering.children.length; i++) {
            const option = optionsFingering.children[i];
            option.addEventListener('click', (event) => {
                event.stopPropagation();
                for (let item of optionsFingering.children) {
                    item.classList.remove('selected');
                }
                option.classList.toggle('selected');
                data.notesForString = Number(option.dataset.id);
                data.fingerings = generateFingerings(data);
                this.fretboardIstances[parentId].repaint();
            });
        }

        // EVENTS for what number of fingering
        for (let i = 0; i < fingeringList.children.length; i++) {
            const fingering = fingeringList.children[i];
            fingering.addEventListener('mouseenter', (event) => {
                event.stopPropagation();
                for (let item of fingeringList.children) {
                    item.classList.remove('selected');
                }
                fingering.classList.toggle('selected');
                data.fingering = i === 0 ? 'all' : i;
                data.notesVisibility = this.transformByFingering(data.copynotesVisibility, data.fingering);
                this.fretboardIstances[parentId].repaint();
            });
        }
    }

    transformByFingering (arr, fingering) {
        fingering = fingering === 'all' ? 0 : fingering - 1;
        let copy = [...arr];
        let cut = copy.splice(0, fingering);
        return [...copy, ...cut];
    }

    removeFingeringBtn (parent) {
        parent.querySelector('.fingering-list').innerHTML = '';
    }

    updateTitle (title, parentId) {
        document.querySelector(`[data-id='${parentId}'] .col-output .scale-title`).innerHTML = title;
    }
}