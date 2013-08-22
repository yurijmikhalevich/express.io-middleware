# express.io-middleware

This Express.io extension adds middleware and multiroute functionality to app.io. It also adds app.io.event
and app.io.namespace properties, which contains signal name and namespace (before ':' part) respectively.

Tested with express.io 1.1.x.

Installation:

```bash
$ npm install express.io-middleware
```

Example:

```javascript
// ...
app.http().io();

require('express.io-middleware')(app); // first of all, you should patch express.io app after calling app.io();

/**
* @param {Object} req Is express.io request object
* @param {Function} next Is a pointer to the next handler in chain.
*/
app.io.use(function (req, next) {
  console.log(req.data);
  if (!req.data) {
    req.respond(':-(');
  } else {
    next();
  }
});

/**
* You may use regular expressions to bind middleware execution only for specified signals.
*/
app.io.use(/.+:save/, function (req, next) {
  if (typeof req.data != 'object') {
    req.io.emit('invalid data received');
  } else {
    next();
  }
});

app.io.route('entity', {
  save: function (req, next) {}
});

/**
* Also, you may build chain of signals handlers.
*/
app.io.route('entity:save', endpoint);
```

Note that all middlewares should be declared strongly before declaration of routes, for which it should be applied.
