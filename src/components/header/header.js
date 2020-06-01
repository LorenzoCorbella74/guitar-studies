import "./header.scss";
import template from './header.html';

export default class Header {

    constructor(placeholderId, addCallback, removeCallback, backToListCallback) {

        this.element = document.getElementById(placeholderId);
        this.element.innerHTML = template;  // Load template into placeholder element

        // Find all refs in component
        this.refs = {}
        const refElems = this.element.querySelectorAll('[ref]')
        refElems.forEach((elem) => { this.refs[elem.getAttribute('ref')] = elem })

        // events
        document.getElementById('add-general-btn').addEventListener('click', addCallback);
        document.getElementById('remove-general-btn').addEventListener('click', removeCallback);
        document.getElementById('back-btn').addEventListener('click', backToListCallback);
        document.getElementById('tags-general-btn').addEventListener('click', this.toggleTabsPanel.bind(this));

        // SLIDER RANGE
        const header = document.querySelector('.header');
        const slider = header.querySelector(".progress-range .slider");
        const bubble = header.querySelector(".progress-bubble");
        slider.addEventListener("input", () => {
            this.setBubbleProgress(slider, bubble);
        });
        this.setBubbleProgress(slider, bubble);

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

    renderTags() {
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

    removeTag(i) {
        this.tags = this.tags.filter(item => this.tags.indexOf(item) != i);
        this.renderTags();
    }

    toggleTabsPanel() {
        document.querySelector('.header-description').classList.toggle('hide');
        document.querySelector('.header-tags-container').classList.toggle('hide');
    }

    setBubbleProgress(slider, bubble) {
        const val = slider.value;
        const min = slider.min ? slider.min : 0;
        const max = slider.max ? slider.max : 100;
        const newVal = Number(((val - min) * 100) / (max - min));
        bubble.innerHTML = val;
        // Sorta magic numbers based on size of the native UI thumb
        // bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.10}px))`;
    }

}