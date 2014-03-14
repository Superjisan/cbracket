
/*
 * GET users listing.
 */
var stripe = require('stripe')("BwjNUBnpdszFnKv0G43MJy3V2XjMOE30");
var models = require('../models/connect');

exports.list = function(req, res){
  res.send("respond with a resource");
};

exports.donate = function(req, res){
  //
  if(!req.user){
    stripe.charges.create({
      amount: req.body.amount,
      currency: req.body.currency || "USD",
      card: req.body.stripeToken,
      description: req.body.description || null
    }, function(err, charge){
      res.render('success_receipt', {charge: charge});
    });
  } else{
    var stripeToken = req.body.stripeToken;
    models.User.findOne({_id: req.user._id}, function(err, user){
      // console.log(req.body.amount);
      // console.log(typeof req.body.amount);
      // console.log(parseInt(req.body.amount));
      if(err) return err;
      if(user.stripe_id){
        stripe.charges.create({
          amount: parseInt(req.body.amount),
          currency: req.body.currency,
          customer: user.stripe_id
        }, function(err, charge){
          res.render('success_receipt', {charge: charge});
        });
      } else{
        stripe.customers.create({
          card: stripeToken,
          email: req.user.email
        }).then(function(customer){
          user.stripe_id = customer.id;
          return stripe.charges.create({
            amount: 10000,
            currency: req.body.currency,
            customer: customer.id
          }, function(err, charge){
            user.save(function(err){
              console.log(typeof charge);
              res.render('success_receipt', {charge: charge});
            });
          });
        });
      }
    });
  }
};

exports.donate_page = function(req, res){
  res.render('donation', {user: req.user ? req.user : false});
};
