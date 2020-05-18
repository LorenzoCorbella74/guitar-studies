import "./styles.css";
import "./styles.scss";
import template from './index.html'

import { Fretboard, asNotes } from './engine';

import { Chord, Distance, Scale } from "@tonaljs/tonal";

window.onload = function () {

    class App {

        constructor() {
            this.body = document.body;
            this.body.innerHTML = `${template}`;

            this.guitar = Fretboard({
                where: "#output",
                frets: 12,
                //tuning: fretboard.Tunings.guitar6.Drop_D,
            });
            this.guitar.drawBoard();
            this.guitar.scales = [];

            // Bindings
            document.getElementById('add-btn').addEventListener('click', this.addScale.bind(this));
            document.getElementById('remove-btn').addEventListener('click', this.removeScales.bind(this));

            window.onresize = this.resize.bind(this);
        }

        resize() {
            // console.log(window.innerHeight, window.innerWidth);
            this.isSmall = window.innerWidth < 800;
            if (this.isSmall) {
                this.guitar.set('fretWidth', 40);
            } else {
                this.guitar.set('fretWidth', 50);
            }
        }

        getNoteVisibilityRange(scale) {
            let notes = asNotes(scale);
            notes = notes.split(' ');
            return notes.map(e => 1);
        }

        addScale(event) {
            event.stopPropagation();
            const input = document.getElementById('input');
            const list = document.getElementById('list');
            const id = Math.floor(Math.random() * 1000000);
            let li = document.createElement('li');
            li.classList.add('scale');
            li.id = id;
            li.innerHTML = `
                <span class="scale-txt">${input.value}</span>
                <span class="visibility-btn"> o </span>
                <span class="delete-btn"> x </span>
                `;
            list.appendChild(li);
            let toBeAdded = {
                id: id,
                value: input.value,
                visible: true,
                notesVisibility: this.getNoteVisibilityRange(input.value)
            };
            this.guitar.scales.push(toBeAdded);
            this.guitar.add(input.value);
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
            this.updateTitle(input.value);
            this.updateLayerInfo(toBeAdded);
            input.value = '';
        }

        updateLayerInfo(info) {
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
                        this.guitar.updateLayer(i, scale);
                        elementN.classList.toggle('disabled');
                        elementD.classList.toggle('disabled');
                    });
                    const elementD = degrees.children[i];
                    elementD.addEventListener('click', (event) => {
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

        removeScales(event) {
            event.stopPropagation();
            const list = document.getElementById('list');
            while (list.hasChildNodes()) {
                list.removeChild(list.firstChild);
            }
            this.guitar.clearNotes();
            this.guitar.scales = [];
            this.updateTitle('');
            this.updateLayerInfo();
        }

        toggleVisibility(event, id) {
            event.stopPropagation();
            let selected = this.guitar.scales.find(e => e.id === id)
            selected.visible = !selected.visible;
            let li = document.getElementById(id)
            li.querySelector('.visibility-btn').textContent = selected.visible ? 'o' : '-';
            this.guitar.repaint();
        }

        deleteScale(event, id) {
            event.stopPropagation();
            let elem = document.getElementById(id);
            elem.parentNode.removeChild(elem)
            this.guitar.scales = this.guitar.scales.filter(s => s.id !== id);
            this.guitar.repaint();
            this.updateTitle('');
            this.updateLayerInfo();
        }

        selectScale(event, id) {
            event.stopPropagation();
            document.querySelectorAll('.scale').forEach(element => {
                element.classList.remove('selected');
            });
            let li = document.getElementById(id);
            li.classList.add('selected');
            let index = this.guitar.scales.findIndex(e => e.id === id);
            let selected = this.guitar.scales.splice(index, 1)[0];
            this.guitar.scales.push(selected);
            this.updateTitle(selected.value);
            this.updateLayerInfo(selected);
            this.guitar.repaint();
        }

        updateTitle(title) {
            let output = document.querySelector('#output .scale-title')
            output.innerHTML = title;
        }
    }

    new App();
}

