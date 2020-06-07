import "./styles.css";

// Components
import MyFretboard from './components/fretboard/fretboard';
import List from './components/list/list';

import Soundfont from 'soundfont-player';

export const ac = new AudioContext();

class App {
    constructor() {
        this.start();
        this.guitarSounds = null;
    }

    start () {
        document.body.innerHTML = `
            <div id="loading-container">
                <h1>Guitar studies</h1>
                <h4>Loading sounds</h4>
            </div>`;

        Soundfont.instrument(ac, 'acoustic_guitar_steel').then( guitarDownloaded => { 
            this.guitarSounds = guitarDownloaded;
            this.goTo('list'); // list as default
        });
    }

    goTo (where, data) {
        if (where === 'list') {
            this.currentRoute = 'list';
            new List(this);
        } else if (where === 'study') {
            this.currentRoute = 'study';
            new MyFretboard(this, data);
        }
    }
}

window.onload = () => {
    new App();
}

