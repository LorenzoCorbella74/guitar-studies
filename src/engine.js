import * as d3 from "d3-selection";

import { allNotes, allNotesEnh, colors, Scales, Tunings } from './constants';

import { /* Chord, Distance, */ Scale } from "@tonaljs/tonal";

function asOffset (note) {
    note = note.toLowerCase();
    let offset = allNotes.indexOf(note);
    if (offset === -1) {
        offset = allNotesEnh.indexOf(note);
    }
    return offset;
}

function absNote (note) {
    let octave = note[note.length - 1];
    let pitch = asOffset(note.slice(0, -1));
    if (pitch > -1) {
        return pitch + octave * 12;
    }
}

function noteName (absPitch) {
    let octave = Math.floor(absPitch / 12);
    let note = allNotes[absPitch % 12];
    return note + octave.toString();
}

// where è l'elemento dentro il quale si renderizza la fretboard
export const Fretboard = function (config) {
    config = config || {};
    let where = config.where || "body";

    let id = "fretboard-" + Math.floor(Math.random() * 1000000);

    let instance = {
        frets: 12,
        startFret: 0,
        strings: 6,
        tuning: Tunings.guitar6.standard,
        fretWidth: 50,
        fretHeight: 20,
        leftHanded: false,
        showTitle: false,
        notes: [],
        layers: [],
        ...config,
    };

    // scales è l'array di scale ordinato secondo la visualizzazione
    // quello in top visualizzazione è l'ultimo
    instance.set = (prop, value) => {
        instance[prop] = value;
        instance.clear();           // ridisegna la fretboard
        instance.repaint();   // ridisegna le note
    };

    // 5)  le informazioni delle singole note vengono pushiate dentro instance notes
    instance.addNoteOnString = function (note, string, color, info) {
        instance.notes.push({ note, string, color, info });
    };

    // 4) note = a1, red
    instance.addNote = function (note, color, info) {
        for (let string = 1; string <= instance.strings; string++) {  // per tutte le stringhe
            instance.addNoteOnString(note, string, color, info);
        }
    };



    // 3) prende tutte le note e chiama l'addNote
    instance.addNotes = function (data) {
        let { intervals, notes, name, tonic, type } = data;
        let index = instance.layers.findIndex(i => i.value === name);
        let whatToShow = instance.layers[index].whatToShow;
        for (let i = 0; i < notes.length; i++) {
            let showColor = instance.layers[index].color === 'many' ? colors[i] : getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
            let note = notes[i];
            let info = instance.layers[index].color === 'many' ? (whatToShow === 'degrees' ? intervals[i] : note) : '';
            if (instance.layers[index].notesVisibility[i]) {        // solo se la nota è visibile
                for (let octave = 1; octave < 7; octave++) {        // aggiunge la nota per tutte le ottave...
                    instance.addNote(note + octave, showColor, info);
                }
            }
        }
    };

    // 2) scaleName = "a aeolian" -> AGGIUNGE UNA SCALA
    instance.addLayer = function (scaleName) {
        let data = Scale.get(scaleName); // asNotes(scaleName);
        instance.addNotes(data);
    };

    // TODO: 
    // genera una scala a partire da una sequenza di stringa:nota -> utile per gli accordi
    /* instance.placeNotes = function (sequence) {
        let pairs = sequence.split(" ");
        pairs.forEach(function (pair, i) {
            const [string, note] = pair.split(":");
            instance.addNoteOnString(note, parseInt(string)); // , i==0? "red" : "black");
        });
    }; */

    // pulisce cancellando tutte le note e le informazioni delle note 
    instance.clearNotes = function () {
        instance.notes = [];
        instance.svgContainer.selectAll(".note").remove();
        instance.svgContainer.selectAll(".note-info").remove();
    };

    instance.updateLayer = function (index, scaleName) {
        let indexScale = instance.layers.findIndex(n => n.value === scaleName);
        let my = instance.layers[indexScale].notesVisibility[index];
        instance.layers[indexScale].notesVisibility[index] = my ? 0 : 1;
        instance.repaint();
    }

    // METHODS for drawing -------------------------------------------

    let fretFitsIn = function (fret) {
        return fret > instance.startFret && fret <= instance.frets;
    };

    let fretsWithDots = function () {
        let allDots = [3, 5, 7, 9, 15, 17, 19, 21];
        return allDots.filter(fretFitsIn);
    };

    let fretsWithDoubleDots = function () {
        let allDots = [12, 24];
        return allDots.filter(fretFitsIn);
    };

    let fretboardHeight = function () {
        return (instance.strings - 1) * instance.fretHeight + 2;
    };

    let fretboardWidth = function () {
        return (instance.frets - instance.startFret) * instance.fretWidth + 2;
    };

    let XMARGIN = function () {
        return instance.fretWidth;
    };
    let YMARGIN = function () {
        return instance.fretHeight;
    };

    let makeContainer = function (elem) {
        instance.width = fretboardWidth() + XMARGIN() * 2;
        instance.height = fretboardHeight() + YMARGIN() * 2;

        let container = d3
            .select(elem)
            .append("div")
            .attr("class", "fretboard")
            .attr("id", id)
            .append("svg")
            .attr("width", instance.width)
            .attr("height", instance.height);

        if (instance.leftHanded) {
            container = container
                .append("g")
                .attr("transform", "scale(-1,1) translate(-" + instance.width + ",0)");
        }

        return container;
    };

    let drawFrets = function () {
        for (let i = instance.startFret; i <= instance.frets; i++) {
            // BEWARE: the coordinate system for SVG elements uses a transformation
            // for lefties, however the HTML elements we use for fret numbers and
            // tuning we transform by hand.
            let x = (i - instance.startFret) * instance.fretWidth + 1 + XMARGIN();
            let fretNumX = x;
            if (instance.leftHanded) {
                fretNumX = instance.width - x;
            }
            // fret
            instance.svgContainer
                .append("line")
                .attr("x1", x)
                .attr("y1", YMARGIN())
                .attr("x2", x)
                .attr("y2", YMARGIN() + fretboardHeight())
                .attr("stroke", "lightgray")
                .attr("stroke-width", i === 0 ? 8 : 2);
            // number
            d3.select("#" + id)
                .append("p")
                .attr("class", "fretnum")
                .style("top", fretboardHeight() + YMARGIN() + 5 + "px")
                .style("left", fretNumX - 4 + "px")
                .text(i);
        }
    };

    let drawStrings = function () {
        for (let i = 0; i < instance.strings; i++) {
            instance.svgContainer
                .append("line")
                .attr("x1", XMARGIN())
                .attr("y1", i * instance.fretHeight + 1 + YMARGIN())
                .attr("x2", XMARGIN() + fretboardWidth())
                .attr("y2", i * instance.fretHeight + 1 + YMARGIN())
                .attr("stroke", "black")
                .attr("stroke-width", 1);
        }
        let placeTuning = function (d, i) {
            return (instance.strings - i) * instance.fretHeight - 5 + "px";
        };

        let toBaseFretNote = function (note) {
            return noteName(absNote(note) + instance.startFret);
        };

        let hPosition = instance.leftHanded ? instance.width - 16 + "px" : "4px";

        d3.select("#" + id)
            .selectAll(".tuning")
            .data(instance.tuning.slice(0, instance.strings))
            .style("top", placeTuning)
            .text(toBaseFretNote)
            .enter()
            .append("p")
            .attr("class", "tuning")
            .style("top", placeTuning)
            .style("left", hPosition)
            .text(toBaseFretNote);
    };

    let drawDots = function () {
        let p = instance.svgContainer.selectAll("circle").data(fretsWithDots());

        function dotX (d) {
            return (
                (d - instance.startFret - 1) * instance.fretWidth +
                instance.fretWidth / 2 +
                XMARGIN()
            );
        }

        function dotY (ylocation) {
            let margin = YMARGIN();

            if (instance.strings % 2 === 0) {
                return (
                    ((instance.strings + 3) / 2 - ylocation) * instance.fretHeight +
                    margin
                );
            } else {
                return (fretboardHeight() * ylocation) / 4 + margin;
            }
        }

        p.enter()
            .append("circle")
            .attr("cx", dotX)
            .attr("cy", dotY(2))
            .attr("r", 4)
            .style("fill", "#ddd");

        p = instance.svgContainer.selectAll(".octave").data(fretsWithDoubleDots());

        p.enter()
            .append("circle")
            .attr("class", "octave")
            .attr("cx", dotX)
            .attr("cy", dotY(3))
            .attr("r", 4)
            .style("fill", "#ddd");
        p.enter()
            .append("circle")
            .attr("class", "octave")
            .attr("cx", dotX)
            .attr("cy", dotY(1))
            .attr("r", 4)
            .style("fill", "#ddd");
    };

    instance.drawBoard = function () {
        //instance.delete();  // cancella la fretboard
        instance.svgContainer = makeContainer(where); // crea l'svg
        drawFrets();  // crea i tasti
        drawDots();   // crea i punti
        drawStrings();  // crea le stringhe
        return instance;
    };

    function paintNote (note, string, color, info) {
        if (string > instance.strings) {
            return false;
        }
        let absPitch = absNote(note);
        let actualColor = color || "black";
        let absString = instance.strings - string;
        let basePitch = absNote(instance.tuning[absString]) + instance.startFret;
        if (
            absPitch >= basePitch &&
            absPitch <= basePitch + instance.frets - instance.startFret
        ) {
            // 0.75 is the offset into the fret (higher is closest to fret)
            let x = (absPitch - basePitch + 0.75) * instance.fretWidth;
            let y = (string - 1) * instance.fretHeight + 1 + YMARGIN();
            const circle = instance.svgContainer
                .append("circle")
                .attr("class", "note")
                .attr("stroke-width", 1)
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", 9)
                .style("stroke", actualColor)
                .style("fill", actualColor)
                .on("click", function () {
                    let fill = this.style.fill;
                    this.setAttribute(
                        "stroke-width",
                        5 - parseInt(this.getAttribute("stroke-width"))
                    );
                    this.style.fill = fill === "white" ? "lightgray" : "white";
                });

            //Add the SVG Text Element to the svgContainer
            const text = instance.svgContainer
                .append("text")
                .attr("class", "note-info")
                .attr("x", x - 6)
                .attr("y", y + 4)
                .text(info)
                .attr("font-family", "sans-serif")
                .attr("font-size", "12px")
                .attr("fill", "white");

            return true;
        }
        return false;
    }

    /* disegna TUTTE LE NOTE  a partire da istance.notes */
    instance.paint = function () {
        for (let { note, string, color, info } of instance.notes) {
            paintNote(note, string, color, info);
        }
    };

    instance.repaint = function () {
        // instance.drawBoard(); -> non si ricrea la tastiera ogni volta che si deve cambiare le note sopra...
        instance.clearNotes();
        instance.layers.forEach(scale => {
            if (scale.visible) {
                instance.addLayer(scale.value)
            }
        });
        instance.paint();
    };


    /* è utile ??? cancella le note, cancella la tastiera e la ricostituisce. */
    instance.clear = function () {
        instance.clearNotes();
        const el = document.getElementById(id);
        el.parentNode.removeChild(el);
        instance.drawBoard();
        return instance;
    };

    // cancella tutto l'elemento della fretboard
    /* instance.delete = function () {
        d3.select("#" + id).remove();
    }; */

    return instance;
};
