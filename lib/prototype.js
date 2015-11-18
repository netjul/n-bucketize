Array.prototype.diff = function (a) {
    return this.filter(function (e) { return a.indexOf(e) === -1 });
};

module.exports = {};

