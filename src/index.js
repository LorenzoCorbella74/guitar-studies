import "./styles.css";

// Components
import MyFretboard from './components/fretboard/fretboard';
import List from './components/list/list';

class App {
    constructor() {
        this.goTo('list'); // list as default
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

