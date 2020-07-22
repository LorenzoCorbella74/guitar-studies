import "./list.scss";
import template from './list.html';

import { APP_VERSION } from '../../constants';

import State from '../../state';

import firebase from 'firebase';

const NOITEMS = `
<div class="no-items">
    <h2>Press the &#127381; buttom and add your first study...</h2>
</div>`;

export default class List {

    constructor(app) {
        document.getElementById('loading-container').classList.add('hide');
        this.body = document.getElementById('content');
        this.body.innerHTML = `${template}`;

        this.app = app;
        this.app.state = new State(this.app);

        this.loader = document.getElementById('loader');

        this.loadStudies();

        this.favouriteFlag = true;

        // events
        document.querySelector('.export').addEventListener('click', this.export.bind(this));
        document.querySelector('.import').addEventListener('click', this.import.bind(this));
        document.querySelector('.logout').addEventListener('click', this.logout.bind(this));
        document.querySelector('.about').addEventListener('click', this.about.bind(this));
        this.theme = document.querySelector('.theme');
        this.theme.addEventListener('click', this.toggleTheme.bind(this));
        document.querySelector('.add-study').addEventListener('click', this.addStudy.bind(this));
        document.querySelector('.order-by-date').addEventListener('click', this.orderByDate.bind(this));
        document.querySelector('.order-by-progress').addEventListener('click', this.orderByProgress.bind(this));
        document.querySelector('.study-favourite-filter').addEventListener('click', this.filterFavourite.bind(this));
        document.querySelector('.search').addEventListener('input', (evt) => this.search.call(this, evt));

        document.getElementsByClassName("layers-bpm")[0].addEventListener('change', (evt) => {
            this.app.layerBpm = evt.target.value;
            localStorage.setItem('layers-bpm', evt.target.value);
        });

        let layerBpm = localStorage.getItem('layers-bpm');
        if (layerBpm) {
            document.getElementsByClassName("layers-bpm")[0].value = layerBpm;
            this.app.layerBpm = layerBpm;
        } else {
            document.getElementsByClassName("layers-bpm")[0].value = 60;
            this.app.layerBpm = 60;
        }

        let guitar_style = localStorage.getItem('fretboard-theme');
        for (let item of document.querySelector('.fretboard-style-theme').children) {
            if (item.dataset.style === guitar_style) {
                item.classList.add('selected-theme');
                break;
            }
        }

        document.querySelectorAll('.fretboard-style-theme .dot').forEach(element => {
            element.addEventListener('click', (evt) => {
                for (let item of document.querySelector('.fretboard-style-theme').children) {
                    item.classList.remove('selected-theme');
                }
                element.classList.toggle('selected-theme');
                this.setTheme(evt.target.dataset.style)
            });
        });
    }

    about(){
        this.app.aboutModal.style.display = "block";
    }

    loadStudies () {
        this.loader.classList.remove('hide');
        this.app.state
            .getState()
            .then((studies) => {
                this.list = studies;
                this.listToBeDisplayed = this.list; // lista da filtrare
                this.loader.classList.add('hide');
                this.generateItems();
            })
            .catch(error => {
                this.loader.classList.add('hide');
                alert('Error getting studies: ', error);
            });
    }

    logout () {
        this.isLoading = true;
        firebase
            .auth()
            .signOut()
            .then(() => {
                console.log('User logged out!');
                this.app.user = null;
                this.app.authenticated = false;
                this.isLoading = false;
                this.app.goTo('login');
            });
    }

    setTheme (theme) {
        let classes = document.body.classList.value;
        let match = classes.match(/\w+-style/g);
        document.body.classList.remove(match);
        localStorage.removeItem('fretboard-theme');
        document.body.classList.add(`${theme}-style`);
        localStorage.setItem('fretboard-theme', theme);
    }

    orderByDate () {
        document.querySelector('.study-list').innerHTML = '';
        this.listToBeDisplayed = this.list.sort((a, b) => {
            let dateA = new Date(a.creation);
            let dateB = new Date(b.creation);
            return dateA.getTime() - dateB.getTime();
        });
        this.generateItems();
    }

    orderByProgress () {
        document.querySelector('.study-list').innerHTML = '';
        this.listToBeDisplayed = this.list.sort((a, b) => a.progress - b.progress);
        this.generateItems();
    }

    filterFavourite () {
        document.querySelector('.study-list').innerHTML = '';
        this.listToBeDisplayed = this.list.filter(item => item.favourite === this.favouriteFlag);
        this.favouriteFlag = !this.favouriteFlag;
        document.querySelector('.study-favourite-filter').innerHTML = this.favouriteFlag ? '&#128150;' : '&#128420;';
        this.generateItems();
    }

    search (evt) {
        let text = evt.target.value.toLowerCase();
        document.querySelector('.study-list').innerHTML = '';
        this.listToBeDisplayed = this.list.filter(e => (e.title.toLowerCase().includes(text) || e.description.toLowerCase().includes(text) || e.tags.some(e => e.toLowerCase().includes(text))));
        this.generateItems();
    }

