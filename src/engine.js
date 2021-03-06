import * as d3 from "d3-selection";

import { allNotes, allNotesEnh, COLOURS, COLOURS_MERGE, Tunings } from './constants';

import { Scale, Note, Chord, transpose, Interval } from "@tonaljs/tonal";



function checkIndex (inversion, index) {
    let output = false;
    switch (inversion) {
        case '1': output = index === 0; break;
        case '2': output = (index === 0 || index === 1); break;
        case '3': output = (index === 0 || index === 1 || index === 2); break;
        default: output = index === 0; break;
    }
    return output;
}

export function applyInversion (chords) {
    // console.log('Before: ', chords.map(e=>e.notes));
    chords.map(e => {
        if (e.inversion === 'no') {
            return e; // ritorn al'accordo normale
        } else {
            e.notes = e.notes.map((nota, i) => {
                if (checkIndex(e.inversion, i)) {
                    let octave = nota.charAt(nota.length - 1);
                    let note = nota.slice(0, -1);
                    nota = `${note}${Number(octave) + 1}`;
                }
                return nota;
            });
            return e
        }
    });
    // console.log('After: ', chords.map(e=>e.notes));
    return chords;
}

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
        return [...e, ...e, ...e, ...e]; // si considera 4 ottave
    });
    return derived;
}

function generateChord (notes) {
    let derived = [];
    let start = notes;
    notes.forEach((mode, i) => {
        let newArr = [...start];
        newArr.push(newArr.shift());
        derived.push(newArr);
        start = newArr;
    });
    derived.unshift(derived.pop());
    return derived;
}

function shiftChord (types, shift) {
    let copy = [...types];
    let cut = copy.splice(0, shift);
    return [...copy, ...cut];
}

let CHORDSTYPES = ["maj7", "m7", "m7", "maj7", "7", "m7", "m7b5"];
let SCALETYPES = [
    "major",
    "dorian",
    "phrygian",
    "lydian",
    "mixolydian",
    "minor",
    "locrian"
];

export function generateChordsForModalInterchange (start) {
    let CHORDS = generateChord(CHORDSTYPES);
    let output = [];
    SCALETYPES.forEach((scale, index) => {
        let info = Scale.get(`${start} ${scale}`);
        info.chords = CHORDS[index].map(
            (e, noteindex) => `${info.notes[noteindex]}${e}`
        );
        let { name, intervals, type, tonic, notes, chords } = info;
        output.push({ name, intervals, type, tonic, notes, chords });
    });
    return output;
}

export function generateCircleOfFifths (scale) {
    let beginning = "Db";
    let scaleIndex = SCALETYPES.findIndex(e => e === scale);
    let generatedChords = shiftChord(CHORDSTYPES, scaleIndex);
    let noteFifths = [beginning];
    for (let i = 0; i < 11; i++) {
        beginning = Note.transpose(beginning, "5P");
        noteFifths.push(beginning);
    }
    let output = noteFifths.map(e => Scale.get(`${e} ${scale}`));
    output.forEach(element => {
        element.chords = element.notes.map((e, i) => `${e}${generatedChords[i]}`);
    });
    return output;
}

function getIntervalOfNote (note, all) {
    let index = all.notes.findIndex(e => e === note);
    return all.intervals[index];
}

