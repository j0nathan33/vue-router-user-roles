import Vue from "vue";

export class RouteProtect {
  constructor (router) {
    this.router = router;
    this.vm = new Vue({
      data: {
        user: null
      }
    });
  }
  get () {
    if (!this.vm.user) {
      throw new Error("Attempt to access user before being set");
    }
    return this.vm.user;
  }
  set (user) {
    this.vm.user = user;
    if (this.to) {
      const { access, redirect } = this._hasAccessToRoute(this.to);
      if (!access) {
        this.router.push({ name: redirect });
      }
    }
  }
  hasAccess ({ name }) {
    const route = this.router.options.routes.find(r => r.name === name);
    if (!route) {
      throw new Error(`Route ${name} is not defined in the current router`);
    }

    return this._hasAccessToRoute(route).access;
  }
  _hasAccessToRoute (route) {
    let accessdefault = { access: false, redirect: "error_403"};
    if (this.vm.user && route.meta.permissions) {
      let matched = [];
      for(let i in route.meta.permissions) {
        let item = route.meta.permissions[i];
        if (Array.isArray(this.vm.user.role) && this.vm.user.role.indexOf(item.role) > -1) {
          matched.push(item);
        } else if (typeof this.vm.user.role === 'string' && item.role === this.vm.user.role) {
          matched.push(item);
        }
      }
      for (let m in matched) {
        let rule = matched[m];
        if (typeof rule.access === "boolean" && rule.access) {
          return { access: true };
        } else if ((typeof rule.access === "boolean" && !rule.access) ||
            (typeof rule.access === "function" && !rule.access(this.vm.user, route))) {
          accessdefault = { access: false, redirect: rule.redirect };
        }
      }
    }
    return accessdefault;
  }
  resolve (to, from, next) {
    this.to = to;

    const { access, redirect } = this._hasAccessToRoute(to);
    access ? next() : next({ name: redirect });
  }
}
