# CryptoBadge Login for the Webapp

This example is a webapp written in [Express](https://expressjs.com/) and [Passport OAuth 2.0](http://www.passportjs.org/packages/passport-oauth2/) in Node.js, and demonstrates how to 'Login with CryptoBadge' for a web app executing on the server. If you are not familiar with Node, see [Understanding the Example](#understanding-the-example) section which may help you build a login flow manually.

Make sure that you have installed [Node.js](https://nodejs.org/) 6 and above.

## Configuration

Replace the following constants in the `index.js` with your own information. 

```javascript
const clientID = 'YOUR_CLIENT_ID';
const clientSecret = 'YOUR_CLIENT_SECRET';
const callbackURL = 'YOUR_CALLBACK_URL';
```

## Getting Started

Install the dependencies and run the server as follows.

```
npm i
npm start
```

Then, visit [http://localhost:3002](http://localhost:3002). You can login to the example with your CryptoBadge account.

## Understanding the Example

If you click the 'Login with CryptoBadge' link whose `href` attribute is `/auth/cryptobadge`, the following route handler redirects to the authorization endpoint, `https://cryptobadge.app/oauth2/authorize`.

```javascript
app.get('/auth/cryptobadge', passport.authenticate('oauth2', {scope: ['email']}));
```

Accordingly, you will be redirected to the CryptoBadge.

```
https://cryptobadge.app/oauth2/authorize?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3002%2Fauth%2Fcryptobadge%2Fcallback&scope=email&state=Tgl7k641Y0tPyPlq2ZHPQHiL&client_id=YOUR_CLIENT_ID 
```

If you are not signed in to the CryptoBadge, you will be redirected to the login page, and if you are already signed in, you will be redirected to the authorization page where you can see what scopes the example wants from you and decide whether to allow the requested scopes. If you clicks the allow button on the authorization page, you will be redirected to the example, `callbackURL` in the `index.js`, with some parameters.

```
http://localhost:3002/auth/cryptobadge/callback?code=858bb641324cef224389ed60b41b00d578c0a93b&state=Tgl7k641Y0tPyPlq2ZHPQHiL
```

Note that if you have ever authorized the 3rd party application with the same scope and try again to login with CryptoBadge, you should be redirected to the 3rd party application directly without visiting the authorization page. If you want to visit the authorization page again, you should revoke all the tokens issued to the example. TODO guide how to revoke them 

By the above redirection, the following callback is called with an access token and refresh token. Behind the scene, the passport exchanges the given code with the token by calling the token endpoint, `https://cryptobadge.app/oauth2/token`, unless something goes wrong. TODO explain how to call the token endpoint manually

```javascript
passport.use(new OAuth2Strategy({/* skipped */}, (accessToken, refreshToken, params, profile, done) => {
  request.post({
    url: 'https://api.cryptobadge.app/graphql',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    json: {
      query: `query { me { name email } }`
    }
  }, (error, response, {data: {me}}) => {
    if (error || response.statusCode !== 200) {
      return done(error);
    }

    // With the user information, you may want to create and store a user in your database
    console.log("The authenticated user", me);
    done(null, me);
  });
}));
```

Now that you authorized 'email' scope, the example can get your information including private email address with the issued token through CryptoBadge GraphQL API like the above. If the token has no `email` scope, `me.email` should be `null`. Finally if `done` is called with a user object, the following route handler which is the third argument is executed and you can see the object in `/`. TODO explain error cases.

```javascript
app.get('/auth/cryptobadge/callback', passport.authenticate('oauth2'), (req, res) => res.redirect('/'));
```
