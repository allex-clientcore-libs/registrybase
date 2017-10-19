function createRegistryBase(execlib){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib;
  function RegistryBase(){
    lib.DIContainer.call(this);
  }
  lib.inherit(RegistryBase,lib.DIContainer);
  RegistryBase.prototype.register = function (modulename, mod) {
    if (typeof mod !== 'undefined') {
      if (this.get(modulename)) {
        console.error(process.pid, 'duplicate register for', modulename);
        return q.reject(new lib.Error('DUPLICATE_MODULE_REGISTER_ATTEMPT', 'Duplicate register for '+modulename+' is not allowed'));
      }
      lib.DIContainer.prototype.register.call(this, modulename, mod);
      return mod;
    }
    if (!this.busy(modulename)) {
      this.waitFor(modulename);
      return this.finalizeRegister(modulename);
    }
    return this.waitFor(modulename);
  };
  RegistryBase.prototype.finalizeRegister = function (modulename) {
    var d, ret;
    try {
      return q(this.register(modulename, require(modulename)(execlib)));
    }
    catch(e){
      if(execlib.execSuite.installFromError){
        d = q.defer();
        ret = d.promise;
        execlib.execSuite.installFromError(this.registerAfterInstall.bind(this,modulename,d),e);
        return ret;
      }else{
        console.log(e.stack);
        console.log(e);
        return q.reject(e);
      }
    }
  };
  RegistryBase.prototype.registerAfterInstall = function (modulename, defer, should) {
    var e, frres;
    if (!should) {
      e = new lib.Error('MODULE_INSTALLATION_FAILED',modulename);
      e.modulename = modulename;
      if (defer) {
        defer.reject(e);
      }
      this.fail(e);
      return;
    }
    frres = this.finalizeRegister(modulename);
    if (defer) {
      qlib.promise2defer(frres, defer);
    }
  };
  RegistryBase.prototype.spawn = function (modulename, prophash) {
    var d = q.defer();
    this.register(modulename).done(
      function(ctor){
        d.resolve(new ctor(prophash||{}));
        d = null;
        prophash = null;
      },
      d.reject.bind(d)
    );
    return d.promise;
  };
  RegistryBase.prototype.onInstallFromError = function (modulename,defer,error,ok) {
    if(ok){
      qlib.promise2defer(this.register(modulename), defer);
    }else{
      defer.reject(error);
    }
  };
  return RegistryBase;
}

module.exports = createRegistryBase;

