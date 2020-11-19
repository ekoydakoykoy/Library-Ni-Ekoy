const express = require('express');
const Author = require('../models/author');
const Book = require('../models/book');
const router = express.Router();

// all authors route
router.get('/', async (req, res) => {
    let searchOptions = {};
    if( req.query.name != null && req.query.name !== '' ) {
        searchOptions.name = new RegExp(req.query.name,'i');
    }
    try {
        const authors = await Author.find(searchOptions);
        res.render('authors/index', { 
            authors: authors,
            searchOptions: req.query
        });
    } catch {
        res.redirect('/')
    }    
});

// new author route
router.get('/new', (req, res) => {
    res.render('authors/new', { author: new Author() });
});

// create author route
router.post('/', async(req, res) => {    
    const author = new Author({
        name: req.body.name
    });
    try{
        const newAuthor = await author.save();
             res.redirect(`authors/${newAuthor.id}`)                    
    } catch {
        let locals = { errorMessage : "Error creating an author" }
        res.render('authors/new', {
            author: author,
            locals: locals       
        });   
    }     
});

// show author
router.get('/:id', async (req, res) => {    
    try {
        const  author = await Author.findById(req.params.id);
        const  books = await Book.find({ author: author.id }).limit(6).exec();
        res.render('authors/show', {
            author: author,
            booksByAuthor: books
        });
    } catch {
        res.redirect('/');
    }    
});

// edit author
router.get('/:id/edit',  async (req, res) => {
    try {
        const  author = await Author.findById(req.params.id);
        res.render('authors/edit', { author: author });   
    } catch {
        res.redirect('/authors');
    }
    
});

// update and delete cannot be done in browser so we install method-override
// update author
router.put('/:id',  async (req, res) => {
   let author;
    try{        
        author = await Author.findById(req.params.id);
        author.name = req.body.name;
        await author.save();
        res.redirect(`/authors/${author.id}`);                      
    } catch {
        if( author == null ){
            res.redirect('/');
        } else {
            let locals = { errorMessage : "Error updating an author" }
            res.render('authors/edit', {
                author: author,
                locals: locals       
            });  
        }  
    }    
});

// delete author
router.delete('/:id', async (req, res) => {
    let author;
    try{        
        author = await Author.findById(req.params.id);    
        await author.remove();
        res.redirect(`/authors`);                       
    } catch {
        if( author == null ){
            res.redirect('/');
        } else {
            res.redirect(`/authors/${author.id}`);
        }  
    } 
});

module.exports = router;