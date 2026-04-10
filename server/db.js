const mongoose = require('mongoose');
const { preinitModule } = require('react-dom');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017');
        console.log('MongoDB connected');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

module.exports = connectDB;