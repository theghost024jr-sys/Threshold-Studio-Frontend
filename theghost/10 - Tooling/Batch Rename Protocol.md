**Input Format**

You give me a list in _any_ of these forms:

- Raw names
- Bulleted list
- One per line
- Messy, partial, inconsistent — doesn’t matter

Example:
Glassweaver
Hollow Step
Ash Spiral
Variant 12
Echoform


Glassweaver Hollow Step Ash Spiral Variant 12 Echoform

**Output Format**

For each entry, I return:

**1. Canonical Variant Name**

`[Curvature Prefix][Epithet]`

**2. Curvature Assignment**

If you don’t specify curvature, I infer it from the behavior implied by the name.  
If you _do_ specify curvature, I lock it in.

**3. Notes (optional)**

Only when needed — e.g., if a name is ambiguous or needs refinement.

**Example Batch Rename (Demonstration)**

If you gave me:
Glassweaver
Hollow Step
Ash Spiral


Glassweaver Hollow Step Ash Spiral

I would return:

RE‑Glassweaver SD‑Hollow Step CL‑Ash Spiral

Clean. Sorted. Canonical.