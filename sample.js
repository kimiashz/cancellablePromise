import CancellablePromise from 'src/utils/cancellable-promise';

const promise = new CancellablePromise((resolve, reject) => {
    // do code like native promise

    // Send data with resolving proomise
    resolve(/* data */);

    // send rejected error
    reject(/* error */);
});
promise.cancel = () => {
    // do something when cancel is called
};
promise
    .then(() => {})
    .catch(() => {});

// Wrapping Promise for converting to Cancelable
const requestPromise = CancellablePromise.wrap(requestFuntion());
requestPromise.cancel = cancel;