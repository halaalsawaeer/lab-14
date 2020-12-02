'use strict';
require('dotenv').config();
const express = require('express');

const PORT = process.env.PORT || 3030;
const app = express();
const pg = require('pg');
const methodOverride = require('method-override');
const superagent = require('superagent');
const client = new pg.Client(process.env.DATABASE_URL)
app.use(express.static('./public'));
app.use(methodOverride('_method'));

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');


app.get('/', (req, res) => {
    let SQL = 'SELECT * FROM books;';
  client.query(SQL)
        .then(results => {
            res.render('pages/index', { books: results.rows });
        })

})


app.get('/search', (req, res) => {
    res.render('./pages/searches/new')
})

app.get('/books/:id', (req, res) => {
    let SQL = `SELECT * FROM books WHERE id =$1;`
    let values = [req.params.id];
    client.query(SQL, values)
        .then((results) => {
            res.render('pages/books/show', { books: results.rows[0] })
        })
})

app.post('/books', (req, res)=> {
    let SQL = `INSERT INTO books (title, author, isbn, image_url, description) VALUES ($1,$2,$3,$4,$5) RETURNING id;`
    let { title, author, isbn, image_url, description } = req.body;
    let safeValues = [title, author, isbn, image_url, description];
    
    client.query(SQL, safeValues)
    .then((results) => {
        res.redirect(`/books/${results.rows[0].id}`)
    })
    
});
 
app.put('/updateBooks/:id', (req,res) =>{

    let { title, author, isbn, image_url, description } = req.body;   
    let SQL = `UPDATE books SET title=$1,author=$2,isbn=$3,image_url=$4,description=$5 WHERE id=$6;`
    let safeValues = [title, author, isbn, image_url, description,req.params.id];
    
    client.query(SQL,safeValues)
    .then(()=>{
        res.redirect(`/books/${req.params.id}`)
    })
})

app.delete('/deleteBook/:id', (req,res) =>{
    let SQL = `DELETE FROM books WHERE id=$1;`
    let values =[req.params.id]

    client.query(SQL, values)
    .then(()=>{
        res.redirect(('/'))
    })
})


app.post('/searches', (req, res) => {
    
    var url;
    let bookSearch = req.body.bookname;

    if (req.body.myBook === 'title') {
        url = `https://www.googleapis.com/books/v1/volumes?q=${bookSearch}&intitle:${bookSearch}`;
    }
    else if (req.body.myBook === 'author') {
        url = `https://www.googleapis.com/books/v1/volumes?q=${bookSearch}&inauthor:${bookSearch}`;
    }

    superagent.get(url)
        .then(data => {
            let arr = data.body.items;
            let books = arr.map(book => {
                return new Book(book);
                
            });
            res.render('pages/searches/show', { bookData: books })

        })
        .catch(error => {
            res.render('pages/error');
        })
        
});



function Book(book) {
    this.title = book.volumeInfo.title;
    this.image = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.smallThumbnail : `https://i.imgur.com/J5LVHEL.jpg`;
    this.authors = book.volumeInfo.authors ? book.volumeInfo.authors[0] : 'Not avilabile';
    this.description = book.volumeInfo.description ? book.volumeInfo.description : 'Not avilabile';
    this.isbn = book.volumeInfo.industryIdentifiers[0].type;
 
}
app.get('*', (req, res) => {
    res.status(404).send('error error ! ');
})


client.connect()
    .then(() => {

        app.listen(PORT, () => {
            console.log(`Listening on PORT ${PORT}`)
        });
    });