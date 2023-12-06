const delay = (t, val) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(val);
        }, t);
    });
}

export default delay;