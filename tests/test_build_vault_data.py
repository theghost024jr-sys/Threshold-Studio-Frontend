from tools.build_vault_data import node_record, split_frontmatter


def test_frontmatter_preserves_public_node_metadata() -> None:
    metadata, body = split_frontmatter(
        """---
id: forest
type: biome
map: forest.png
physics:
  drift: 0.2
weather:
  channel: fog
page:
    html: /environment/forest.html
    reveal_conditions:
        - enter
characters: [warden, guide]
connections: [herb_room, lagoon]
html: /environment/forest.html
---
Forest body.
"""
    )

    assert metadata["type"] == "biome"
    assert metadata["map"] == "forest.png"
    assert metadata["physics"] == {"drift": 0.2}
    assert metadata["weather"] == {"channel": "fog"}
    assert metadata["page"] == {"html": "/environment/forest.html", "reveal_conditions": ["enter"]}
    assert metadata["characters"] == ["warden", "guide"]
    assert metadata["connections"] == ["herb_room", "lagoon"]
    assert metadata["html"] == "/environment/forest.html"
    assert body == "Forest body."


def test_node_record_uses_frontmatter_type_and_page() -> None:
    node = node_record({
        "id": "forest",
        "kind": "chamber",
        "type": "biome",
        "map": "forest.png",
        "physics": {"drift": 0.2},
        "weather": {"channel": "fog"},
        "characters": ["warden"],
        "connections": ["lagoon"],
        "html": "/environment/forest.html",
        "route": "/environment/fallback.html",
    })

    assert node == {
        "id": "forest",
        "type": "biome",
        "map": "forest.png",
        "physics": {"drift": 0.2},
        "weather": {"channel": "fog"},
        "characters": ["warden"],
        "connections": ["lagoon"],
        "html": "/environment/forest.html",
    }


def test_node_record_uses_nested_page_html_when_top_level_html_is_absent() -> None:
    node = node_record({
        "id": "lagoon",
        "kind": "note",
        "type": "biome",
        "page": {"html": "/housegarden.html#lagoon", "reveal_conditions": ["enter"]},
    })

    assert node["html"] == "/housegarden.html#lagoon"