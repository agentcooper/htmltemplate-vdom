module.exports = {
    items: [
        // Tests first condition branch.
        {
            unskip: true
        },
        // Tests second condition branch without advancing to `TMPL_CONTINUE`.
        {
            unskip: false,
            can_skip: true
        },
        // Tests not entering first condition at all.
        {
            skippable: true,
            skippaduppable: true
        },
        {
            can_skip: true,
            skippable: true,
            skippaduppable: false
        },
        {
            can_skip: true,
            skippable: false,
            skippaduppable: true
        },
        {
            value: 'VALUE_OVERRIDE'
        }
    ],
    value: 'VALUE'
};
