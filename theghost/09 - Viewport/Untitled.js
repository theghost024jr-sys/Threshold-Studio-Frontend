module.exports = async (tp) => {
    const id = tp.date.now("YYYYMMDDHHmmss");
    const stamp = tp.date.now("YYYY-MM-DD HH:mm:ss");
    const title = await tp.system.prompt("Node Title");

    const content = `# ${title}

**ID:** ${id}  
**Created:** ${stamp}  
**Type:**  

## Summary

## Core Properties
- Identity  
- Resonance  
- Drift  
- Pressure  
- Collapse  
- Reintegration  

## Links
- [[Node Dynamics]]
- [[System]]
- [[Fib Flower]]
- [[Echo]]
- [[Pressure System]]
- [[Drift System]]

## Diagram
\`\`\`mermaid
stateDiagram-v2
    [*] --> Init
    Init --> Active: start()
    Active --> Init: reset()
\`\`\`
`;

    const file = await tp.file.create_new(content, `${title}.md`);
    return file;
};
