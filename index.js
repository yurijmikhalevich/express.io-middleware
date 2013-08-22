var _ = require('underscore');

module.exports = function(app) {
  function registerRoute(router, route, func) {
    var previousFunction = router[route];
    if (previousFunction) {
      return router[route] = function (req, next) {
        previousFunction(req, function () { func(req, next); });
      }
    } else {
      app.io.middleware.forEach(function (middleware) {
        if (middleware[0].test(route)) {
          if (previousFunction) {
            previousFunction = router[route] = function (req, next) {
              previousFunction(req, function () { middleware[1](req, next); });
            }
          } else {
            previousFunction = router[route] = middleware[1];
          }
        }
      });
      if (previousFunction) {
        return router[route] = function (req, next) {
          req.io.event = route;
          req.io.namespace = route.split(':')[0];
          previousFunction(req, function () { func(req, next); });
        }
      } else {
        return router[route] = func;
      }
    }
  }

  app.io.route = function(route, next, options) {
    var split, _results;
    if ((options != null ? options.trigger : void 0) === true) {
      if (route.indexOf(':' === -1)) {
        this.router[route](next);
      } else {
        split = route.split(':');
        this.router[split[0]][split[1]](next);
      }
    }
    if (_.isFunction(next)) {
      return registerRoute(this.router, route, next);
    } else {
      _results = [];
      for (var key in next) {
        if (!next.hasOwnProperty(key)) {
          continue;
        }
        var value = next[key];
        _results.push(registerRoute(this.router, "" + route + ":" + key, value));
      }
      return _results;
    }
  };

  app.io.use = function(regexp, callback) {
    if (typeof regexp == 'function') {
      return app.io.middleware.push([ new RegExp(), regexp ]);
    } else {
      return app.io.middleware.push([ regexp, callback ]);
    }
  };
};