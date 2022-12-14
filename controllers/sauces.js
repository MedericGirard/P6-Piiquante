
const Sauce = require('../models/sauces');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
    ...sauceObject,
    userID: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    likes: 0,
    dislikes: 0
  });
  sauce.save()
  .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
  .catch(error => { res.status(400).json({error })})
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({
      _id: req.params.id
    }).then(
      (sauce) => {
        res.status(200).json(sauce);
      }
    ).catch(
      (error) => {
        res.status(404).json({
          error: error
        });
      }
    );
  };

  exports.getAllSauce = (req, res, next) => {
    Sauce.find().then(
      (sauces) => {
        res.status(200).json(sauces);
      }
    ).catch(
      (error) => {
        res.status(400).json({
          error: error
        });
      }
    );
  };

  exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ?
    {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
    Sauce.updateOne({ _id: req.params.id} , {...sauceObject, _id: req.params.id})
    .then(()=> res.status(200).json({ message: 'Sauce modifiée'}))
    .catch(()=> res.status(400).json({ error}))
};
  
  exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id})
       .then(sauce => {
           if (sauce.userId != req.auth.userId) {
               res.status(401).json({message: 'Not authorized'});
           } else {
               const filename = sauce.imageUrl.split('/images/')[1];
               fs.unlink(`images/${filename}`, () => {
                   Sauce.deleteOne({_id: req.params.id})
                       .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                       .catch(error => res.status(401).json({ error }));
               });
           }
       })
       .catch( error => {
           res.status(500).json({ error });
       });
  };

  exports.likeSauce = ( req, res, next) => {
    const like = req.body.like;
    const userId = req.body.userId;
    const sauceId = req.params.id;

    if(like == 1) {
      Sauce.findOne({ _id: sauceId }) 
            .then((sauce) => {
                if(!sauce.usersLiked.includes(userId)) {
                    Sauce.updateOne(
                        { _id: sauceId },
                        {
                            $inc: {likes: 1},
                            $push: {usersLiked: userId}
                        }
                    )
                    .then(() => res.status(201).json({ message: 'Vous avez aimé cette sauce!'}))
                    .catch((error) => res.status(400).json({ error }));
                }
            })
        .catch((error) => res.status(400).json({ error }));
    }

    if(like == -1) {
      Sauce.findOne({ _id: sauceId })
        .then((sauce) => {
            if(!sauce.usersDisliked.includes(userId)) {
                Sauce.updateOne(
                    { _id: sauceId },
                    {
                        $inc: {dislikes: 1},
                        $push: {usersDisliked: userId}
                    }
                )
                .then(() => res.status(201).json({ message: 'Vous n\'avez pas aimé cette sauce!'}))
                .catch((error) => res.status(400).json({ error }));  
            }
        })
        .catch((error) => res.status(400).json({ error }));
    }

    if(like == 0) {
      Sauce.findOne({ _id: sauceId })
            .then((sauce) => {
                if(sauce.usersLiked.includes(userId)) {
                    Sauce.updateOne(
                        { _id: sauceId },
                        {
                            $inc: {likes: -1},
                            $pull: {usersLiked: userId}
                        }
                    )
                    .then(() => res.status(201).json({ message: 'Votre avez retiré votre Like'}))
                    .catch((error) => res.status(400).json({ error }));
                }

                if(sauce.usersDisliked.includes(userId)) {
                    Sauce.updateOne(
                        { _id: sauceId },
                        { 
                            $inc: {dislikes: -1},
                            $pull: {usersDisliked: userId}
                        }
                    )
                    .then(() => res.status(201).json({ message: 'Votre avez retiré votre Dislike'}))
                    .catch((error) => res.status(400).json({ error }));
                }
            })
            .catch((error) => res.status(400).json({ error }));
    }

  }
