import "./styles.css";

// Components
import MyFretboard from './components/fretboard/fretboard';
import List from './components/list/list';

export const state = [
    {
        studyId:'study123',
        title:"prova1",
        favourite: false,
        date: '12/04/2020'
    },
    {
        studyId:'study456',
        title:"prova2",
        favourite: false,
        date: '16/02/2020'
    }
];

window.onload = function () {

    /* let mock = {"title":"titolo","description":"Descrizione... bella lunga","tags":["prova","test"],"progress":"0","frets":{"fretboard574697":{"id":"fretboard574697","frets":15,"startFret":0,"strings":6,"stringsVisibility":[1,1,1,1,1,1],"tuning":["e2","a2","d3","g3","b3","e4"],"fretWidth":46,"fretHeight":32,"leftHanded":false,"showTitle":false,"notes":[],"layers":[{"id":146710,"parentId":"fretboard574697","root":"A","scale":"dorian","value":"A dorian","notes":["A","B","C","D","E","F#","G"],"intervals":["1P","2M","3m","4P","5P","6M","7m"],"visible":true,"notesVisibility":[1,1,1,1,1,1,1],"tuning":"E_std","whatToShow":"degrees","size":1,"opacity":1,"color":"one","differences":"own","notesForString":3,"fingering":"all","note":"","reduced":["egyptian","minor pentatonic","minor six pentatonic","flat three pentatonic"],"extended":["bebop minor","composite blues","chromatic"],"scaleChords":["5","sus4","7sus4","m","m7","m6","4","madd4","m7add11","sus2","sus24","11","9sus4","13sus4","madd9","m9","m69","m13","m11"],"modeNames":[["1P","dorian"],["2M","phrygian"],["3m","lydian"],["4P","mixolydian"],["5P","aeolian"],["6M","locrian"],["7m","major"]],"fingerings":["6:A2:1P 6:B2:2M 6:C3:3m 5:D3:4P 5:E3:5P 5:F#3:6M 4:G3:7m 4:A3:1P 4:B3:2M 3:C4:3m 3:D4:4P 3:E4:5P 2:F#4:6M 2:G4:7m 2:A4:1P 1:B4:2M 1:C5:3m 1:D5:4P ","6:B2:2M 6:C3:3m 6:D3:4P 5:E3:5P 5:F#3:6M 5:G3:7m 4:A3:1P 4:B3:2M 4:C4:3m 3:D4:4P 3:E4:5P 3:F#4:6M 2:G4:7m 2:A4:1P 2:B4:2M 1:C5:3m 1:D5:4P 1:E5:5P ","6:C3:3m 6:D3:4P 6:E3:5P 5:F#3:6M 5:G3:7m 5:A3:1P 4:B3:2M 4:C4:3m 4:D4:4P 3:E4:5P 3:F#4:6M 3:G4:7m 2:A4:1P 2:B4:2M 2:C5:3m 1:D5:4P 1:E5:5P 1:F#5:6M ","6:D3:4P 6:E3:5P 6:F#3:6M 5:G3:7m 5:A3:1P 5:B3:2M 4:C4:3m 4:D4:4P 4:E4:5P 3:F#4:6M 3:G4:7m 3:A4:1P 2:B4:2M 2:C5:3m 2:D5:4P 1:E5:5P 1:F#5:6M 1:G5:7m ","6:E2:5P 6:F#2:6M 6:G2:7m 5:A2:1P 5:B2:2M 5:C3:3m 4:D3:4P 4:E3:5P 4:F#3:6M 3:G3:7m 3:A3:1P 3:B3:2M 2:C4:3m 2:D4:4P 2:E4:5P 1:F#4:6M 1:G4:7m 1:A4:1P ","6:F#2:6M 6:G2:7m 6:A2:1P 5:B2:2M 5:C3:3m 5:D3:4P 4:E3:5P 4:F#3:6M 4:G3:7m 3:A3:1P 3:B3:2M 3:C4:3m 2:D4:4P 2:E4:5P 2:F#4:6M 1:G4:7m 1:A4:1P 1:B4:2M ","6:G2:7m 6:A2:1P 6:B2:2M 5:C3:3m 5:D3:4P 5:E3:5P 4:F#3:6M 4:G3:7m 4:A3:1P 3:B3:2M 3:C4:3m 3:D4:4P 2:E4:5P 2:F#4:6M 2:G4:7m 1:A4:1P 1:B4:2M 1:C5:3m "]},{"id":982491,"parentId":"fretboard574697","root":"C","scale":"major pentatonic","value":"C major pentatonic","notes":["C","D","E","G","A"],"intervals":["1P","2M","3M","5P","6M"],"visible":true,"notesVisibility":[1,1,1,1,1],"tuning":"E_std","whatToShow":"degrees","size":1,"opacity":1,"color":"many","differences":"own","notesForString":2,"fingering":"all","note":"","reduced":[],"extended":["major blues","lydian dominant","lydian","mixolydian","major","bebop","bebop minor","bebop major","composite blues","chromatic"],"scaleChords":["5","M","6","sus2","Madd9"],"modeNames":[["1P","major pentatonic"],["2M","egyptian"],["3M","malkos raga"],["5P","ritusen"],["6M","minor pentatonic"]],"fingerings":["6:C3:1P 6:D3:2M 5:E3:3M 5:G3:5P 4:A3:6M 4:C4:1P 3:D4:2M 3:E4:3M 2:G4:5P 2:A4:6M 1:C5:1P 1:D5:2M ","6:D3:2M 6:E3:3M 5:G3:5P 5:A3:6M 4:C4:1P 4:D4:2M 3:E4:3M 3:G4:5P 2:A4:6M 2:C5:1P 1:D5:2M 1:E5:3M ","6:E2:3M 6:G2:5P 5:A2:6M 5:C3:1P 4:D3:2M 4:E3:3M 3:G3:5P 3:A3:6M 2:C4:1P 2:D4:2M 1:E4:3M 1:G4:5P ","6:G2:5P 6:A2:6M 5:C3:1P 5:D3:2M 4:E3:3M 4:G3:5P 3:A3:6M 3:C4:1P 2:D4:2M 2:E4:3M 1:G4:5P 1:A4:6M ","6:A2:6M 6:C3:1P 5:D3:2M 5:E3:3M 4:G3:5P 4:A3:6M 3:C4:1P 3:D4:2M 2:E4:3M 2:G4:5P 1:A4:6M 1:C5:1P "]}],"where":"[data-id='fretboard574697'] .col-output .fret","width":784,"height":226,"svgContainer":{"_groups":[[{}]],"_parents":[{}]},"selectedIndex":982491},"fretboard224704":{"id":"fretboard224704","frets":15,"startFret":0,"strings":6,"stringsVisibility":[1,1,1,1,1,1],"tuning":["e2","a2","d3","g3","b3","e4"],"fretWidth":46,"fretHeight":32,"leftHanded":false,"showTitle":false,"notes":[],"layers":[{"id":326118,"parentId":"fretboard224704","root":"F","scale":"harmonic minor","value":"F harmonic minor","notes":["F","G","Ab","Bb","C","Db","E"],"intervals":["1P","2M","3m","4P","5P","6m","7M"],"visible":true,"notesVisibility":[1,1,1,1,1,1,1],"tuning":"E_std","whatToShow":"degrees","size":1,"opacity":1,"color":"many","differences":"own","notesForString":3,"fingering":3,"note":"","reduced":["minor #7M pentatonic","minor hexatonic"],"extended":["minor bebop","minor six diminished","chromatic"],"scaleChords":["5","M7#5sus4","sus4","M7sus4","m#5","mb6M7","m","m/ma7","mMaj7b6","madd4","sus2","M9#5sus4","sus24","M9sus4","madd9","mMaj9","mMaj9b6"],"modeNames":[["1P","harmonic minor"],["2M","locrian 6"],["3m","major augmented"],["4P","dorian #4"],["5P","phrygian dominant"],["6m","lydian #9"],["7M","ultralocrian"]],"fingerings":["6:F2:1P 6:G2:2M 6:Ab2:3m 5:Bb2:4P 5:C3:5P 5:Db3:6m 4:E3:7M 4:F3:1P 4:G3:2M 3:Ab3:3m 3:Bb3:4P 3:C4:5P 2:Db4:6m 2:E4:7M 2:F4:1P 1:G4:2M 1:Ab4:3m 1:Bb4:4P ","6:G2:2M 6:Ab2:3m 6:Bb2:4P 5:C3:5P 5:Db3:6m 5:E3:7M 4:F3:1P 4:G3:2M 4:Ab3:3m 3:Bb3:4P 3:C4:5P 3:Db4:6m 2:E4:7M 2:F4:1P 2:G4:2M 1:Ab4:3m 1:Bb4:4P 1:C5:5P ","6:Ab2:3m 6:Bb2:4P 6:C3:5P 5:Db3:6m 5:E3:7M 5:F3:1P 4:G3:2M 4:Ab3:3m 4:Bb3:4P 3:C4:5P 3:Db4:6m 3:E4:7M 2:F4:1P 2:G4:2M 2:Ab4:3m 1:Bb4:4P 1:C5:5P 1:Db5:6m ","6:Bb2:4P 6:C3:5P 6:Db3:6m 5:E3:7M 5:F3:1P 5:G3:2M 4:Ab3:3m 4:Bb3:4P 4:C4:5P 3:Db4:6m 3:E4:7M 3:F4:1P 2:G4:2M 2:Ab4:3m 2:Bb4:4P 1:C5:5P 1:Db5:6m 1:E5:7M ","6:C3:5P 6:Db3:6m 6:E3:7M 5:F3:1P 5:G3:2M 5:Ab3:3m 4:Bb3:4P 4:C4:5P 4:Db4:6m 3:E4:7M 3:F4:1P 3:G4:2M 2:Ab4:3m 2:Bb4:4P 2:C5:5P 1:Db5:6m 1:E5:7M 1:F5:1P ","6:Db2:6m 6:E2:7M 6:F2:1P 5:G2:2M 5:Ab2:3m 5:Bb2:4P 4:C3:5P 4:Db3:6m 4:E3:7M 3:F3:1P 3:G3:2M 3:Ab3:3m 2:Bb3:4P 2:C4:5P 2:Db4:6m 1:E4:7M 1:F4:1P 1:G4:2M ","6:E2:7M 6:F2:1P 6:G2:2M 5:Ab2:3m 5:Bb2:4P 5:C3:5P 4:Db3:6m 4:E3:7M 4:F3:1P 3:G3:2M 3:Ab3:3m 3:Bb3:4P 2:C4:5P 2:Db4:6m 2:E4:7M 1:F4:1P 1:G4:2M 1:Ab4:3m "]}],"where":"[data-id='fretboard224704'] .col-output .fret","width":784,"height":226,"svgContainer":{"_groups":[[{}]],"_parents":[{}]},"selectedIndex":326118},"fretboard221902":{"id":"fretboard221902","frets":15,"startFret":0,"strings":6,"stringsVisibility":[1,1,1,1,1,1],"tuning":["e2","a2","d3","g3","b3","e4"],"fretWidth":46,"fretHeight":32,"leftHanded":false,"showTitle":false,"notes":[],"layers":[{"id":870597,"parentId":"fretboard221902","root":"E","scale":"minor six pentatonic","value":"E minor six pentatonic","notes":["E","G","A","B","C#"],"intervals":["1P","3m","4P","5P","6M"],"visible":true,"notesVisibility":[1,1,1,1,1],"tuning":"E_std","whatToShow":"degrees","size":1,"opacity":1,"color":"many","differences":"own","notesForString":2,"fingering":"all","note":"","reduced":[],"extended":["dorian b2","melodic minor","neopolitan major","dorian","bebop minor","minor six diminished","composite blues","chromatic"],"scaleChords":["5","sus4","m","m6","madd4"],"modeNames":[["1P","minor six pentatonic"]],"fingerings":["6:E2:1P 6:G2:3m 5:A2:4P 5:B2:5P 4:C#3:6M 4:E3:1P 3:G3:3m 3:A3:4P 2:B3:5P 2:C#4:6M 1:E4:1P 1:G4:3m ","6:G2:3m 6:A2:4P 5:B2:5P 5:C#3:6M 4:E3:1P 4:G3:3m 3:A3:4P 3:B3:5P 2:C#4:6M 2:E4:1P 1:G4:3m 1:A4:4P ","6:A2:4P 6:B2:5P 5:C#3:6M 5:E3:1P 4:G3:3m 4:A3:4P 3:B3:5P 3:C#4:6M 2:E4:1P 2:G4:3m 1:A4:4P 1:B4:5P ","6:B2:5P 6:C#3:6M 5:E3:1P 5:G3:3m 4:A3:4P 4:B3:5P 3:C#4:6M 3:E4:1P 2:G4:3m 2:A4:4P 1:B4:5P 1:C#5:6M ","6:C#3:6M 6:E3:1P 5:G3:3m 5:A3:4P 4:B3:5P 4:C#4:6M 3:E4:1P 3:G4:3m 2:A4:4P 2:B4:5P 1:C#5:6M 1:E5:1P "]}],"where":"[data-id='fretboard221902'] .col-output .fret","width":784,"height":226,"svgContainer":{"_groups":[[{}]],"_parents":[{}]},"selectedIndex":870597}}};
    let mock2 = [];
    window.fretboard = new MyFretboard(mock2); */

    new App();


}

class App {
    constructor(){
        this.changeRoute('list'); // loading the list as default
    }

    changeRoute(where, data){
        if(where==='list'){
            new List(this);
        } else if(where ==='study'){
            new MyFretboard(this, data);
        }
    }
}

