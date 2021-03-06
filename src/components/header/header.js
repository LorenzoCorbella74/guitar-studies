import "./header.scss";
import template from './header.html';

export default class Header {

    constructor(placeholderId, addCallback, removeCallback, backToListCallback, togglePlayer, interchangeCallback, fifthsCallback, modeCallback) {

        this.element = document.getElementById(placeholderId);
        this.element.innerHTML = template;  // Load template into placeholder element
        // this.prevScrollpos = window.pageYOffset;

        // Find all refs in component
        this.refs = {}
        const refElems = this.element.querySelectorAll('[ref]')
        refElems.forEach((elem) => { this.refs[elem.getAttribute('ref')] = elem })

        // events
        document.getElementById('add-general-btn').addEventListener('click', addCallback);
        document.getElementById('remove-general-btn').addEventListener('click', removeCallback);
        document.getElementById('back-btn').addEventListener('click', backToListCallback);
        document.getElementById('player-btn').addEventListener('click',togglePlayer);
        document.getElementById('tags-general-btn').addEventListener('click', this.toggleTabsPanel.bind(this));
        document.getElementById('interchange-btn').addEventListener('click', interchangeCallback);
        document.getElementById('fifths-btn').addEventListener('click', fifthsCallback);
        document.getElementById('mode-btn').addEventListener('click', (evt)=> modeCallback.call(null, evt));

        /* window.onscroll = () => {
            var currentScrollPos = window.pageYOffset;
            if (this.prevScrollpos > currentScrollPos ) {
                this.element.style.top = '0';
            } else {
                this.element.style.top = '-98px';
            }
            this.prevScrollpos = currentScrollPos;
        } */

        // SLIDER RANGE
        const header = document.querySelector('.header');
        this.slider = header.querySelector(".progress-range .slider");
        this.bubble = header.querySelector(".progress-bubble");
        this.slider.addEventListener("input", () => {
            this.setBubbleProgress();
        });
        this.setBubbleProgress();

        // TAGS
        const txt = document.getElementById('tag-input');
        this.taglist = document.getElementById('tag-list');
        this.tags = [];
        txt.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                let val = txt.value;
                if (val !== '') {
                    if (this.tags.indexOf(val) >= 0) {
                        // tag già presente
                    } else {
                        this.tags.push(val);
                        this.renderTags();
                        txt.value = '';
                        txt.focus();
                    }
                } else {
                    console.log('Input is empty')
                }
            }
        });
        this.renderTags();
    }

    renderTags () {
        this.taglist.innerHTML = '';
        this.tags.map((item, index) => {
            this.taglist.innerHTML += `<li>${item} <span data-tagid="${index}">&times;</span></li>`;
        });
        document.querySelectorAll('[data-tagid]').forEach(element => {
            element.addEventListener('click', (evt) => {
                this.removeTag(element.dataset.tagid)
            });
        });
    }

    removeTag (i) {
        this.tags = this.tags.filter(item => this.tags.indexOf(item) != i);
        this.renderTags();
    }

    toggleTabsPanel () {
        document.querySelector('.header-description').classList.toggle('hide');
        document.querySelector('.header-tags-container').classList.toggle('hide');
    }

    setBubbleProgress () {
        const val = this.slider.value;
        const min = this.slider.min ? this.slider.min : 0;
        const max = this.slider.max ? this.slider.max : 100;
        const newVal = Number(((val - min) * 100) / (max - min));
        this.bubble.innerHTML = val;
        // Sorta magic numbers based on size of the native UI thumb
        // bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.10}px))`;
    }

}