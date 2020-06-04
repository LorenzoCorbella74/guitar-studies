import "./list.scss";
import template from './list.html';

import { state } from '../../index';

export default class List {

    constructor(app) {
        this.body = document.body;
        this.body.innerHTML = `${template}`;

        this.app = app;
        this.list = state;
        this.generateItems();

        this.theme = document.querySelector('.theme');
        this.theme.addEventListener('click', this.toggleTheme.bind(this));
        document.querySelector('.add-study').addEventListener('click', this.addStudy.bind(this));
    }

    generateItems () {
        this.list.forEach(el => {
            this.renderStudy(el);
        });
    }

    getParent (evt) {
        let parent = evt.target.closest("[data-id]");
        return { parent, id: Number(parent.dataset.id) };
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

    renderDate (date) {
        let year = date.getFullYear();
        let month = (1 + date.getMonth()).toString();
        month = month.length > 1 ? month : '0' + month;
        let day = date.getDate().toString();
        day = day.length > 1 ? day : '0' + day;
        return `${month}/${day}/${year}`;
    }

    renderStudy (input) {
        var temp = document.getElementsByTagName("template")[0];
        var clone = temp.content.cloneNode(true);
        let id = input.studyId || 'study' + Math.floor(Math.random() * 1000000);
        clone.firstElementChild.dataset.id = id;

        document.querySelector('.study-list').appendChild(clone);

        let study = document.querySelector(`[data-id='${id}']`);

        // Find all refs in component
        study.refs = {}
        const refElems = document.body.querySelectorAll('[ref]')
        refElems.forEach((elem) => { study.refs[elem.getAttribute('ref')] = elem })

        study.refs.title.textContent = input.title;
        study.refs.date.textContent = this.renderDate(input.creation);
        study.refs.favourite.innerHTML = input.favourite ? '&#128150;' : '&#128420;';

        // EVENTS
        study.querySelector('.study-info').addEventListener('click', (evt) => this.openStudy.call(this, evt));
        study.querySelector('.study-favourite-btn').addEventListener('click', (evt) => this.toggleFavourite.call(this, evt));
        study.querySelector('.study-delete-btn').addEventListener('click', (evt) => this.removeStudy.call(this, evt));

        study.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    toggleFavourite (evt) {
        let { parent, id } = this.getParent(evt);
        let index = this.list.findIndex(e => e.studyId === id);
        this.list[index].favourite = !this.list[index].favourite;
        event.target.innerHTML = this.list[index].favourite ? '&#128150;' : '&#128420;';
    }

    removeStudy (evt) {
        let { parent, id } = this.getParent(evt);
        let index = this.list.findIndex(e => e.studyId === id);
        this.list.splice(index, 1);
        parent.remove()
    }

    openStudy (evt) {
        let { id } = this.getParent(evt);
        let index = this.list.findIndex(e => e.studyId === id);
        this.app.changeRoute('study', this.list[index]);
    }

    addStudy (evt) {
        this.app.changeRoute('study', {});
    }

}