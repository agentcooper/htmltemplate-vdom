module.exports = {
    title: 'HTML::Template powered by virtual-dom',

    hide_subtitle: true,

    city_copy: 'City: ',

    people: [
        {
            id: 'id1',
            name: 'John',
            inner: [{ title: 'a1' }, { title: 'b1' }],
            city: 'New York',
            active: true
        },
        {
            id: 'id2',
            name: 'Mary',
            inner: [{ title: 'a2' }, { title: 'b2' }],
            city: 'Moscow'
        }
    ],
    description: 'Interact with UI and check inspector for DOM changes. Notice how local state (like input text) stays there.',

    githubLink: 'https://github.com/agentcooper/htmltemplate-vdom'
}
