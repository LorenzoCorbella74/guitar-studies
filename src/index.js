import "./styles.css";
import "./styles.scss";

import { Fretboard } from './engine';

window.onload = function () {

    class App {

        constructor() {
            this.body = document.body;
            this.body.innerHTML = `
            <div class="container">
                <!-- LAYERS -->
                <div class="layers">
                    <input id="input" type="text" placeholder="Add scale...">
                        <button id="add-btn"> + </button>
                        <button id="remove-btn"> x </button>
                        <ul id="list"></ul>
                </div>
                    <div id="output">
                        <div class="scale-info">
                            <h3 class="scale-title"></h3>
                        </div>
                        <!-- FRETBOARD -->
                </div>
                    <!-- SLIDER -->
                <div id="slider">

                </div>
            </div>`;

            this.guitar = Fretboard({
                where: "#output",
                frets: 12,
                //tuning: fretboard.Tunings.guitar6.Drop_D,
            });
            this.guitar.drawBoard();
            this.scales = [];

            // Bindings
            document.getElementById('add-btn').addEventListener('click', this.addScale.bind(this));
            document.getElementById('remove-btn').addEventListener('click', this.removeScales.bind(this));
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
            this.scales.push({ id: id, value: input.value, visible: true });
            this.guitar.add(input.value);
            this.guitar.paint();
            input.value = '';
            li.querySelector('.scale-txt').addEventListener('click', (event) => {
                this.selectScale(event, id);
            });
            li.querySelector('.visibility-btn').addEventListener('click', (event) => {
                this.toggleVisibility(event, id);
            });
            li.querySelector('.delete-btn').addEventListener('click', (event) => {
                this.deleteScale(event, id);
            });
        }

        removeScales(event) {
            event.stopPropagation();
            const list = document.getElementById('list');
            while (list.hasChildNodes()) {
                list.removeChild(list.firstChild);
            }
            this.guitar.clearNotes();
            this.scales = [];
            this.updateTitle('');
        }

        toggleVisibility(event, id) {
            event.stopPropagation();
            let selected = this.scales.find(e => e.id === id)
            selected.visible = !selected.visible;
            let li = document.getElementById(id)
            li.querySelector('.visibility-btn').textContent = selected.visible ? 'o' : '-';
            this.guitar.repaint(this.scales);
        }

        deleteScale(event, id) {
            event.stopPropagation();
            let elem = document.getElementById(id);
            elem.parentNode.removeChild(elem)
            this.scales = this.scales.filter(s => s.id !== id);
            this.guitar.repaint(this.scales);
        }

        selectScale(event, id) {
            event.stopPropagation();
            document.querySelectorAll('.scale').forEach(element => {
                element.classList.remove('selected');
            });
            let li = document.getElementById(id);
            li.classList.add('selected');
            let index = this.scales.findIndex(e => e.id === id);
            let selected = this.scales.splice(index, 1)[0];
            this.scales.push(selected);
            this.updateTitle(selected.value);
            this.guitar.repaint(this.scales);
        }

        updateTitle(title) {
            let output = document.querySelector('#output .scale-title')
            output.innerHTML = title;
        }
    }

    new App();
}

