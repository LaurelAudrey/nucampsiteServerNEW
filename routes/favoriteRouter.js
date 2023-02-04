const express = require('express');
const cors = require('./cors');
const authenticate = require('../authenticate');
const Favorite = require('../models/favorite');

const favoriteRouter = express.Router();

// Routes for /favorites
favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.statusCode(200))
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({ user: req.user._id })
    .populate('user')
    .populate('campsites')
    .then(favorites => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id }) // Find favorites document based on userID
    .then(favorites => {
        if (favorites) { // Check if favorites document exists
            req.body.forEach(favorite => { // Loop through request body and add favorite if doesn't exist
                if (!favorites.campsites.includes(favorite._id)) {
                    favorites.campsites.push(favorite)
                }
            })
            favorites.save()
            .then(favorites => {
                console.log('Favorites updated: ', favorites)
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            })
            .catch(err => next(err));
        } else { // Create favorites docucment if it doesn't exist
            Favorite.create({ user: req.user._id, campsites: req.body.map(campsite => campsite._id) })
            .then(favorites => {
                console.log('Favorites created: ', favorites);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            })
            .catch(err => next(err));
        }
    })
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOneAndDelete({ user: req.user._id })
    .then(favorites => {
        if (favorites) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorites);
        } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'plain/text');
            res.end('You do not have any favorites to delete.');
        }
    })
    .catch(err => next(err));
});

// Routes for /favorites/:campsiteId
favoriteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, (req, res) => res.statusCode(200))
.get(cors.cors, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    Favorite.findOne({ user: req.user._id })
    .then(favorites => {
      if (favorites) {
        if (!favorites.campsites.includes(req.params.campsiteId)) {
          favorites.campsites.push(req.params.campsiteId)
          favorites.save()
          .then(favorites => {
            console.log('Favorites updated: ', favorites)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.json(favorites)
          })
          .catch(err => next(err))
        } else {  // Notify that favorite is already in list
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain')
          res.end('That campsite is already in the list of favorites!');      
        }
      } else {  // Favorites document doesn't exist, create it
        Favorite.create({ user: req.user._id, campsites: [req.params.campsiteId] })
        .then(favorites => {
          console.log('Favorites list created with one item: ', favorites)
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.json(favorites)
        })
        .catch(err => next(err))
      }
    })
    .catch(err => next(err))
  })
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
    .then(favorites => {
        if (favorites) {
            favorites.campsites = favorites.campsites.filter(campsite => campsite.toString() !== req.params.campsiteId)
            favorites.save()
            .then(favorites => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            })
            .catch(err => next(err));
        } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('No favorites to delete.');
        }
    })
    .catch(err => next(err));
});

module.exports = favoriteRouter;