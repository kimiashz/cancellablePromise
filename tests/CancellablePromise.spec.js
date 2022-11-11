import CancellablePromise from '../cancellable-promise';

const noop = () => {};
const resolvedData = { data: 'resolved' };
const rejectedData = { data: 'rejected' };

describe('CancellablePromise', () => {
  describe('cancellable', () => {
    it('call cancel callback once', () => {
      const cancel = jest.fn();
      const promise = new CancellablePromise(noop);
      promise.cancel = cancel;
      promise.catch(noop);
      promise.cancel();

      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it('call cancel callback once after multi chain', () => {
      const cancel = jest.fn();
      const promise = new CancellablePromise(noop);
      promise.cancel = cancel;
      const chained = promise
        .then(noop)
        .catch(noop)
        .then(noop)
        .catch(noop);
      chained.cancel();

      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it('call the first catch after canceling in any level of chain', () => {
      const cancel = jest.fn();
      const onThen = jest.fn();
      const onCatch = jest.fn();
      const onCatchSeccond = jest.fn();

      const promise = new CancellablePromise(noop);
      promise.cancel = cancel;

      const chained = promise
        .then(onThen)
        .catch(onCatch)
        .then(noop)
        .catch(onCatchSeccond);
      chained.cancel();

      expect(cancel).toHaveBeenCalledTimes(1);

      return chained.finally(() => {
        expect(onThen).toHaveBeenCalledTimes(0);
        expect(onCatchSeccond).toHaveBeenCalledTimes(0);
        expect(onCatch).toHaveBeenCalledTimes(1);
      });
    });

    it('can not be canceled after resolving', () => {
      const cancel = jest.fn();
      const onThen = jest.fn();
      const onCatch = jest.fn();

      const promise = new CancellablePromise((resolve) => { resolve(); });
      promise.cancel = cancel;

      const chained = promise
        .then(onThen)
        .catch(onCatch);

      chained.cancel();

      expect(cancel).toHaveBeenCalledTimes(0);

      return chained.finally(() => {
        expect(onThen).toHaveBeenCalledTimes(1);
        expect(onCatch).toHaveBeenCalledTimes(0);
      });
    });

    it('can not be canceled after rejecting', () => {
      const cancel = jest.fn();
      const onThen = jest.fn();
      const onCatch = jest.fn();

      const promise = new CancellablePromise((resolve, reject) => { reject(); });
      promise.cancel = cancel;

      const chained = promise
        .then(onThen)
        .catch(onCatch);

      chained.cancel();

      expect(cancel).toHaveBeenCalledTimes(0);

      return chained.finally(() => {
        expect(onThen).toHaveBeenCalledTimes(0);
        expect(onCatch).toHaveBeenCalledTimes(1);
      });
    });

    it('throw error with cancel message and property didCancel true after canceling', async () => {
      const cancel = jest.fn();
      const onThen = jest.fn();
      const onCatch = jest.fn();

      const promise = new CancellablePromise(noop);
      promise.cancel = cancel;

      const chained = promise
        .then(onThen)
        .catch((e) => {
          onCatch(e?.didCancel, e?.message);
        });

      chained.cancel();

      expect(cancel).toHaveBeenCalledTimes(1);

      return chained.finally(() => {
        expect(onThen).toHaveBeenCalledTimes(0);
        expect(onCatch).toHaveBeenCalledTimes(1);
        expect(onCatch).toHaveBeenCalledWith(true, 'Promise is Canceled.');
      });
    });

    it('has to have own property "then", "catch" and "finally"', () => {
      const promise = new CancellablePromise(noop);

      const chained = promise
        .then(noop)
        .catch(noop)
        .finally(noop)
        .then(noop)
        .catch(noop);

      expect(promise).toHaveProperty('then');
      expect(chained).toHaveProperty('then');
      expect(chained.then === promise.then).toBeTruthy();

      expect(promise).toHaveProperty('catch');
      expect(chained).toHaveProperty('catch');
      expect(chained.catch === promise.catch).toBeTruthy();

      expect(promise).toHaveProperty('finally');
      expect(chained).toHaveProperty('finally');
      expect(chained.finally === promise.finally).toBeTruthy();
    });
  });

  describe('static resolve', () => {
    it('send resolved data', () => {
      const onThen = jest.fn();
      const onCatch = jest.fn();

      return CancellablePromise.resolve(resolvedData)
        .then(onThen)
        .catch(onCatch)
        .finally(() => {
          expect(onThen).toHaveBeenCalledWith(resolvedData);
          expect(onThen).toHaveBeenCalledTimes(1);
          expect(onCatch).toHaveBeenCalledTimes(0);
        });
    });

    it('calls the first callback when resolved', () => {
      const onResolve = jest.fn();
      const onReject = jest.fn();

      return CancellablePromise.resolve(resolvedData)
        .then(onResolve, onReject)
        .finally(() => {
          expect(onResolve).toHaveBeenCalledWith(resolvedData);
          expect(onResolve).toHaveBeenCalledTimes(1);
          expect(onReject).toHaveBeenCalledTimes(0);
        });
    });

    it('keeps the cancel method', () => {
      const cancel = jest.fn();

      const promise = new CancellablePromise(noop);
      promise.cancel = cancel;

      const chain = promise
        .then(noop)
        .catch(noop)
        .finally(noop)
        .then(noop)
        .catch(noop)
        .finally(noop)
        .then(noop)
        .catch(noop)
        .finally(noop);
      chain.cancel();

      expect(chain).toHaveProperty('cancel');
      expect(chain.cancel === promise.cancel).toBe(true);
      expect(cancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('static reject', () => {
    it('send rejected data', () => {
      const onThen = jest.fn();
      const onCatch = jest.fn();

      return CancellablePromise.reject(rejectedData)
        .then(onThen)
        .catch(onCatch)
        .finally(() => {
          expect(onCatch).toHaveBeenCalledWith(rejectedData);
          expect(onCatch).toHaveBeenCalledTimes(1);
          expect(onThen).toHaveBeenCalledTimes(0);
        });
    });

    it('calls the second callback when reject', () => {
      const onResolve = jest.fn();
      const onReject = jest.fn();
      const onCatch = jest.fn();

      return CancellablePromise.reject(rejectedData)
        .then(onResolve, onReject)
        .catch(onCatch)
        .finally(() => {
          expect(onReject).toHaveBeenCalledWith(rejectedData);
          expect(onReject).toHaveBeenCalledTimes(1);
          expect(onResolve).toHaveBeenCalledTimes(0);
          expect(onCatch).toHaveBeenCalledTimes(0);
        });
    });

    it('has to have own property "then", "catch" and "finally"', () => {
      const promise = CancellablePromise.reject(rejectedData);

      const chained = promise
        .then(noop)
        .catch(noop)
        .then(noop)
        .catch(noop);

      expect(promise).toHaveProperty('then');
      expect(chained).toHaveProperty('then');
      expect(chained.then === promise.then).toBe(true);

      expect(promise).toHaveProperty('catch');
      expect(chained).toHaveProperty('catch');
      expect(chained.catch === promise.catch).toBe(true);

      expect(promise).toHaveProperty('finally');
      expect(chained).toHaveProperty('finally');
      expect(chained.finally === promise.finally).toBe(true);
    });
  });

  describe('promise', () => {
    it('pass "object" data to the chain"', () => {
      const onThen = jest.fn();
      const data = { test: true };

      const promise = CancellablePromise.resolve({})
        .then(() => data)
        .catch(noop)
        .finally(noop)
        .then(onThen);

      return promise.finally(() => {
        expect(onThen).toHaveBeenCalledTimes(1);
        expect(onThen).toHaveBeenCalledWith(data);
      });
    });

    it('pass "rejected promise" data to the chain"', () => {
      const onCatch = jest.fn();
      const error = new Error('inner promise');
      const data = Promise.reject(error);

      const promise = CancellablePromise.resolve({})
        .then(() => data)
        .finally(noop)
        .then(noop)
        .catch(onCatch);

      return promise.finally(() => {
        expect(onCatch).toHaveBeenCalledTimes(1);
        expect(onCatch).toHaveBeenCalledWith(error);
      });
    });

    it('pass "resolved promise" data to the chain"', () => {
      const onThen = jest.fn();
      const data = Promise.resolve(resolvedData);

      const promise = CancellablePromise.resolve({})
        .then(() => data)
        .finally(noop)
        .then(onThen)
        .catch(noop);

      return promise.finally(() => {
        expect(onThen).toHaveBeenCalledTimes(1);
        expect(onThen).toHaveBeenCalledWith(resolvedData);
      });
    });

    it('has to have own property "then", "catch" and "finally" after passing new Promise to the chain', () => {
      const promise = CancellablePromise.resolve({});
      const data = new Promise((resolve) => { resolve(resolvedData); });

      const chained = promise
        .then(() => data)
        .catch(noop);

      expect(promise).toHaveProperty('then');
      expect(chained).toHaveProperty('then');
      expect(chained.then === promise.then).toBe(true);

      expect(promise).toHaveProperty('catch');
      expect(chained).toHaveProperty('catch');
      expect(chained.catch === promise.catch).toBe(true);

      expect(promise).toHaveProperty('finally');
      expect(chained).toHaveProperty('finally');
      expect(chained.finally === promise.finally).toBe(true);
    });

    it('has to have own property "then", "catch" and "finally" after passing new rejected Promise to the chain', () => {
      const promise = CancellablePromise.resolve({});
      const data = new Promise((resolve, reject) => { reject(new Error('inner promise is rejected.')); });

      const chained = promise
        .then(() => data)
        .then(noop);

      chained.catch(noop);

      expect(promise).toHaveProperty('then');
      expect(chained).toHaveProperty('then');
      expect(chained.then === promise.then).toBe(true);

      expect(promise).toHaveProperty('catch');
      expect(chained).toHaveProperty('catch');
      expect(chained.catch === promise.catch).toBe(true);

      expect(promise).toHaveProperty('finally');
      expect(chained).toHaveProperty('finally');
      expect(chained.finally === promise.finally).toBe(true);
    });

    it('has to have own property "then", "catch" and "finally"', () => {
      const promise = CancellablePromise.resolve(resolvedData);

      const chained = promise
        .then(noop)
        .catch(noop)
        .then(noop)
        .catch(noop);

      expect(promise).toHaveProperty('then');
      expect(chained).toHaveProperty('then');
      expect(chained.then === promise.then).toBe(true);

      expect(promise).toHaveProperty('catch');
      expect(chained).toHaveProperty('catch');
      expect(chained.catch === promise.catch).toBe(true);

      expect(promise).toHaveProperty('finally');
      expect(chained).toHaveProperty('finally');
      expect(chained.finally === promise.finally).toBe(true);
    });
  });

  describe('static all', () => {
    it('has to call then when all the promises is fulfilled', () => {
      const onThen = jest.fn();
      const onCatch = jest.fn();

      const data1 = { data: 1 };
      const data2 = { data: 2 };
      const data3 = { data: 3 };
      const data4 = { data: 4 };

      const p1 = CancellablePromise.resolve(data1);
      const p2 = CancellablePromise.resolve(data2);
      const p3 = new CancellablePromise((resolve) => { resolve(data3); });
      const p4 = new CancellablePromise((resolve) => { resolve(data4); });

      const all = CancellablePromise.all([p1, p2, p3, p4])
        .then(onThen)
        .catch(onCatch);

      return all.finally(() => {
        expect(onThen).toHaveBeenCalledTimes(1);
        expect(onCatch).toHaveBeenCalledTimes(0);
        expect(onThen).toHaveBeenCalledWith([data1, data2, data3, data4]);
      });
    });

    it('has to call catch when one of the promises is rejected', () => {
      const onThen = jest.fn();
      const onCatch = jest.fn();

      const data1 = { data: 1 };
      const data2 = { data: 2 };
      const data3 = new Error('promise 3 is rejected');
      const data4 = { data: 4 };

      const p1 = CancellablePromise.resolve(data1);
      const p2 = CancellablePromise.resolve(data2);
      const p3 = new CancellablePromise((resolve, reject) => { reject(data3); });
      const p4 = new CancellablePromise((resolve) => { resolve(data4); });

      const all = CancellablePromise.all([p1, p2, p3, p4]);
      const chained = all
        .then(onThen)
        .catch(onCatch);

      expect(Object.hasOwnProperty.call(chained, 'then')).toBe(true);
      expect(all?.then === chained.then).toBe(true);

      expect(Object.hasOwnProperty.call(chained, 'catch')).toBe(true);
      expect(all?.catch === chained.catch).toBe(true);

      expect(Object.hasOwnProperty.call(chained, 'finally')).toBe(true);
      expect(all?.finally === chained.finally).toBe(true);

      return chained.finally(() => {
        expect(onThen).toHaveBeenCalledTimes(0);
        expect(onCatch).toHaveBeenCalledTimes(1);
      });
    });

    it('has to call catch with the first rejected data', () => {
      const onThen = jest.fn();
      const onCatch = jest.fn();

      const data1 = { data: 1 };
      const data2 = new Error('promise 2 is rejected');
      const data3 = new Error('promise 3 is rejected');
      const data4 = { data: 4 };

      const p1 = CancellablePromise.resolve(data1);
      const p2 = new CancellablePromise((resolve, reject) => { reject(data2); });
      const p3 = new CancellablePromise((resolve, reject) => { reject(data3); });
      const p4 = new CancellablePromise((resolve) => { resolve(data4); });

      const all = CancellablePromise.all([p1, p2, p3, p4])
        .then(onThen)
        .catch(onCatch)
        .then(onThen);

      return all.finally(() => {
        expect(onThen).toHaveBeenCalledTimes(1);
        expect(onThen).toHaveBeenCalledWith(undefined);

        expect(onCatch).toHaveBeenCalledTimes(1);
        expect(onCatch).toHaveBeenCalledWith(data2);
      });
    });

    it('has to have then, catch, finally after all', () => {
      const onThen = jest.fn();
      const onCatch = jest.fn();

      const data1 = { data: 1 };
      const data2 = new Error('promise 2 is rejected');
      const data3 = new Error('promise 3 is rejected');
      const data4 = { data: 4 };

      const p1 = CancellablePromise.resolve(data1);
      const p2 = new CancellablePromise((resolve, reject) => { reject(data2); });
      const p3 = new CancellablePromise((resolve, reject) => { reject(data3); });
      const p4 = new CancellablePromise((resolve) => { resolve(data4); });

      const all = CancellablePromise.all([p1, p2, p3, p4])
        .then(onThen)
        .catch(onCatch)
        .then(onThen);

      return all.finally(() => {
        expect(onThen).toHaveBeenCalledTimes(1);
        expect(onThen).toHaveBeenCalledWith(undefined);

        expect(onCatch).toHaveBeenCalledTimes(1);
        expect(onCatch).toHaveBeenCalledWith(data2);
      });
    });
  });

  describe('then', () => {
    it('send resolved data', () => {
      const onThen = jest.fn();
      const onCatch = jest.fn();

      return new CancellablePromise((resolve) => { resolve(resolvedData); })
        .then(onThen)
        .catch(onCatch)
        .finally(() => {
          expect(onThen).toHaveBeenCalledWith(resolvedData);
          expect(onThen).toHaveBeenCalledTimes(1);
          expect(onCatch).toHaveBeenCalledTimes(0);
        });
    });

    it('calls the first callback when resolved', () => {
      const onResolve = jest.fn();
      const onReject = jest.fn();

      return new CancellablePromise((resolve) => { resolve(resolvedData); })
        .catch()
        .then(onResolve, onReject)
        .then()
        .catch()
        .finally(() => {
          expect(onResolve).toHaveBeenCalledWith(resolvedData);
          expect(onResolve).toHaveBeenCalledTimes(1);
          expect(onReject).toHaveBeenCalledTimes(0);
        });
    });

    it('has to have the same "then" as the promise', () => {
      const promise = new CancellablePromise(noop);

      const chained = promise
        .then()
        .catch()
        .finally()
        .then()
        .catch();

      expect(promise).toHaveProperty('then');
      expect(chained).toHaveProperty('then');
      expect(chained.then === promise.then).toBeTruthy();
    });

    it('keeps the cancel', () => {
      const cancel = jest.fn();

      const promise = new CancellablePromise(noop);
      promise.cancel = cancel;

      const chain = promise
        .then(noop)
        .then(noop)
        .catch(noop)
        .then(noop);

      expect(chain).toHaveProperty('cancel');
      expect(chain.cancel === promise.cancel).toBe(true);
    });

    it('returns cancellable promise', () => {
      const cancel = jest.fn();
      const promise = new CancellablePromise(noop);
      promise.cancel = cancel;
      const chained = promise
        .then(noop)
        .catch(noop)
        .then(noop)
        .then(noop);
      chained.cancel();

      expect(cancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('catch', () => {
    it('send rejected data', () => {
      const onThen = jest.fn();
      const onCatch = jest.fn();

      return new CancellablePromise((resolve, reject) => { reject(rejectedData); })
        .then(onThen)
        .catch(onCatch)
        .finally(() => {
          expect(onCatch).toHaveBeenCalledWith(rejectedData);
          expect(onCatch).toHaveBeenCalledTimes(1);
          expect(onThen).toHaveBeenCalledTimes(0);
        });
    });

    it('calls the second callback when reject', () => {
      const onResolve = jest.fn();
      const onReject = jest.fn();
      const onCatch = jest.fn();

      return new CancellablePromise((resolve, reject) => { reject(rejectedData); })
        .then(onResolve, onReject)
        .catch(onCatch)
        .finally(() => {
          expect(onReject).toHaveBeenCalledWith(rejectedData);
          expect(onReject).toHaveBeenCalledTimes(1);
          expect(onResolve).toHaveBeenCalledTimes(0);
          expect(onCatch).toHaveBeenCalledTimes(0);
        });
    });

    it('has to have the same "catch" as the promise', () => {
      const promise = new CancellablePromise(noop);

      const chained = promise
        .then(noop)
        .catch(noop)
        .finally(noop)
        .then(noop)
        .catch(noop);

      expect(promise).toHaveProperty('catch');
      expect(chained).toHaveProperty('catch');
      expect(chained.catch === promise.catch).toBeTruthy();
    });

    it('keeps the cancel', () => {
      const cancel = jest.fn();

      const promise = new CancellablePromise(noop);
      promise.cancel = cancel;

      const chain = promise
        .catch(noop)
        .catch(noop)
        .catch(noop);

      expect(chain).toHaveProperty('cancel');
      expect(chain.cancel === promise.cancel).toBe(true);
    });

    it('returns cancellable promise', () => {
      const cancel = jest.fn();

      const promise = new CancellablePromise(noop);
      promise.cancel = cancel;

      const chain = promise
        .catch(noop)
        .catch(noop)
        .catch(noop);

      chain.cancel();

      expect(cancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('finally', () => {
    it('calls the callback passed to it when resolved', () => {
      const onFinally = jest.fn();
      const onCatch = jest.fn();

      return CancellablePromise.resolve(resolvedData)
        .catch(onCatch)
        .finally(onFinally)
        .finally(() => {
          expect(onFinally).toHaveBeenCalledTimes(1);
          expect(onCatch).toHaveBeenCalledTimes(0);
        });
    });

    it('calls the callback passed to it when rejected', () => {
      const onFinally = jest.fn();
      const onThen = jest.fn();

      return CancellablePromise.resolve(rejectedData)
        .catch(onThen)
        .finally(onFinally)
        .finally(() => {
          expect(onFinally).toHaveBeenCalledTimes(1);
          expect(onThen).toHaveBeenCalledTimes(0);
        });
    });

    it('has to have the same "finally" as the promise', () => {
      const promise = new CancellablePromise(noop);

      const chained = promise
        .then(noop)
        .catch(noop)
        .finally(noop)
        .then(noop)
        .catch(noop);

      expect(promise).toHaveProperty('finally');
      expect(chained).toHaveProperty('finally');
      expect(chained.finally === promise.finally).toBeTruthy();
    });

    it('keeps the cancel', () => {
      const cancel = jest.fn();

      const promise = new CancellablePromise(noop);
      promise.cancel = cancel;

      const chain = promise
        .finally(noop)
        .finally(noop)
        .finally(noop);

      expect(chain).toHaveProperty('cancel');
      expect(chain.cancel === promise.cancel).toBe(true);
    });

    it('returns cancellable promise', () => {
      const cancel = jest.fn();

      const promise = new CancellablePromise(noop);
      promise.cancel = cancel;

      const chain = promise
        .finally(noop)
        .finally(noop)
        .catch(noop)
        .finally(noop);

      chain.cancel();

      expect(cancel).toHaveBeenCalledTimes(1);
    });
  });
});
