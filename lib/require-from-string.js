function requireFromString(code, paths) {
    var m = new module.constructor();

    m.paths = paths;
    m._compile(code);

    return m.exports;
};

module.exports = requireFromString;
