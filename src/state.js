class State {

    constructor() {
        if (localStorage.getItem('frets')) {
            this.state = JSON.parse(localStorage.getItem('frets'));
        } else {
            this.state = [];
        }
    }

    forceSetState (payload) {
        this.state = payload;
        localStorage.setItem('frets', JSON.stringify(this.state));
    }

    getState () {
        return this.state;
    }

    saveOrUpdate (payload) {
        let currentStudyId = this.state.findIndex(e => e.studyId === payload.studyId);
        if (currentStudyId > -1) {
            this.state[currentStudyId] = payload;
        }
        else {
            this.state.push(payload);
        }
        localStorage.setItem('frets', JSON.stringify(this.state));
    }
}

export default new State(); // SINGLETON !!!