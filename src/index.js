import "./styles.css";

// Components
import MyFretboard from './components/fretboard/fretboard';
import List from './components/list/list';


window.onload = () => {
    new App();
}

class App {
    constructor() {
        this.changeRoute('list'); // loading the list as default
    }

    changeRoute (where, data) {
        if (where === 'list') {
            this.currentRoute = 'list';
            new List(this);
        } else if (where === 'study') {
            this.currentRoute = 'study';
            new MyFretboard(this, data);
        }
    }
}

