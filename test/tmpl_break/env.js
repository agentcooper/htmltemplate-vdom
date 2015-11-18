module.exports = {
    items: [
        // Tests first condition branch.
        {
            unbreak: true
        },
        // Tests second condition branch without advancing to `TMPL_CONTINUE`.
        {
            unbreak: false,
            can_break: true,
            value: 'VALUE_OVERRIDE'
        },
        // Tests not entering first condition at all.
        {
            breakable: true
        },
        {
            can_break: true,
            breakable: true
        },
        {
            can_skip: true,
            breakable: false,
            value: 'NOT_REACHED'
        },
        {
            value: 'NOT_REACHED'
        }
    ],
    value: 'VALUE'
};
