import vaultIndex from '../../../data/vault-index.json' with { type: 'json' }
import { PAGE_ECHOES, resolvePageEchoes } from '../../../config/page-echoes.js'

const PAGE_ECHOES_WITH_NOTES = resolvePageEchoes(PAGE_ECHOES, vaultIndex)

export const BRANCHES = [
  { id: "ethos", label: "Ethos", channel: "fog", engineId: "ethos" },
  { id: "mythology", label: "Mythology", channel: "collapse", engineId: "mythology" },
  { id: "learningwheel", label: "Learning Wheel", channel: "soil", engineId: "learningWheel" },
  { id: "housegarden", label: "House + Garden", channel: "fog", engineId: "houseGarden" },
  { id: "invitation", label: "Invitation", channel: "expand", engineId: "invitation" },
  { id: "rootSigil", label: "Hub", channel: "threshold", engineId: "rootSigil" },
  { id: "home", label: "World", channel: "threshold", engineId: "home" },
  { id: "glyphs", label: "Glyphs", channel: "soil", engineId: "glyphs" },
  { id: "dialogues", label: "Dialogues", channel: "fog", engineId: "dialogues" },
  { id: "contact", label: "Contact", channel: "expand", engineId: "contact" },
].map((branch) => ({
  ...branch,
  echoes: PAGE_ECHOES_WITH_NOTES.filter((echo) => echo.branchId === branch.engineId),
}))