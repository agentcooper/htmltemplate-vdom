module.exports = {
    title_copy: 'Hello',
    check_checkbox: true,
    disable_button: true,
    class_name: 'b-class',
    divs: [
        {
            add_only_class: true,
            class_name: 'b-class',
            content: 'Only class'
        },
        {
            add_only_class: true,
            content: 'Only class, fallback to default class name'
        },
        {
            add_only_class: true,
            add_both_class_and_id: true,
            content: 'Attempt to add both class and id, but fallback to default class name'
        },
        {
            add_both_class_and_id: true,
            class_name: 'b-class',
            id: 'id1',
            content: 'Add provided class name and id'
        },
        {
            add_both_class_and_id: true,
            id: 'id2',
            content: 'Fallback to assigning id to both id and class name'
        },
        {
            content: 'Default content'
        }
    ]
};
