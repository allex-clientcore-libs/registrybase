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
    var ret;
    if (typeof mod !== 'undefined') {
      if (this.get(modulename)) {
        console.error(process.pid, 'duplicate register for', modulename);
        return;
      }
      lib.DIContainer.prototype.register.call(this, modulename, mod);
      return mod;
    }
    if (!this.busy(modulename)) {
      ret = this.waitFor(modulename);
      this.finalizeRegister(modulename);
    } else {
      ret = this.waitFor(modulename);
    }
    return ret;
  };
  RegistryBase.prototype.finalizeRegister = function (modulename) {
    try {
      this.register(modulename, require(modulename)(execlib));
    }
    catch(e){
      if(execlib.execSuite.installFromError){
        execlib.execSuite.installFromError(this.registerAfterInstall.bind(this,modulename),e);
      }else{
        console.log(e.stack);
        console.log(e);
      }
    }
  };
  RegistryBase.prototype.registerAfterInstall = function (modulename, should) {
    if (!should) {
      var e = new lib.Error('MODULE_INSTALLATION_FAILED',modulename);
      e.modulename = modulename;
      this.fail(e);
      return;
    }
    this.finalizeRegister(modulename);
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

