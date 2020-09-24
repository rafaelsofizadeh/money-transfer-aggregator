module.exports = {
  Deferred: function Deferred() {
    let deferred = {};
    let promise = new Promise((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });

    return { ...deferred, promise };
  },
};
