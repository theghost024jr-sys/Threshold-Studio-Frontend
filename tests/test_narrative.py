from engine.narrative import NarrativeConfig, NarrativeSignals, classify_narrative_arcs
def test_hybrid_narrative_classification_grows_arcs_from_physics() -> None:
    base=NarrativeSignals(.1,.1,.1,.1,1.,-.1,.1)
    arcs=classify_narrative_arcs(NarrativeSignals(.3,.25,.05,1.2,1.,.2,.3),base,NarrativeConfig(.2,2.))
    assert set(arcs)=={"tension","migration","collapse","rebirth","player"}
