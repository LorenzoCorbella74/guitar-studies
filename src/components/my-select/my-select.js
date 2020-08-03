import './my-select.scss';

export class MySelect {
    constructor(o) {
        this.options = o;
        this.init();
    }

    init () {
        this.elem = document.getElementById(this.options.id);

        // se aperto e si preme fuori si clhiude
        document.addEventListener("mousedown", () => {
            if (this.isVisible) this.hide();
        });

        // setting a reference (for pages with multiple select)
        if (!window.dropdowns) window.dropdowns = {};
        window.dropdowns[this.options.id] = this;

        //step4 - misc
        this.elem.style.display = "inline-block";
        this.elem.innerHTML = `<div class='my-select'>
                                    <div class='my-select-value'></div>
                                    <div class='my-select-arrow'>▾</div>
                                    <div class='my-select-panel'>
                                        <div class='my-select-items'></div>
                                    </div>
                            </div>`;
        this.items = this.elem.querySelector(".my-select-items");
        this.panel = this.elem.querySelector(".my-select-panel");
        this.arrow = this.elem.querySelector(".my-select-arrow");
        // setting the value
        this.value = this.elem.querySelector(".my-select-value");
        this.value.innerHTML = this.options.val;

        // setting options
        var options = "";
        this.options.data.forEach((elem, i) => {
            options += `<div class='${
                elem.isHeader ? "item-header" : ""
                }' data-id="${i}" data-value="${elem.value || ""}">${elem.label}</div>`;
        });
        this.items.innerHTML = options;
        this.items.addEventListener("mousedown", evt => {
            this.setValue(evt, this.items.children[Number(evt.target.dataset.id)]);
        });

        // si inverte la visibilità al click
        this.elem.addEventListener("mousedown", event => {
            event.stopPropagation();
            if (this.isVisible) {
                this.hide();
            } else {
                this.show();
            }
        });
    }

    setValue (evt, elem) {
        evt.stopPropagation();
        this.hide();
        var newval = elem.dataset.value;
        this.value.innerHTML = newval;
        if (this.options.onSelect) this.options.onSelect(newval);
    }

    show () {
        // all others are closed
        for (var dd in window.dropdowns) window.dropdowns[dd].hide();
        this.isVisible = true;
        this.items.style.transform = "translate(0px,0px)";
        this.arrow.style.transform = "rotate(180deg)";
    }

    hide () {
        if (!this.items) return;
        this.isVisible = false;
        this.items.style.transform = "translate(0px,-255px)";
        this.arrow.style.transform = "rotate(0deg)";
    }
}