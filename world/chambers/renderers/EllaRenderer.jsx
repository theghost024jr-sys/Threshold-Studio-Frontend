export function EllaRenderer({ content }) {
    return (
        <div className="chamber ella">
            <h1>Ella</h1>
            <article dangerouslySetInnerHTML={{ __html: content }} />
        </div>
    );
}
