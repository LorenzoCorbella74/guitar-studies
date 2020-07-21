export default class State {

    constructor(app) {
        this.app = app;
        this.db = this.app.db.firestore().collection('studies');    // si richiama il db inizizlizzato in index.js
        this.studies = [];
    }

    getState () {
        this.studies = [];
         return this.db
            .where('userId', '==', this.app.user.user.uid)
            .get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    let i = this.studies.findIndex(x => x.id == doc.id && doc.data().userId === this.app.user.user.uid);
                    // Se non trova elementi con lo stesso id e dello stesso autore l'aggiunge
                    if (i == -1 && doc.data().userId === this.app.user.user.uid) {
                        this.studies.push({
                            studyId: doc.id,
                            img: doc.data().img,
                            userId: doc.data().userId,
                            title: doc.data().title,
                            description: doc.data().description,
                            favourite: doc.data().favourite,
                            progress: doc.data().progress,
                            tags: doc.data().tags,
                            creation: doc.data().creation,
                            frets: doc.data().frets,
                            progs: doc.data().progs
                        });
                    }
                });
                return this.studies;
            })
            .catch(error => {
                alert('Error getting studies: ', error);
            });
    }

    // TODO: 
    unsubscribe () {
        this.db.onSnapshot(snapshot => {
            /* snapshot.docChanges().forEach(change => {
              if (change.type === 'added') {
                const Item = { ...change.doc.data(), id: change.doc.id };
                console.log('Item was added: ', Item);
              }
              if (change.type === 'modified') {
                const updatedNote = this.studies.find(item => item.id === change.doc.id);
                console.log('item was updated: ', updatedNote);
              }
              if (change.type === 'removed') {
                const deletedNote = this.studies.find(item => item.id === change.doc.id);
                console.log('Item was removed: ', deletedNote);
              }
            }); */
        });
    }

    create (newItem) {
        return this.db
            .add(newItem)
            .then(docRef => {
                newItem.id = docRef.id;
                this.studies.push(newItem);
                return newItem;
            })
            .catch(error => {
                alert('Error adding study: ', error);
            });
    }

    update (editedId, newItem) {
        return this.db
            .doc(editedId)
            .update(newItem)
            .then(docRef => {
                // aggiorna il modello FE
                let theIndex = this.studies.findIndex(x => x.id == editedId);
                this.studies[theIndex] = newItem;
                return newItem;
            })
            .catch(error => {
                alert('Error editing study: ', error);
            });
    }

    delete (itemId) {
        let i = this.studies.findIndex(x => x.id == itemId);
        return this.db
            .doc(itemId)
            .delete()
            .then(() => {
                this.studies.splice(i, 1);
                return {success:true}
            })
            .catch(error => {
                alert('Error removing study: ', error);
            });
    }
}