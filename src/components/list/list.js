import "./list.scss";
import template from './list.html'

export default class List {

    constructor(items) {
        this.body = document.body;
        this.body.innerHTML = `${template}`;

        this.list = items;
        this.generateItems();

        this.theme = document.querySelector('.theme');
        this.theme.addEventListener('click', this.toggleTheme.bind(this));
    }

    generateItems () {
        this.list.forEach(el => {
            this.addStudy(el);
        });
    }

    getParent (evt) {
        let parent = evt.target.closest("[data-id*='study']");
        return { parent, id: parent.dataset.id };
    }

    toggleTheme () {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            this.theme.innerHTML = '&#127773;'
        } else {
            document.body.classList.add('dark-theme');
            this.theme.innerHTML = '&#127770;'
        }
    }

    addStudy (input) {
        var temp = document.getElementsByTagName("template")[0];
        var clone = temp.content.cloneNode(true);
        let id = input.id || 'study' + Math.floor(Math.random() * 1000000);
        clone.firstElementChild.dataset.id = id;

        document.querySelector('.study-list').appendChild(clone);

        let study = document.querySelector(`[data-id='${id}']`);

        // Find all refs in component
        study.refs = {}
        const refElems = document.body.querySelectorAll('[ref]')
        refElems.forEach((elem) => { study.refs[elem.getAttribute('ref')] = elem })

        study.refs.title.textContent = input.title;
        study.refs.date.textContent = input.date;
        study.refs.favourite.innerHTML = input.favourite ? '&#128150;' : '&#128420;';

        // EVENTS
        study.querySelector('.study-favourite-btn').addEventListener('click', (evt) => this.toggleFavourite.call(this, evt));
        study.querySelector('.study-delete-btn').addEventListener('click', (evt) => this.removeStudy.call(this, evt));

        study.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    toggleFavourite (evt) {
        let { parent, id } = this.getParent(evt);
        let index = this.list.findIndex(e => e.id === id);
        this.list[index].favourite = !this.list[index].favourite;
        event.target.innerHTML = this.list[index].favourite ? '&#128150;' : '&#128420;';
    }

    removeStudy (evt) {
        let { parent, id } = this.getParent(evt);
        let index = this.list.findIndex(e => e.id === id);
        this.list.splice(index, 1);
        parent.remove()
    }

}