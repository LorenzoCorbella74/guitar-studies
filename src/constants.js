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

export const COLOURS_MERGE = ['#F4D03F', '#b3e5fc', '#bdbdbd'];

export const COLOURS = {
    "1P": '#ffee58',
    "2m": '#b3e5fc',
    "2M": '#87CEFA',
    "2A": '#87CEFA',
    "3m": '#ffcc80',
    "3M": '#ffa726',
    "4P": '#a5d6a7',
    "4A": '#66bb6a',
    "5d": '#e57373',
    "5P": '#FF4136',
    "5A": '#f44336',
    "6m": '#f8bbd0',
    "6M": '#f48fb1',
    "7d": '#e0e0e0',
    "7m": '#bdbdbd',
    "7M": '#9e9e9e'
};

export const allIntervals = ["1P", "2m", "2M", "3m", "3M", "4P", "5d", "5P", "6m", "6M", "7m", "7M"];

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