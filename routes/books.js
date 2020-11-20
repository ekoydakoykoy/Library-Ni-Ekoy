const express = require('express');
const Author = require('../models/author');
const Book = require('../models/book');
const router = express.Router();
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

// all Books route
router.get('/', async (req, res) => {
    let query = Book.find();
    if( req.query.title != null && req.query.title != '' ){
        query = query.regex('title', new RegExp(req.query.title, 'i'));
    }
    if( req.query.publishBefore != null && req.query.publishBefore != '' ){
        query = query.lte('publishDate', req.query.publishBefore);
    }
    if( req.query.publishAfter != null && req.query.publishAfter != '' ){
        query = query.gte('publishDate', req.query.publishAfter);
    }
    try {
        const books = await query.exec();
        res.render('books/index', {
            books: books,
            searchOptions: req.query
       });
    } catch {
        res.redirect('/');
    }    
});

// new Book route
router.get('/new', async (req, res) => {    
    renderNewPage(res, new Book());
});

// create Book route
router.post('/',  async(req, res) => {    
    const fileName = req.file != null ? req.file.filename : null;
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,        
        description: req.body.description
    });

    saveCover(book, req.body.cover);

    try {
        const newBook = await book.save();   
        res.redirect(`books/${newBook.id}`)         
    } catch{   
        renderNewPage(res, book, true);        
    }
});

//show book route
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate('author').exec();
        res.render('books/show', { book : book });
    } catch {
        res.redirect('/');
    }
});

// edit Book route
router.get('/:id/edit', async (req, res) => {  
    try{
        const book = await Book.findById(req.params.id);
        renderEditPage(res, book);
    } catch {
        res.redirect('/');
    }    
});

// update Book route
router.put('/:id',  async(req, res) => {    
   let book;
    try {
        book = await Book.findById(req.params.id);
        book.title = req.body.title;
        book.author = req.body.author;
        book.publishDate = new Date(req.body.publishDate);
        book.pageCount = req.body.pageCount;        
        book.description = req.body.description;
        if( req.body.cover != null && req.body.cover !== '' ){
             saveCover(book, req.body.cover);  
        }
        await book.save();
        res.redirect(`/books/${book.id}`)                
    } catch (err) {   
        console.log(err);
        if( book != null ){
            renderEditPage(res, book,'edit', true);
        } else {
            res.redirect('/');
        }                
    }
});

// delete book
router.delete('/:id',  async(req, res) => {  
    let book;
    try {
        book = await Book.findById(req.params.id);
        await book.remove();
        res.redirect('/books');
    } catch (err){
        console.log(err);
        if( book != null ){
            res.render('books/show', {
                book: book,
                errorMessage: 'Could not delete book'
            });
        } else {
                res.redirect('/');
        }
    }
});      


async function renderNewPage(res, book, hasError = false){
    renderFormPage(res,book,'new',hasError);
}

async function renderEditPage(res, book, hasError = false){
    renderFormPage(res,book,'edit',hasError);
}

async function renderFormPage(res, book, form, hasError = false){
    try{
        const authors = await Author.find({});
        const params = {
            authors: authors,
            book: book  
        }
        if( hasError ){
            const errtext = form == 'new' ? 'Creating' : 'Updating';
            params.errorMessage = `Error ${errtext} book`;
        }        
        res.render(`books/${form}`, params);
    } catch {
        res.redirect('/books');
    }
}

function saveCover(book, coverEncoded ){
    if( coverEncoded == null) return
    const cover = JSON.parse(coverEncoded);
    if( cover != null && imageMimeTypes.includes(cover.type) ){
        book.coverImage = new Buffer.from(cover.data, 'base64');
        book.coverImageType = cover.type;
    }
}

module.exports = router;