const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const VersionSchema = mongoose.Schema({
    _id: Schema.Types.ObjectId,
    title: String,
    content: String,
    versionNumber: Number,
    notes: [{ type: Schema.Types.ObjectId, ref: 'Note' }],

}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const NoteSchema = mongoose.Schema({
    versions: [{ type: Schema.Types.ObjectId, ref: 'Version' }],
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })


module.exports = {
    Note: mongoose.model('Note', NoteSchema),
    Version: mongoose.model('Version', VersionSchema),
}
