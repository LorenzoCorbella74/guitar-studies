class State {

    constructor() {
        this.state = {};
        if (localStorage.getItem('frets')) {
            this.state.studies = JSON.parse(localStorage.getItem('frets'));
        } else {
            this.state.studies = [];
        }
    }

    updateState (payload) {
        this.state.studies = payload;
        localStorage.setItem('frets', JSON.stringify(this.state.studies));
    }

    getState () {
        return this.state.studies;
    }

    saveOrUpdate (payload) {
        let currentStudyId = this.state.studies.findIndex(e => e.studyId === payload.studyId);
        if (currentStudyId > -1) {
            this.state.studies[currentStudyId] = payload;   // update
        }
        else {
            this.state.studies.push(payload);               // create
        }
        localStorage.setItem('frets', JSON.stringify(this.state.studies));
    }
}

export default new State(); // SINGLETON !!!