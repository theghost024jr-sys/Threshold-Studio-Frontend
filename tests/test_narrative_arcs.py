from engine.narrative_arcs import form_narrative_arc
def test_interference_arc_ignites_and_propagates() -> None:
    arc=form_narrative_arc("collapse",2.,1.,.5,.75)
    assert arc.active and arc.propagation==1.5 and arc.era_bias=="collapse"
