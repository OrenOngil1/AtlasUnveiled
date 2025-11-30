import express from 'express'; //imports Express.js

const app = express();  //creates application instance
const port = process.env.PORT;

app.get(`/`, (req, res) => {
    res.send(`Hello World`);
});

app.listen(port, () => {
    console.log(`example app listening on port ${port}`);
});