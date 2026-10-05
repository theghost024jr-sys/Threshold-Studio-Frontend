export function DialogueRenderer({ content }) {
    return (
        <div className="chamber dialogue">
            <h1>Dialogues</h1>
            <article dangerouslySetInnerHTML={{ __html: content }} />
        </div>
    );
}
