var i18n = {
    'username': 'юзернейм'
};

module.exports = {
    resolveLookup: function(propertyName) {
        return i18n[propertyName];
    }
};
