const express = require('express');
const passport = require('passport');
const session = require('cookie-session');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const request = require('request');

const app = express();
app.set('view engine', 'ejs');
app.use(session({name: '3rd-party', keys: ['key'], maxAge: 24 * 60 * 60 * 1000}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => res.render('index', {user: req.session.passport.user}));
app.post('/logout', (req, res) => {
  delete req.session.passport;
  res.redirect('/');
});

// CANpass integration
const clientID = 'YOUR_CLIENT_ID';
const clientSecret = 'YOUR_CLIENT_SECRET';
const callbackURL = 'YOUR_CALLBACK_URL';

passport.use(new OAuth2Strategy({
  authorizationURL: 'https://canpass.me/oauth2/authorize',
  tokenURL: 'https://canpass.me/oauth2/token',
  state: true,
  clientID,
  clientSecret,
  callbackURL
}, (accessToken, refreshToken, params, profile, done) => {
  request.post({
    url: 'https://api.canpassme.app/graphql',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    json: {
      query: `query {
        me {
          id
          name
          email
          path
          resourceUrl
        }
      }`
    }
  }, (error, response, {data: {me}}) => {
    if (error || response.statusCode !== 200) {
      return done(error);
    }

    // With the user information, you may want to create and store a user in your database
    console.log("accessToken", accessToken);
    console.log("The authenticated user", me);
    done(null, me);
  });
}));
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.get('/auth/cryptobadge', passport.authenticate('oauth2', {scope: ['email']}));
app.get('/auth/cryptobadge/callback', passport.authenticate('oauth2'), (req, res) => res.redirect('/'));

app.listen(3002);
