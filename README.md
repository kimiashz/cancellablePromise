# CancellablePromise
make native javascript Promise Cancellable.

### Features :
- Behavior like native Promise.
- Add Cancel state: Pending, Resolved, Rejected, +Canceled
- Can use instead of Promise Builted-in Object.
- Can call Cancel callback after chained promise.
- Can't change the promise state after promise is changed to Rejected, Fullfiled or Canceled.
```javascript
    const myPromise = new CancellablePromise((resolve, reject) => {
        // write your code
    });

    myPromise.cancel = () => {}

    const cahined = myPromise
        .then(handleFulfilled, handleRejected)
        .catch(handleRejected)
        .finally(handleFinally);

    cahined.cancel();
```
