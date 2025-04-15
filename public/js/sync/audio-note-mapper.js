class AudioNoteMapper {

    static distinctLocalAudioNotes(notes) {
        const distinctNotes = [];
        const noteIds = [];

        notes.forEach(note => {
            if (!noteIds.includes(note.id)) {
                distinctNotes.push(note);
                noteIds.push(note.id);
            }
        });

        return distinctNotes;
    }

    static toRemoteAudioNote(notes) {
        return notes.filter(note => note?.uploaded !== false).map(
            note => ({
                id: note.id,
                page: note.page,
                x: note.x,
                y: note.y,
            })
        );
    }

    static toLocalAudioNotes({
        remoteNotes,
        localNotes,
    }) {
        return AudioNoteMapper.distinctLocalAudioNotes([
            ...remoteNotes.map(
                note => ({
                    id: note.id,
                    page: note.page,
                    x: note.x,
                    y: note.y,
                    uploaded: true,
                })
            ),
            ...localNotes.map(
                note => ({
                    id: note.id,
                    page: note.page,
                    x: note.x,
                    y: note.y,
                    uploaded: false,
                })
            )
        ]);
    }
}

module.exports = AudioNoteMapper;