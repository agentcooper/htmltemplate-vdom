var i18n = {
    'username': 'юзернейм',
    'greeting': function(params) {
        return 'Hello, ' + (params.name || '');
    },
    'label': '[unread]'
};

module.exports = {
    resolveLookup: function(propertyName, params) {
        var translation = i18n[propertyName];

        if (typeof translation === 'function') {
            return translation(params);
        }

        return translation;
    }
};
