module.exports = async (tp) => {
    const name = await tp.system.prompt("Diagram Name");

    const block = `
## ${name}
\`\`\`mermaid
stateDiagram-v2
    [*] --> A
    A --> B: transition()
    B --> A: return()
\`\`\`
`;

    await tp.file.insert(block);
};
