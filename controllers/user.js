const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const dotenv = require('dotenv');
const validator = require("email-validator");

dotenv.config();

exports.signup = (req, res, next) => {
    const isValidateEmail = validator.validate(req.body.email);
    if (!isValidateEmail) {
      res.writeHead(400, 'Email incorrect !"}', {
        "content-type": "application/json",
      });
      res.end("Le format de l'email est incorrect.");
    } else {
      bcrypt
        .hash(req.body.password, 10)
        .then((hash) => {
          const user = new User({
            email: req.body.email,
            password: hash,
          });
          user
            .save()
            .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
            .catch((error) => res.status(400).json({ error }));
        })
        .catch((error) => res.status(500).json({ error }));
    }
  };

exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email })
       .then(user => {
           if (!user) {
               return res.status(401).json({ error: 'Paire login/mot de passe incorrecte' });
           }
           bcrypt.compare(req.body.password, user.password)
               .then(valid => {
                   if (!valid) {
                       return res.status(401).json({ error: 'Paire login/mot de passe incorrecte' });
                   }
                   res.status(200).json({
                       userId: user._id,
                       token: jwt.sign(
                           { userId: user._id },
                           process.env.PRIVATEKEY,
                           { expiresIn: '24h' }
                       )
                   });
               })
               .catch(error => res.status(500).json({ error }));
       })
       .catch(error => res.status(500).json({ error }));
};