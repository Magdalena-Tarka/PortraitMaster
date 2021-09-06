const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    const titlePattern = new RegExp(/(([A-z|0-9]|\s|\,|\;|\:|\.|\-|\!)*)/, 'g');
    const titleMatched = title.match(titlePattern).join('');

    const authorPattern = new RegExp(/(([A-z|0-9]|\s|\.|\-|\_)*)/, 'g');
    const authorMatched = author.match(authorPattern).join('');

    const emailPattern = new RegExp(/^[A-z0-9_.-]+@[A-z0-9.-]+\.[a-zA-Z]{2,3}/, 'g');
    const emailMatched = email.match(emailPattern).join('');

    const fileExt = file.name.split('.').slice(-1)[0];

    if(title && author && email && file    // if fields are not empty...
      && (fileExt === 'jpg' || 'png' || 'gif')
      && titleMatched.length === title.length
      && authorMatched.length === author.length
      && emailMatched.length === email.length
    ) { 

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    const clientIp = requestIp.getClientIp(req);
    const voter = await Voter.findOne({ user: clientIp });

    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      if(!voter) {
        
        const newVoter = new Voter({ user: clientIp, votes: photoToUpdate._id });
        await newVoter.save();

      } else {

        if(voter.votes.includes(req.params.id)) {
          throw new Error('You\'ve already voted on this picture!');

        } else {
          voter.votes.push(photoToUpdate._id);
          await voter.save();
        }
      }
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });
    }
  } catch(err) {
    res.status(500).json(err);
  }

};
