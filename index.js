const express = require('express');
const app = express();

app.get('/tfjs', (req, res) => {
    res.sendFile(__dirname + '/index.html')
});

app.use(express.static('public'));
app.use('/scripts', express.static(__dirname + 'public/scripts'))
app.use('/css', express.static(__dirname + 'public/css'))

app.listen(3000, console.log('Listening on port 3000'));