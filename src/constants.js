// Music
export const allNotes = [
    "c",
    "c#",
    "d",
    "d#",
    "e",
    "f",
    "f#",
    "g",
    "g#",
    "a",
    "a#",
    "b",
];

export const allNotesEnh = [
    "c",
    "db",
    "d",
    "eb",
    "fb",
    "f",
    "gb",
    "g",
    "ab",
    "a",
    "bb",
    "cb",
];

export const colors = [
    "red",
    "green",
    "blue",
    "black",
    "purple",
    "gray",
    "orange",
    "lightgray",
];

// tutte partono da C...
export const Scales = {
    // scales
    lydian: "c d e f# g a b",
    major: "c d e f g a b",
    mixolydian: "c d e f g a bb",
    dorian: "c d eb f g a bb",
    aeolian: "c d eb f g ab bb",
    phrygian: "c db eb f g ab bb",
    locrian: "c db eb f gb ab bb",
    "harmonic-minor": "c d eb f g ab b",
    "melodic-minor": "c d eb f g a b",
    "minor-pentatonic": "c eb f g bb",
    "minor-blues": "c eb f f# g bb",
    "major-pentatonic": "c d e g a",
    "major-blues": "c d d# e g a",
    "composite-blues": "c d d# e f f# g a bb",
    "dom-pentatonic": "c e f g bb",
    japanese: "c db f g ab",
    // chords
    maj: "c e g",
    aug: "c e g#",
    min: "c eb g",
    dim: "c eb gb",
    maj7: "c e g b",
    7: "c e g bb",
    min7: "c eb g bb",
    m7b5: "c eb gb bb",
    dim7: "c eb gb a",
    _: function (scale) {
        return Scales[scale].split(" ");
    },
};

export const allIntervals = ["1P","2m","2M","3m","3M","4P","5d","5P","6m","6M","7m","7M"];

// Fretboard
export const Tunings = {
    bass4: {
        standard: ["e1", "a1", "d2", "g2", "b2", "e3"],
    },
    guitar6: {
        standard: ["e2", "a2", "d3", "g3", "b3", "e4"],
        E_4ths: ["e2", "a2", "d3", "g3", "c4", "f4"],
        Drop_D: ["d2", "a2", "d3", "g3", "b3", "e4"],
        G_open: ["d2", "g2", "d3", "g3", "b3", "d4"],
        DADGAD: ["d2", "a2", "d3", "g3", "a3", "d4"],
    },
    guitar7: {
        standard: ["b2", "e2", "a2", "d3", "g3", "b3", "e4"],
        E_4ths: ["b2", "e2", "a2", "d3", "g3", "c3", "f4"],
    },
};