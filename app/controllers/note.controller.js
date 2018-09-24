const models = require('../models/note.model.js');
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectId;

// Create and Save a new Note
exports.create = (req, res) => {
    // Validate request
    if (!req.body.content) {
        return res.status(400).send({
            message: "Note content can not be empty"
        });
    }


    var newversion = new models.Version({
        _id: new mongoose.Types.ObjectId(),
        title: req.body.title || 'Untitled Title',
        content: req.body.content,
        versionNumber: 1
    })

    newversion.save()
        .then(versiondata => {
            var note = new models.Note({
                versions: newversion._id
            });
            note.save()
                .then(notedata => {
                    models.Note.find({ _id: notedata._id }).populate('versions').exec(function (err, notes) {
                        if (err) {
                            return res.status(500).send({
                                message: err.message || "Some error occurred while creating the Note."
                            });
                        }
                        res.send(notes[0])
                    })
                })
                .catch(err => {
                    return res.status(500).send({
                        message: err.message || "Some error occurred while creating the Note."
                    });
                })
        }).catch(err => {
            return res.status(500).send({
                message: err.message || "Some error occurred while creating the Note."
            });
        });
};

// Retrieve and return all notes from the database.
exports.findAll = (req, res) => {
    models.Note.find()
        .populate('versions').exec(function (err, notes) {
            if (err) {
                res.status(500).send({
                    message: err.message || "Some error occurred while retrieving notes."
                });
            }
            res.send(notes);
        })
};

// // Find a single note with a noteId
exports.findOne = (req, res) => {
    models.Note.findById(ObjectId(req.params.noteId))
        .then(note => {
            if (!note) {
                return res.status(404).send({
                    message: "Note not found with id " + req.params.noteId
                });
            }
            models.Note.find({ _id: note._id }).populate('versions').exec(function (err, notes) {
                if (err) {
                    return res.status(500).send({
                        message: err.message || "Some error occurred while creating the Note."
                    });
                }
                res.send(notes[0])
            })
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({
                    message: "Note not found with id " + req.params.noteId
                });
            }
            return res.status(500).send({
                message: "Error retrieving note with id " + req.params.noteId
            });
        });
};

// Update a note identified by the noteId in the request
exports.update = (req, res) => {
    if (!req.body.content) {
        return res.status(400).send({
            message: "Note content can not be empty"
        });
    }

    // Find note and update it with the request body
    models.Note.findByIdAndUpdate(ObjectId(req.params.noteId), {

    }, { new: true })
        .then(note => {
            if (!note) {
                return res.status(404).send({
                    message: "Note not found with id " + req.params.noteId
                });
            } else {
                let timeInMss = Date.now()
                let latestVersionId = note.versions[note.versions.length - 1]
                models.Note.find({ _id: note._id }).populate('versions').exec(function (err, notes) {
                    let latestUpdatedTime = new Date(notes[0].versions[notes[0].versions.length - 1].updated_at)
                    if (timeInMss - latestUpdatedTime.getTime() > 60000) {
                        console.log("Time Difference")
                        var newversion = new models.Version({
                            _id: new mongoose.Types.ObjectId(),
                            title: req.body.title || 'Untitled Title',
                            content: req.body.content,
                            versionNumber: note.versions.length + 1
                        })
                        newversion.save()
                            .then(newVersion => {
                                note.versions.push(newversion)
                                note.save().then(notedata => {
                                    models.Note.find({ _id: note._id }).populate('versions').exec(function (err, notes) {
                                        if (err) {
                                            return res.status(500).send({
                                                message: err.message || "Some error occurred while creating the Note."
                                            });
                                        }
                                        res.send(notes[0])
                                    })
                                })
                            }).catch(err => {
                                return res.status(500).send({
                                    message: err.message || "Some error occurred while creating the Note."
                                });
                            });
                    } else {

                        notes[0].versions[notes[0].versions.length - 1].title = req.body.title || 'Untitled Title'
                        notes[0].versions[notes[0].versions.length - 1].content = req.body.content
                        notes[0].versions[notes[0].versions.length - 1].save(function (err) {
                            if (err) {
                                return res.status(500).send({
                                    message: err.message || "Some error occurred while creating the Note."
                                });
                            }
                            res.send(notes[0])
                        })
                    }
                })



            }
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({
                    message: "Note not found with id " + req.params.noteId
                });
            }
            return res.status(500).send({
                message: "Error updating note with id " + req.params.noteId
            });
        });
};

// Delete a note with the specified noteId in the request
exports.delete = (req, res) => {
    models.Note.findByIdAndRemove(ObjectId(req.params.noteId))
        .then(note => {
            if (!note) {
                return res.status(404).send({
                    message: "Note not found with id " + req.params.noteId
                });
            }
            models.Note.find()
                .populate('versions').exec(function (err, notes) {
                    if (err) {
                        res.status(500).send({
                            message: err.message || "Some error occurred while retrieving notes."
                        });
                    }
                    res.send(notes);
                })
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return res.status(404).send({
                    message: "Note not found with id " + req.params.noteId
                });
            }
            return res.status(500).send({
                message: "Could not delete note with id " + req.params.noteId
            });
        });
};