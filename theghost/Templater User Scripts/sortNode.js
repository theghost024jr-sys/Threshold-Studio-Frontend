module.exports = async (tp) => {
    const type = await tp.system.prompt("Type (Creature, System, Realm, Signal, Node)");
    const folder = `01 - ${type}s`;
    await tp.file.move(`${folder}/${tp.file.title}.md`);
};
