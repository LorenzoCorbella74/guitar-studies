import * as d3 from "d3-selection";

import { allNotes, allNotesEnh, COLOURS, COLOURS_MERGE, Tunings } from './constants';

/* import { Scale } from "@tonaljs/tonal"; */


/* -------------------------------------------------------------------------- */

function getStartOctave (startNote) {
    startNote = startNote.toLowerCase();
    return startNote.includes("e") ||
        startNote.includes("f") ||
        startNote.includes("g") ||
        startNote.includes("a") ||
        startNote.includes("b")
        ? 2
        : 3;
}

function generateScales (notes) {
    let derived = [];
    let start = notes;
    notes.forEach(() => {
        let newArr = [...start];
        newArr.push(newArr.shift());
        derived.push(newArr);
        start = newArr;
    });
    derived.unshift(derived.pop());
    derived = derived.map(e => {
        return [...e, ...e, ...e]; // si considera 3 ottave
    });
    return derived;
}

function getIntervalOfNote (note, all) {
    let index = all.notes.findIndex(e => e === note);
    return all.intervals[index];
}

// TODO: 
// E minor #7M pentatonic oppure Eb phrygian dominant
// 1P	3m	4P	5P	7M
// E	G	A	B	D#  Salto del C !!! -> 

function generateStrOfNotes (arr, data) {
    let numberOfStrings = 6;
    let first_note = arr[0];
    let runningOctave = getStartOctave(first_note);
    let octaveForString = {};
    for (let a = 0; a < arr.length / 3; a++) {
        let n = arr[a];
        octaveForString[n] = getStartOctave(n);
    }
    let outputStr = "";
    let alreadyDone = true; // flag for not double jump pn C, C#
    for (let ns = 0; ns < arr.length - 3; ns++) {   // per tutte le note
        let note = arr[ns];
        if (note.includes('C') && ns !== 0 && ns !== 1 && !alreadyDone) {   // se si incontra un C che non sia come 1 o 2° nota di una scala e non consecutive
            runningOctave++;
            alreadyDone = true;
        } else if (ns > 0 && arr[ns - 1].includes('B') && arr[ns].includes('D')) {  // se c'è un salto tra B e D
            runningOctave++;
            alreadyDone = true;
        } else {
            let compare = octaveForString[note];
            if (compare > runningOctave) {
                runningOctave++;
                octaveForString[note] = runningOctave;
            }
            alreadyDone = false;
        }
        outputStr += `${numberOfStrings}:${note}${runningOctave}:${getIntervalOfNote(
            note,
            data
        )} `;
        if ((ns + 1) % data.notesForString === 0) {
            numberOfStrings--;
        }
    }
    return outputStr;
}

export function generateFingerings (data) {
    let output = generateScales(data.notes);
    return output.map(e => generateStrOfNotes(e, data, data.notesForString));
}
/* -------------------------------------------------------------------------- */
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

/* function noteName (absPitch) {
    let octave = Math.floor(absPitch / 12);
    let note = allNotes[absPitch % 12];
    return note + octave.toString();
} */

// crea i colori per l'array mergiato
export function createMergeColors (combined, source1, source2) {
    let result = [];
    combined.forEach(note => {
        if (source1.includes(note) && source2.includes(note)) {
            result.push(0);
        } else if (source1.includes(note)) {
            result.push(1);
        } else {
            result.push(2);
        }
    });
    return result;
}

// mergia e rimuove i duplicati
export function mergeArrays (...arrays) {
    let jointArray = []
    arrays.forEach(array => {
        jointArray = [...jointArray, ...array]
    });
    return [...new Set([...jointArray])]
}

export function safeNotes (note) {
    let output;
    switch (note) {
        case 'B#': output = 'C'; break;
        case 'E#': output = 'F'; break;
        case 'Fb': output = 'E'; break;
        case 'Cb': output = 'B'; break;
        default: output = note; break;
    }
    return output;
}

