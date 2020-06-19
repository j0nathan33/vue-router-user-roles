/*!
 * vue-router-user-roles v0.1.95 
 * (c) 2020 Anthony Gore
 * Released under the MIT License.
 */
import Vue from 'vue';

var RouteProtect = function RouteProtect (router) {
  this.router = router;
  this.vm = new Vue({
    data: {
      user: null
    }
  });
};
RouteProtect.prototype.get = function get () {
  if (!this.vm.user) {
    throw new Error("Attempt to access user before being set");
  }
  return this.vm.user;
};
RouteProtect.prototype.set = function set (user) {
  this.vm.user = user;
  if (this.to) {
    var ref = this._hasAccessToRoute(this.to);
      var access = ref.access;
      var redirect = ref.redirect;
    if (!access) {
      this.router.push({ name: redirect });
    }
  }
};
RouteProtect.prototype.hasAccess = function hasAccess (ref) {
    var name = ref.name;

  var route = this.router.options.routes.find(function (r) { return r.name === name; });
  if (!route) {
    throw new Error(("Route " + name + " is not defined in the current router"));
  }

  return this._hasAccessToRoute(route).access;
};
RouteProtect.prototype._hasAccessToRoute = function _hasAccessToRoute (route) {
    var this$1 = this;

  var accessdefault = { access: false, redirect: "error_403"};
  if (this.vm.user && route.meta.permissions) {
    var matched = [];
    for(var i in route.meta.permissions) {
      var item = route.meta.permissions[i];
      if (Array.isArray(this$1.vm.user.role) && this$1.vm.user.role.indexOf(item.role) > -1) {
        matched.push(item);
      } else if (typeof this$1.vm.user.role === 'string' && item.role === this$1.vm.user.role) {
        matched.push(item);
      }
    }
    for (var m in matched) {
      var rule = matched[m];
      if (typeof rule.access === "boolean" && rule.access) {
          return { access: true };
      } else if ((typeof rule.access === "boolean" && !rule.access) ||
          (typeof rule.access === "function" && !rule.access(this$1.vm.user, route))) {
        accessdefault = { access: false, redirect: rule.redirect };
      }
    }
  }
  return accessdefault;
};
RouteProtect.prototype.resolve = function resolve (to, from, next) {
  this.to = to;

  var ref = this._hasAccessToRoute(to);
    var access = ref.access;
    var redirect = ref.redirect;
  access ? next() : next({ name: redirect });
};

function plugin (Vue$$1, opts) {
  if (!opts.router) {
    throw new Error("You must supply a router instance in the options.");
  }
  var rp = new RouteProtect(opts.router);
  Vue$$1.prototype.$user = rp;
  opts.router.beforeEach(function (to, from, next) { return rp.resolve(to, from, next); });
}

plugin.version = "0.1.95";

if (typeof window !== "undefined" && window.Vue) {
  window.Vue.use(plugin);
}

export default plugin;
