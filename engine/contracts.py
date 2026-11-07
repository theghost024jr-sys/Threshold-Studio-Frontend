from typing import Literal, TypedDict


# Invalid states are reserved; current builders fail instead of emitting invalid jobs.
PageRenderStatus = Literal[
    "valid",
    "missing-template",
    "missing-assets",
    "invalid-template",
    "unsafe-path",
]


class ResolvedAsset(TypedDict):
    name: str
    sourceRelativePath: str
    webPath: str


class PageRenderJob(TypedDict):
    noteId: str
    relativePath: str
    templateId: str
    outputPath: str
    markdownBody: str
    resolvedAssets: list[ResolvedAsset]
    status: PageRenderStatus


class PageRenderJobs(TypedDict):
    version: Literal[1]
    jobs: list[PageRenderJob]
