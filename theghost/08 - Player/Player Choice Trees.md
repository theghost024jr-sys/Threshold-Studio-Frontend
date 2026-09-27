Overview
The Player Choice Tree defines how player decisions generate, reveal, or connect nodes within Threshold’s world‑graph.
Every choice the player makes resolves into one of three structural actions:
1. 	Reveal an existing node
2. 	Create a new node
3. 	Connect two existing nodes
This file describes the logic, flow, and consequences of each action.

Core Structure of the Choice Tree
The Player Choice Tree always begins with a Prompt Node — the moment the system asks:
“What do you create?”
or
“What do you bring into the world?”
From that moment, the tree branches into three canonical paths.

1. Reveal an Existing Node
Definition
The player selects an option that corresponds to a node already present somewhere in the system.
System Behavior
• 	Locate the existing node
• 	Pull it into the current canvas
• 	Create a directed edge from the active node → existing node
Meaning
This is recognition.
The world already contained this element; the player has simply made it visible.
Common Examples
• 	Known species
• 	Known environments
• 	Known symbolic artifacts
• 	Known emotional states
• 	Known collapse vectors

2. Create a New Node
Definition
The player selects an option that does not exist anywhere in the system.
System Behavior
• 	Generate a new node
• 	Assign a canonical name
• 	Place it in the correct folder
• 	Link active node → new node
Meaning
This is generation.
The world expands because the player touched an unmapped conceptual edge.
Common Examples
• 	New symbolic artifacts
• 	New diagrams
• 	New species
• 	New collapse phenomena
• 	New emotional physics states

3. Connect Two Existing Nodes
Definition
The player selects an option that corresponds to a node that already exists and is already connected to something in the current canvas.
System Behavior
• 	No new node is created
• 	A new edge is drawn between two existing nodes
• 	Hidden structure becomes visible
Meaning
This is relational revelation.
The player uncovers a structural truth that was already present but not yet expressed.
Common Examples
• 	Emotional physics interactions
• 	Collapse adjacency
• 	Field interactions
• 	Layer dependencies
• 	Symbolic resonance

Choice Tree Flow Diagram (Conceptual)

                [Prompt Node]
                      │
        ┌─────────────┼─────────────┐
        │             │             │
[Reveal Existing] [Create New] [Connect Existing]
        │             │             │
   (Recognition)  (Generation)  (Revelation)

Each branch leads to a different type of world expansion:
• 	Recognition → visibility
• 	Generation → growth
• 	Revelation → structure

Why This Architecture Works
The Player Choice Tree aligns with Threshold’s core principles:
• 	Nodes represent meaning
• 	Edges represent relationships
• 	Choices activate structure
• 	Architecture governs what is allowed
The player’s agency is not about inventing content — it is about activating the world.
Creation = activation
Discovery = recognition
Meaning = structure

Cross‑System Links
• 	Creation Architecture.md
• 	Link Logic.md
• 	Naming & Folder Logic.md
• 	System Architecture.md
• 	Symbolic Diagram S.md
• 	Field Architecture.md
• 	Collapse Architecture.md