    export () {
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
                    this.loader.classList.remove('hide');
                    document.querySelector('.study-list').innerHTML = '';
                    let parsed = JSON.parse(content);
                    // 1) si cancellano su firestore tutti gli item dell'utente
                    this.app.state.db.get()
                        .then(res => {
                            res.forEach(element => {
                                // si cancellano solo i documenti legati ad un utente
                                if(element.data().userId ===this.app.user.user.uid){   
                                    element.ref.delete();
                                }
                            });
                            let promises = [];
                            // 2) Si fa un salvatagio per ogni item...
                            parsed.data.forEach(element => {
                                promises.push(this.app.state.set(element));  
                            });
                            Promise.all(promises).then(() => {
                                this.loadStudies();
                                this.loader.classList.add('hide');
                            });

                        });
                } catch (error) {
                    this.loader.classList.add('hide');
                    console.log('Was not possible to import the file!')
                }
            }
        }
        input.click();
    }

    generateItems () {
        document.querySelector('.study-list').innerHTML = '';
        this.listToBeDisplayed.forEach((el, i) => {
            this.renderStudy(el, i);
        });
        if (this.listToBeDisplayed.length === 0) {
            document.querySelector('.study-list').innerHTML = NOITEMS;
        }
    }

    getParent (evt) {
        let parent = evt.target.closest("[data-id]");
        return { parent, id: Number(parent.dataset.id) };
    }

    toggleTheme () {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            localStorage.removeItem('dark-theme');
            this.theme.innerHTML = '&#127773; Change theme'
        } else {
            document.body.classList.add('dark-theme');
            this.theme.innerHTML = '&#127770; Change theme'
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

    checkDate (date) {
        if (Object.prototype.toString.call(date) === '[object Date]') {
            return date
        } else {
            return new Date(date);
        }
    }

    renderStudy (input) {
        var temp = document.getElementById("study-item");
        var clone = temp.content.cloneNode(true);
        let id = input.studyId || 'study' + Math.floor(Math.random() * 1000000);
        /* input.img = input.img || this.getIconPath(), */
        clone.firstElementChild.dataset.id = id;

        document.querySelector('.study-list').appendChild(clone);

        let study = document.querySelector(`[data-id='${id}']`);

        // Find all refs in component
        study.refs = {}
        const refElems = document.body.querySelectorAll('[ref]')
        refElems.forEach((elem) => { study.refs[elem.getAttribute('ref')] = elem })

        study.refs.title.textContent = input.title;
        study.refs.progress.textContent = `${input.progress}%`;
        study.refs.date.textContent = this.renderDate(this.checkDate(input.creation));
        study.refs.favourite.innerHTML = input.favourite ? '&#128150;' : '&#128420;';

        import(`../../img/guitar${input.img}.jpeg`).then(img => {
            study.style.backgroundImage = `url(${img.default})`;
        });

        // EVENTS
        study.querySelector('.study-info').addEventListener('click', (evt) => this.openStudy.call(this, evt));
        study.querySelector('.study-favourite-btn').addEventListener('click', (evt) => this.toggleFavourite.call(this, evt));
        study.querySelector('.study-delete-btn').addEventListener('click', (evt) => this.removeStudy.call(this, evt));

        study.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    toggleFavourite (evt) {
        this.loader.classList.remove('hide');
        let { parent } = this.getParent(evt);
        let index = this.list.findIndex(e => e.studyId === parent.dataset.id);
        this.list[index].favourite = !this.list[index].favourite;
        event.target.innerHTML = this.list[index].favourite ? '&#128150;' : '&#128420;';
        this.app.state.update(parent.dataset.id, this.list[index])
            .then((response) => {
                this.loader.classList.add('hide');
                console.log('item updated: ', this.list[index]);
            })
            .catch(error => {
                this.loader.classList.add('hide');
                alert('Error deleting study: ', error);
            });
    }

    removeStudy (evt) {
        this.app.confirmModal.style.display = "block";
        this.app.setCallback(this.doRemoveStudy.bind(this, evt));
    }

    doRemoveStudy (evt) {
        this.app.confirmModal.style.display = "none";
        let { parent } = this.getParent(evt);
        this.loader.classList.remove('hide');
        this.app.state.delete(parent.dataset.id)
            .then((response) => {
                /* let index = this.list.findIndex(e => e.studyId === parent.dataset.id);
                this.list.splice(index, 1); */
                this.loader.classList.add('hide');
                if (this.listToBeDisplayed.length === 0) {
                    document.querySelector('.study-list').innerHTML = NOITEMS;
                } else {
                    this.loadStudies();
                }
            })
            .catch(error => {
                this.loader.classList.add('hide');
                alert('Error deleting study: ', error);
            });
    }

    openStudy (evt) {
        let { parent } = this.getParent(evt);
        let index = this.list.findIndex(e => e.studyId === parent.dataset.id);
        this.app.goTo('study', this.list[index]);
    }

    addStudy (evt) {
        this.app.goTo('study', {});
    }

}