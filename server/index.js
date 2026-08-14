const express = require('express');
import mongoose from 'mongoose';

const app = express()

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send("Server is running");

});
