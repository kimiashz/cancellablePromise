const STATES = Object.freeze({
  PENDING: Symbol('pending'),
  CANCELED: Symbol('canceled'),
  RESOLVED: Symbol('resolved'),
  REJECTED: Symbol('rejected'),
});

const PROMISE_KEY = Symbol('promise');
const DATA_KEY = Symbol('data');

function setData(instance, prevInstance) {
  instance.then = prevInstance.then;
  instance.catch = prevInstance.catch;
  instance.finally = prevInstance.finally;
  instance[DATA_KEY] = prevInstance[DATA_KEY];

  if (!instance.cancel) {
    Object.defineProperty(instance, 'cancel', {
      get() {
        return instance[DATA_KEY].onCancel;
      },
      set(callback) {
        instance[DATA_KEY].cancel = callback;
      },
    });
  }

  return instance;
}
class CancellablePromise {
  static wrap(data) {
    if (data instanceof Promise) {
      return new CancellablePromise((resolve, reject) => {
        data.then(resolve).catch(reject);
      });
    }
    return CancellablePromise.resolve(data);
  }

  constructor(callback) {
    this[DATA_KEY] = {
      state: STATES.PENDING,
      cancel: () => {},
      onCancel: () => {},
    };
    this[PROMISE_KEY] = new Promise((resolve, reject) => {
      const onResolve = (value) => {
        if (this[DATA_KEY].state !== STATES.PENDING) {
          return undefined;
        }
        this[DATA_KEY].state = STATES.RESOLVED;
        return resolve(value);
      };

      const onReject = (error) => {
        if (this[DATA_KEY].state !== STATES.PENDING) {
          return undefined;
        }
        this[DATA_KEY].state = STATES.REJECTED;
        return reject(error);
      };

      this[DATA_KEY].onCancel = () => {
        if (this[DATA_KEY].state !== STATES.PENDING) {
          return undefined;
        }
        const error = new Error('Promise is Canceled.');
        error.didCancel = true;
        this[DATA_KEY].state = STATES.CANCELED;
        try {
          this[DATA_KEY].cancel();
        } catch (e) {
          return reject(e);
        }
        return reject(error);
      };

      callback(onResolve, onReject);
    });
  }

  get cancel() {
    return this[DATA_KEY].onCancel;
  }

  set cancel(callback) {
    this[DATA_KEY].cancel = callback;
  }

  then(...callbacks) {
    return setData(
      this[PROMISE_KEY] ? this[PROMISE_KEY].then(...callbacks) : super.then(...callbacks),
      this,
    );
  }

  catch(...callbacks) {
    return setData(
      this[PROMISE_KEY] ? this[PROMISE_KEY].catch(...callbacks) : super.catch(...callbacks),
      this,
    );
  }

  finally(...callbacks) {
    return setData(
      this[PROMISE_KEY] ? this[PROMISE_KEY].finally(...callbacks) : super.finally(...callbacks),
      this,
    );
  }
}

CancellablePromise.resolve = Promise.resolve;
CancellablePromise.reject = Promise.reject;
CancellablePromise.all = Promise.all;
CancellablePromise.race = Promise.race;

Object.setPrototypeOf(CancellablePromise.prototype, Promise.prototype);

export default CancellablePromise;
