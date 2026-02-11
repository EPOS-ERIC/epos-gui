# Release and Mirror Workflow

This directory contains the release pipeline defined in `release.yaml`.

## Goals

- Validate changes for pull requests to `main`.
- Automatically build and publish container images on `main` and tags.
- Automatically mirror `main` and tags to GitLab.
- Allow manual runs for branch-level operations when needed.

## Trigger Matrix

| Event               | Ref            | build/lint/test | build-image | image push |                     mirror |
| ------------------- | -------------- | --------------: | ----------: | ---------: | -------------------------: |
| `pull_request`      | `-> main`      |             yes |          no |         no |                         no |
| `push`              | `main`         |             yes |         yes |        yes | yes (`main -> opensource`) |
| `push`              | tag (`*`)      |             yes |         yes |        yes |        yes (same tag name) |
| `push`              | other branches |              no |          no |         no |                         no |
| `workflow_dispatch` | any ref        |        optional |    optional |   optional |                   optional |

## Manual Run Inputs (`workflow_dispatch`)

- `run_ci`: runs `build`, `lint`, and `test`.
- `publish_image`: runs `build-image` and pushes to GHCR.
- `run_mirror`: mirrors current ref to GitLab.

Notes:

- If `publish_image` is enabled manually, image build prerequisites run even if `run_ci` is disabled.
- Mirror behavior depends on ref type:
  - Branch: `main` is mirrored to `opensource`; other branches keep same name.
  - Tag: mirrored to the same tag name on GitLab.

## Practical Examples

- Validate a PR to `main`: open/update PR, CI runs automatically.
- Publish image from a feature branch manually: run workflow with `publish_image=true`.
- Mirror a branch manually: run workflow with `run_mirror=true` on that branch.
- Mirror a tag manually: run workflow with `run_mirror=true` on the tag ref.
