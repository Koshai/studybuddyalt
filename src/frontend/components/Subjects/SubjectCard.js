
// components/SubjectCard.js

window.SubjectCardComponent = {
    template: `
    <div class="component-subjectcard">
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>
    </div>
    `,

    props: {
        title: {
            type: String,
            default: 'SubjectCard Component'
        },
        description: {
            type: String,
            default: 'Component description'
        }
    },

    setup(props) {
        const store = window.store;

        return {
            store
        };
    }
};