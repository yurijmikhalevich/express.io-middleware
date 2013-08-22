/**
 * Copyright (C) 2013 Cat Limited, Yurij Mikhalevich
 * @author: Yurij Mikhalevich <0@39.yt>
 */

var _ = require('underscore');

/**
 * Extends app.io objects, adding middleware functionality and event and namespace properties, which stores event name
 * and namespace (before ':' part) respectively.
 *
 * @param {Object} app express.io app object
 */
module.exports = function(app) {
  /**
   * Overridden app.io.route method, which should use our registerRoute.
   *
   * @param {String} route Signal name
   * @param {Function|Object} next Signal handler or request object (according to options.trigger), as request object
   * used for internal express.io purposes
   * @param {Object} [options] Additional parameters, options.trigger makes sense and used for internal express.io
   * purposes
   * @returns {Object|Array}
   */
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
      return registerRoute(this.router, this.middleware, route, next);
    } else {
      _results = [];
      for (var key in next) {
        if (!next.hasOwnProperty(key)) {
          continue;
        }
        _results.push(registerRoute(this.router, this.middleware, "" + route + ":" + key, next[key]));
      }
      return _results;
    }
  };

  /**
   * Registers middleware in system.
   *
   * @param {RegExp|Function} regexp RegExp, which specifies events, for which middleware should be applied
   * or middleware
   * @param {Function} [middleware] Middleware function
   * @returns {Array}
   */
  app.io.use = function(regexp, middleware) {
    if (typeof regexp === 'function') {
      return app.io.middleware.push([ new RegExp(), regexp ]);
    } else {
      return app.io.middleware.push([ regexp, middleware ]);
    }
  };
};

/**
 * Registers new route in the route subsystem
 *
 * @param {Object} router Router object, expects app.io.router
 * @param {Array} middlewares Middlwares array, expects app.io.middleware
 * @param {String} route Signal name
 * @param {Function} func Signal handler
 * @returns {Function} New route handler
 */
function registerRoute(router, middlewares, route, func) {
  var previousFunc = router[route];
  if (previousFunc) { // if another handler exists, adding new in chain
    return router[route] = createRouteFunction(previousFunc, func);
  } else { // if there is no another handler
    middlewares.forEach(function (middleware) { // compile all middlewares in chain
      if (middleware[0].test(route)) {
        if (previousFunc) {
          previousFunc = router[route] = createRouteFunction(previousFunc, middleware[1]);
        } else {
          previousFunc = router[route] = createRouteFunction(middleware[1], route);
        }
      }
    });
    if (previousFunc) { // if there are any middlewares add new handler in chain
      return router[route] = createRouteFunction(previousFunc, func);
    } else { // otherwise init new handler chain with new handler
      return router[route] = createRouteFunction(func, route);
    }
  }
}

/**
 * Creates chain route function
 *
 * @param {Function} previousFunc Previous function in chain or new function in chain, according to second argument
 * @param {Function|String} func New function in chain or Signal name
 * @returns {Function}
 */
function createRouteFunction(previousFunc, func) {
   if (typeof func === 'function') {
    return function (req, next) {
      previousFunc(req, function () { func(req, next); });
    }
  } else {
    return function (req, next) {
      req.io.event = func;
      req.io.namespace = func.split(':')[0];
      previousFunc(req, next);
    }
  }
}