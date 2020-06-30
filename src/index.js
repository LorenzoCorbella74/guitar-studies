import "./styles.scss";
import template from './index.html';

// Components
import MyFretboard from './components/fretboard/fretboard';
import List from './components/list/list';

// SOUNDS
import Soundfont from 'soundfont-player';
export const ac = new AudioContext();

class App {
    constructor() {

        // SOUNDS
        this.guitarSounds = null;
        this.ambientSounds = null;

        // SETTINGS
        if (localStorage.getItem('dark-theme')) {
            document.body.classList.add('dark-theme');
        }
        let guitar_style = localStorage.getItem('fretboard-theme');
        if (guitar_style) {
            document.body.classList.add(`${guitar_style}-style`);
        } else {
            document.body.classList.add('default-style');
        }

        this.start();
    }

    start () {
        document.body.innerHTML = `${template}`;

        this.spinner = document.querySelector('#loading-container h4');

        this.confirmModal = document.getElementById('confirm-modal');
        // "no" event
        this.confirmModal.querySelector('.close-confirm').addEventListener('click', (evt) => {
            evt.stopPropagation();
            this.confirmModal.style.display = "none";
        })
        // "ok" event
        this.confirmModal.callback = () => null;
        this.confirmModal.querySelector('.save-confirm').addEventListener('click', (evt) => {
            evt.stopPropagation();
            this.confirmModal.callback();
        })

        this.spinner.textContent = 'Loading ambient sounds';
        Soundfont.instrument(ac, 'electric_piano_1').then(ambientSoundDownloaded => {   // electric_grand_piano , pad_2_warm, electric_piano_1 pad_1_new_age
            this.ambientSounds = ambientSoundDownloaded;
            this.spinner.textContent = 'Loading guitar sounds';
            console.log('Ambient: ', this.ambientSounds);
            Soundfont.instrument(ac, 'acoustic_guitar_steel').then(guitarDownloaded => {
                this.guitarSounds = guitarDownloaded;
                this.spinner.textContent = 'Loading percussion sounds';
                Soundfont.instrument(ac, 'percussion',{ soundfont: 'FluidR3_GM' }).then(percussionDownloaded => {  // steel_drums, percussion
                    this.drumSounds = percussionDownloaded;
                    this.goTo('list'); // list as default
                });
            });
            
        });

    }

    setCallback (callback) {
        this.confirmModal.callback = callback;
    }

    goTo (where, data) {
        document.body.classList.add('fade');
        if (where === 'list') {
            this.currentRoute = 'list';
            new List(this);
        } else if (where === 'study') {
            this.currentRoute = 'study';
            new MyFretboard(this, data);
        }
        document.body.classList.remove('fade');
    }
}

window.onload = () => {
    new App();
}

