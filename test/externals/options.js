module.exports = {
    externals: {
        uc: function(string) {
            return string.toUpperCase();
        },
        substr: function(string, index, length) {
            return string.substr(index, length);
        }
    }
};