// where è l'elemento dentro il quale si renderizza la fretboard
export const Fretboard = function (config) {
    config = config || {};
    let where = config.where || "body";

    let id = config.id || "fretboard" + Math.floor(Math.random() * 1000000);

    let instance = {
        id: id,
        frets: 12,
        startFret: 0,
        strings: 6,
        stringsVisibility: [],
        tuning: Tunings.guitar6.standard,
        fretWidth: 50,
        fretHeight: 20,
        leftHanded: false,
        showTitle: false,
        notes: [],
        layers: [],
        ...config,
    };

    for (let v = 1; v < instance.strings + 1; v++) {
        instance.stringsVisibility.push(1);
    }

    // scales è l'array di scale ordinato secondo la visualizzazione
    // quello in top visualizzazione è l'ultimo
    instance.set = (prop, value) => {
        instance[prop] = value;
        instance.clear();           // ridisegna la fretboard
        instance.repaint();         // ridisegna le note
    };

    // 5)  le informazioni delle singole note vengono pushiate dentro instance notes
    instance.addNoteOnString = function (note, string, color, info, size, opacity) {
        if (instance.stringsVisibility[string - 1]) {
            instance.notes.push({ note, string, color, info, size, opacity });
        }
    };

    instance.addNote = function (note, color, info, size, opacity) {
        for (let string = 1; string <= instance.strings; string++) {  // per tutte le stringhe
            if (instance.stringsVisibility[string - 1]) {
                instance.addNoteOnString(note, string, color, info, size, opacity);
            }
        }
    };

    // 3) prende tutte le note e chiama l'addNote o addNoteOnString
    instance.addNotes = function (data) {
        let { intervals, notes, id } = data;
        let index = instance.layers.findIndex(i => i.id === id);   // si recupera l'indice del layer in base alsuo id
        let whatToShow = instance.layers[index].whatToShow;
        let size = instance.layers[index].size;
        let opacity = instance.layers[index].opacity;
        if (data.fingering === 'all') {
            for (let i = 0; i < notes.length; i++) {
                let color;
                if (data.combinedColors) {
                    color = COLOURS_MERGE[data.combinedColors[i]];
                } else {
                    color = instance.layers[index].color === 'many' ? COLOURS[intervals[i]] : (instance.layers[index].color === 'triads' ? (intervals[i] === '1P' || intervals[i] === '3m' || intervals[i] === '3M' || intervals[i] === '5P' ? COLOURS[intervals[i]] : '#30336b') : '#30336b');/* getComputedStyle(document.documentElement).getPropertyValue('--primary-color') */;
                }
                let note = notes[i];
                let info = instance.layers[index].color === 'many' || instance.layers[index].color === 'triads' ? (whatToShow === 'degrees' ? intervals[i] : (whatToShow === 'notes' ? note : '')) : '';
                if (instance.layers[index].notesVisibility[i]) {        // solo se la nota è visibile
                    for (let octave = 1; octave < 7; octave++) {        // aggiunge la nota per tutte le ottave...
                        instance.addNote(note + octave, color, info, size, opacity);
                    }
                }
            }
        } else {
            let sequence = data.fingerings[data.fingering - 1].trim();
            let triplets = sequence.split(" ");
            let items = [];
            triplets.forEach((triplet) => {
                const [string, note, interval] = triplet.split(":");
                items.push({ string, note, interval });
            });
            for (let i = 0; i < items.length; i++) {
                const ele = items[i];
                let v = instance.layers[index].notesVisibility;
                let visibility = [...v, ...v, ...v];
                let color;
                if (data.combinedColors) {
                    color = COLOURS_MERGE[data.combinedColors[i]];
                } else {
                    color = instance.layers[index].color === 'many' ? COLOURS[ele.interval] : (instance.layers[index].color === 'triads' ? (ele.interval === '1P' || ele.interval === '3m' || ele.interval === '3M' || ele.interval === '5P' ? COLOURS[ele.interval] : '#30336b') : '#30336b');/* getComputedStyle(document.documentElement).getPropertyValue('--primary-color') */;
                }
                let info = instance.layers[index].color === 'many' || instance.layers[index].color === 'triads' ? (whatToShow === 'degrees' ? ele.interval : (whatToShow === 'notes' ? ele.note.substring(0, ele.note.length() - 1) : '')) : '';
                if (visibility[i]) {
                    instance.addNoteOnString(ele.note, parseInt(ele.string), color, info, size, opacity);
                }
            }
        }

    };

    instance.addMergeLayer = function (data) {
        instance.addNotes(data);
    }

    // 2) scaleName = "a aeolian" -> AGGIUNGE UNA SCALA
    instance.addLayer = function (data) {
        instance.addNotes(data);
    };

    // TODO: accordi e scale 3 note per stringa
    // genera una scala a partire da una sequenza di stringa:nota -> utile per gli accordi
    /* instance.placeNotes = function (sequence) {
        let pairs = sequence.split(" ");
        pairs.forEach(function (pair, i) {
            const [string, note] = pair.split(":");
            instance.addNoteOnString(note, parseInt(string)); // info, size, opacity
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
        let namesStrings = instance.tuning.slice(0, instance.strings).map(e => e.toUpperCase()[0]).reverse();
        for (let i = 0; i < instance.strings; i++) {
            instance.svgContainer
                .append("line")
                .attr("x1", XMARGIN())
                .attr("y1", i * instance.fretHeight + 1 + YMARGIN())
                .attr("x2", XMARGIN() + fretboardWidth())
                .attr("y2", i * instance.fretHeight + 1 + YMARGIN())
                .attr("stroke", "lightgray")
                .attr("stroke-width", 1);

            const stringsLetter = instance.svgContainer
                .append("text")
                .attr("class", "string-info")
                .attr('x', 5 + 'px')
                .attr('y', i * instance.fretHeight + 1 + YMARGIN() + 3.5 + 'px')
                .text(namesStrings[i])
                .attr("font-family", "sans-serif")
                .attr("font-size", "12px")
                .on('click', () => {
                    instance.stringsVisibility[i] = instance.stringsVisibility[i] === 1 ? 0 : 1;
                    instance.repaint();
                });
        }
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

    function hexToRGB (h, opacity) {
        let r = 0, g = 0, b = 0;

        // 3 digits
        if (h.length == 4) {
            r = "0x" + h[1] + h[1];
            g = "0x" + h[2] + h[2];
            b = "0x" + h[3] + h[3];

            // 6 digits
        } else if (h.length == 7) {
            r = "0x" + h[1] + h[2];
            g = "0x" + h[3] + h[4];
            b = "0x" + h[5] + h[6];
        }

        return "rgb(" + +r + "," + +g + "," + +b + "," + +opacity + ")";
    }

    function paintNote (note, string, color, info, size, opacity) {
        if (string > instance.strings) {
            return false;
        }
        let absPitch = absNote(note);
        let absString = instance.strings - string;
        let basePitch = absNote(instance.tuning[absString]) + instance.startFret;
        if (
            absPitch >= basePitch &&
            absPitch <= basePitch + instance.frets - instance.startFret
        ) {
            // 0.75 is the offset into the fret (higher is closest to fret)
            let x = (absPitch - basePitch + 0.65) * instance.fretWidth;
            let y = (string - 1) * instance.fretHeight + 1 + YMARGIN();
            if (info == '1P' || info == '3M' || info == '3m' || info == '5P' || info == '5A' || info == '5d' || info == '7m' || info == '7M' || info == '7d') {
                const rect = instance.svgContainer
                    .append('rect')
                    .attr('class', 'note')
                    .style('stroke', 'var(--detail)')
                    .attr('stroke-width', 1)
                    .attr("x", (absPitch - basePitch + 0.4) * instance.fretWidth)
                    .attr("y", (string - 1) * instance.fretHeight + YMARGIN() / 2 + 4.5)
                    .attr("width", 24 * size)
                    .attr("height", 24 * size)
                    .attr("rx", 8)

                    .style("fill", hexToRGB(color, opacity))
                    .on('click', () => null/* instance.playNote(note) */);
            } else {
                const circle = instance.svgContainer
                    .append("circle")
                    .attr("class", "note")
                    .attr("stroke-width", 1)
                    .attr("cx", x + 0.75)
                    .attr("cy", y)
                    .attr("r", 12 * size)
                    .style("stroke", 'var(--detail)')
                    .style("fill", hexToRGB(color, opacity))
                    .on("click", () => null);
            }

            //Add the SVG Text Element to the svgContainer
            const text = instance.svgContainer
                .append("text")
                .attr("class", "note-info")
                .attr('x', info.length > 1 ? ((absPitch - basePitch + 0.54) * instance.fretWidth + 'px') : ((absPitch - basePitch + 0.60) * instance.fretWidth + 'px'))
                .attr('y', (string - 1) * instance.fretHeight + 1 + YMARGIN() + 3.5 + 'px')
                .text(info)
                .attr("font-family", "sans-serif")
                .attr("font-size", "12px")
                .attr('fill', '#4c5151') // '#2F4F4F' DarkSlateGrey


            return true;
        }
        return false;
    }

    /* disegna TUTTE LE NOTE  a partire da istance.notes */
    instance.paint = function () {
        for (let { note, string, color, info, size, opacity } of instance.notes) {
            paintNote(note, string, color, info, size, opacity);
        }
    };

    instance.repaint = function () {
        // instance.drawBoard(); -> non si ricrea la tastiera ogni volta che si deve cambiare le note sopra...
        instance.clearNotes();
        instance.layers.forEach(scale => {
            if (scale.visible) {
                if (scale.merge) {
                    instance.addMergeLayer(scale);
                } else {
                    instance.addLayer(scale);
                }
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