function calculateNumOverStrings (num) {
    let out;
    switch (num) {
        case 3: out = 18; break;
        case 4: out = 24; break;
        case 2: out = 12; break;
        default: out = 18; break;
    }
    return out;
}

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
    for (let ns = 0; ns < calculateNumOverStrings(data.notesForString); ns++) {   // per tutte le note (21-3 per 3(18) nps o 18-3 per 2nps(12)) per tutte le note (28-4 per 3(24) nps o 18-3 per 2nps(12))
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

export function createChordFingering(chord) {
    let data = Chord.getChord(chord.suffix, chord.key); // TODO:
    let output = [];
    chord.positions = chord.positions.filter(
      e => e.frets.split("").indexOf("a") === -1
    );
    chord.positions.forEach((chord, chordIndex) => {
      let frets = chord.frets.split("");
      output[chordIndex] = [];
      for (let index = frets.length - 1; index >= 0; index--) {
        const fret = frets[index];
        if (fret !== "x") {
          let note = transpose(
            Tunings.guitar6.standard[index],
            Interval.fromSemitones(Number(fret))
          );
          let realNote = note.slice(0, -1);
          if (data.notes.indexOf(realNote) === -1) {
            realNote = Note.enharmonic(realNote);
          }
          let intervalIndex = data.notes.indexOf(realNote);
          let d = `${6 - index}:${note}:${data.intervals[intervalIndex]}`;
          output[chordIndex].push(d);
        }
      }
    });
    return output.map(e => e.reverse()).map(e => e.join(" "));
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
        default: output = Note.simplify(note); break;
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
        let uniform = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
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
                    color = instance.layers[index].color === 'many' ? COLOURS[intervals[i]] : (instance.layers[index].color === 'triads' ? (intervals[i] === '1P' || intervals[i] === '3m' || intervals[i] === '3M' || intervals[i] === '5P' ? COLOURS[intervals[i]] : uniform) : uniform);
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
                let visibility = [...v, ...v, ...v, ...v];
                let color;
                if (data.combinedColors && data.fingering === 'all') {    // si rimuove la possibilità di avere la colorazione del merge per i singoli gradi della scala mergiata
                    color = COLOURS_MERGE[data.combinedColors[i]];
                } else {
                    color = instance.layers[index].color === 'many' ? COLOURS[ele.interval] : (instance.layers[index].color === 'triads' ? (ele.interval === '1P' || ele.interval === '3m' || ele.interval === '3M' || ele.interval === '5P' ? COLOURS[ele.interval] : uniform) : uniform);
                }
                let info = instance.layers[index].color === 'many' || instance.layers[index].color === 'triads' ? (whatToShow === 'degrees' ? ele.interval : (whatToShow === 'notes' ? ele.note.substring(0, ele.note.length - 1) : '')) : '';
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

    // pulisce cancellando tutte le note e le informazioni delle note 
    instance.clearNotes = function () {
        instance.notes = [];
        instance.svgContainer.selectAll(".note").remove();
        instance.svgContainer.selectAll(".note-info").remove();
    };

    // index è l'indice della nota scelta (zero based)
    // fingering è 'all',1,2,3,4,5,6,7...
    // se index è 2 e fingering è 3, vuol dire 3° nota partendo dalla 3°indice
    instance.updateLayer = function (index, id) {
        let indexScale = instance.layers.findIndex(n => n.id === id);
        let l = instance.layers[indexScale];
        let correctedIndex = index - (l.fingering === 'all' ? 0 : l.fingering - 1);
        let newIndex = correctedIndex < 0 ? l.notesVisibility.length + correctedIndex : correctedIndex;
        let my = l.notesVisibility[newIndex];
        l.notesVisibility[newIndex] = my ? 0 : 1;
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
        const rect = instance.svgContainer
            .append('rect')
            .attr('class', 'fretboardpanel')
            .style('stroke', 'var(--fretboard_side)')
            .attr('stroke-width', 1)
            .attr("x", 50 + 'px')
            .attr("y", 32 + 'px')
            .attr("width", fretboardWidth())
            .attr("height", fretboardHeight())
            .style("fill", 'var(--fretboard)')

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
                .attr("stroke", 'var(--frets)')
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
                .attr("stroke", "var(--strings)")
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
            .style("fill", "var(--inlays)");

        p = instance.svgContainer.selectAll(".octave").data(fretsWithDoubleDots());

        p.enter()
            .append("circle")
            .attr("class", "octave")
            .attr("cx", dotX)
            .attr("cy", dotY(3))
            .attr("r", 4)
            .style("fill", "var(--inlays)");
        p.enter()
            .append("circle")
            .attr("class", "octave")
            .attr("cx", dotX)
            .attr("cy", dotY(1))
            .attr("r", 4)
            .style("fill", "var(--inlays)");
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
                    .style('stroke', 'var(--primary-color)')
                    .attr('stroke-width', 1)
                    .attr("x", (absPitch - basePitch + 0.40 / size) * instance.fretWidth + 'px')
                    .attr("y", (string - 1) * instance.fretHeight + YMARGIN() / size / 2 + 4.5 + 'px')
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
                    .style("stroke", 'var(--primary-color)')
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

    /* è usato nel .set() cancella le note, cancella la tastiera e la ricostituisce. */
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
