import "./list.scss";
import template from './list.html';

import { APP_VERSION } from '../../constants';

import state from '../../state';

export default class List {

    constructor(app) {
        this.body = document.body;
        this.body.innerHTML = `${template}`;

        this.app = app;
        this.list = state.getState();
        this.generateItems();

        // Turn the theme of if the 'dark-theme' key exists in localStorage
        if (localStorage.getItem('dark-theme')) {
            document.body.classList.add('dark-theme');
        }

        // events
        document.querySelector('.save').addEventListener('click', this.save.bind(this));
        document.querySelector('.import').addEventListener('click', this.import.bind(this));
        this.theme = document.querySelector('.theme');
        this.theme.addEventListener('click', this.toggleTheme.bind(this));
        document.querySelector('.add-study').addEventListener('click', this.addStudy.bind(this));
    }

    save () {
        let output = {
            ver: APP_VERSION,
            date: this.renderDate(new Date()),
            data: this.list
        }
        let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(output));
        let dlAnchorElem = document.getElementById('downloadAnchorElem');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `frets_${this.renderDate(new Date())}.json`); // ``
        dlAnchorElem.click();
    }

    import () {
        let input = document.getElementById('file-input');
        input.onchange = e => {
            // getting a hold of the file reference
            var file = e.target.files[0];
            // setting up the reader
            var reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            // here we tell the reader what to do when it's done reading...
            reader.onload = readerEvent => {
                var content = readerEvent.target.result; // this is the content!
                try {
                    let parsed = JSON.parse(content)
                    state.forceSetState(parsed.data);
                    this.list = state.getState();
                    document.querySelector('.study-list').innerHTML = '';
                    this.generateItems();
                } catch (error) {
                    console.log('Was not possible to import the file!')
                }
            }
        }
        input.click();
    }

    generateItems () {
        this.list.forEach((el, i) => {
            this.renderStudy(el, i);
        });
    }

    getParent (evt) {
        let parent = evt.target.closest("[data-id]");
        return { parent, id: Number(parent.dataset.id) };
    }

    toggleTheme () {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            localStorage.removeItem('dark-theme');
            this.theme.innerHTML = '&#127773;'
        } else {
            document.body.classList.add('dark-theme');
            this.theme.innerHTML = '&#127770;'
            localStorage.setItem('dark-theme', true);
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

    getIconPath (num) {
        let imgNum = Number(num) + 1;
        if (imgNum > 20) {
            imgNum = imgNum % 20;
        }
        return imgNum;
    }

    checkDate (date) {
        if (Object.prototype.toString.call(date) === '[object Date]') {
            return date
        } else {
            return new Date(date);
        }
    }

    renderStudy (input, i) {
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
        study.refs.date.textContent = this.renderDate(this.checkDate(input.creation));
        study.refs.favourite.innerHTML = input.favourite ? '&#128150;' : '&#128420;';

        let studyImg = input.img || this.getIconPath(i);
        import(`../../img/guitar${studyImg}.jpeg`).then(img => {
            study.style.backgroundImage = `url(${img.default})`;
            this.list[i].img = studyImg;
        });

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
        state.forceSetState(this.list);
    }

    removeStudy (evt) {
        let { parent, id } = this.getParent(evt);
        let index = this.list.findIndex(e => e.studyId === id);
        this.list.splice(index, 1);
        parent.remove();
        state.forceSetState(this.list);
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