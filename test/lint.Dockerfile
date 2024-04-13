# syntax=docker/dockerfile-upstream:master
frOM busybox as base
cOpy lint.Dockerfile .

from scratch
COPy --from=base \
  /lint.Dockerfile \
  /
