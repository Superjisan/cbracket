
/*
 * GET users listing.
 */
var stripe = require('stripe')("BwjNUBnpdszFnKv0G43MJy3V2XjMOE30");
var models = require('../models/connect');

exports.list = function(req, res){
  res.send("respond with a resource");
};

exports.donate = function(req, res){
  var stripe_amount = parseInt(req.body.amount)*100;
  if(!req.user){
    stripe.charges.create({
      amount: stripe_amount,
      currency: req.body.currency || "USD",
      card: req.body.stripeToken,
      description: req.body.description || null
    }, function(err, charge){
      res.render('success_receipt', {charge: charge, user: req.user});
    });
  } else{
    var stripeToken = req.body.stripeToken;
    models.User.findOne({_id: req.user._id}, function(err, user){
      
      donated_amount = user.donated_amount || 0;
      user.donated_amount = donated_amount + stripe_amount/100;
      
      if(err) return err;
      if(user.stripe_id){
        stripe.charges.create({
          amount: stripe_amount,
          currency: req.body.currency,
          customer: user.stripe_id
        }, function(err, charge){
          if (err) return err;
          user.save(function(err){
            res.render('success_receipt', {charge: charge, user: req.user});
          });
        });
      } else{
        stripe.customers.create({
          card: stripeToken,
          email: req.user.email
        }).then(function(customer){
          user.stripe_id = customer.id;
          return stripe.charges.create({
            amount: stripe_amount,
            currency: req.body.currency,
            customer: customer.id
          }, function(err, charge){
            if (err) return err;
            user.save(function(err){
              res.render('success_receipt', {charge: charge, user: req.user});
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
