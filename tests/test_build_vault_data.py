from tools.build_vault_data import build_vault_render_jobs, node_record, split_frontmatter
from tools.threshold_paths import ThresholdPaths


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


def test_vault_render_jobs_require_exact_note_template_names(tmp_path) -> None:
    website_root = tmp_path / "website"
    inventory_root = tmp_path / "html-inventory"
    template = website_root / "page-templates" / "basin.html"
    template.parent.mkdir(parents=True)
    template.write_text(
        "<!DOCTYPE html><!-- BEGIN_CONTENT --><!-- END_CONTENT --></html>",
        encoding="utf-8",
    )
    paths = ThresholdPaths(
        vault_root=tmp_path / "vault",
        glyph_root=tmp_path / "glyphs",
        system_root=tmp_path,
        website_root=website_root,
        html_inventory_root=inventory_root,
        page_mapping_path=website_root / "page-mapping.json",
        page_templates_root=website_root / "page-templates",
        generated_pages_root=website_root / "generated-pages",
        render_jobs_path=website_root / "data" / "vault-render-jobs.json",
        world_root=tmp_path / "world",
        threshold_root=tmp_path / "threshold",
        node_bundles_root=tmp_path / "node-bundles",
        scripts_root=tmp_path / "scripts",
        tools_root=tmp_path / "tools",
    )
    manifest = {
        "version": 1,
        "pages": [
            {
                "note": "_publish/basin.md",
                "templateId": "basin.html",
                "output": "basin.html",
            }
        ],
    }
    documents = [
        {
            "id": "basin",
            "relativePath": "_publish/basin.md",
            "title": "Basin",
            "body": "# Basin",
            "assets": [],
        }
    ]

    jobs = build_vault_render_jobs(paths, documents, manifest)

    assert jobs["jobs"] == [
        {
            "noteId": "basin",
            "relativePath": "_publish/basin.md",
            "templateId": "basin.html",
            "outputPath": "basin.html",
            "markdownBody": "# Basin",
            "resolvedAssets": [],
            "status": "valid",
        }
    ]


def test_vault_render_jobs_reject_mismatched_template_names(tmp_path) -> None:
    website_root = tmp_path / "website"
    inventory_root = tmp_path / "html-inventory"
    template = website_root / "page-templates" / "different.html"
    template.parent.mkdir(parents=True)
    template.write_text(
        "<!DOCTYPE html><!-- BEGIN_CONTENT --><!-- END_CONTENT --></html>",
        encoding="utf-8",
    )
    paths = ThresholdPaths(
        vault_root=tmp_path / "vault",
        glyph_root=tmp_path / "glyphs",
        system_root=tmp_path,
        website_root=website_root,
        html_inventory_root=inventory_root,
        page_mapping_path=website_root / "page-mapping.json",
        page_templates_root=website_root / "page-templates",
        generated_pages_root=website_root / "generated-pages",
        render_jobs_path=website_root / "data" / "vault-render-jobs.json",
        world_root=tmp_path / "world",
        threshold_root=tmp_path / "threshold",
        node_bundles_root=tmp_path / "node-bundles",
        scripts_root=tmp_path / "scripts",
        tools_root=tmp_path / "tools",
    )
    manifest = {
        "version": 1,
        "pages": [
            {
                "note": "_publish/basin.md",
                "templateId": "different.html",
                "output": "basin.html",
            }
        ],
    }
    documents = [
        {
            "id": "basin",
            "relativePath": "_publish/basin.md",
            "title": "Basin",
            "body": "# Basin",
            "assets": [],
        }
    ]

    try:
        build_vault_render_jobs(paths, documents, manifest)
    except ValueError as error:
        assert "exact same filename stem" in str(error)
    else:
        raise AssertionError("Expected a filename mismatch to fail")