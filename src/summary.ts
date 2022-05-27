import * as core from '@actions/core';
import {SummaryTableRow} from '@actions/core/lib/summary';
import * as context from './context';

interface BuildInfo {
  frontend: string;
  attrs: Map<string, string>;
  sources: Source[];
}

interface Source {
  type: string;
  ref: string;
  pin: string;
}

export async function generate(inputs: context.Inputs, metadata: string | undefined, duration: number): Promise<typeof core.summary | undefined> {
  if (metadata === undefined) {
    return;
  }
  const sum = core.summary.addHeading('Docker build summary', 1);

  const mobj = <Map<string, unknown>>(JSON.parse(metadata) as unknown);
  Object.keys(mobj).forEach(key => {
    if (key.startsWith('containerimage.buildinfo')) {
      // buildinfo summary
      const bi = mobj[key] as BuildInfo;
      const platform = key.includes('/') ? key.substring(key.indexOf('/') + 1) : undefined;
      buildinfo(sum, bi, platform);
    }
  });

  return sum;
}

function buildinfo(sum: typeof core.summary, bi: BuildInfo, platform: string | undefined) {
  let title = 'Docker build information';
  if (platform !== undefined) {
    title += ` for <pre>${platform}</pre>`;
  }

  sum
    .addEOL()
    .addHeading(title, 2)
    .addRaw(`Build dependencies have been generated when your image has been built.These dependencies include versions of used images, git repositories and HTTP URLs as well as build request attributes as described below.`, true)
    .addEOL()
    .addRaw(`More information: `)
    .addLink('https://github.com/moby/buildkit/blob/master/docs/build-repro.md', 'https://github.com/moby/buildkit/blob/master/docs/build-repro.md');

  // attrs
  if (bi.attrs !== undefined) {
    sum.addEOL().addHeading('Request attributes', 3);
    const buildAttrs: Array<string> = [];
    const buildArgs: Array<string> = [];
    const buildLabels: Array<string> = [];
    Object.keys(bi.attrs).forEach(key => {
      const value = bi.attrs[key];
      if (key.startsWith('build-arg:')) {
        buildArgs.push(`<code>${key.substring(10)}=${value}</code>`);
      } else if (key.startsWith('label:')) {
        buildLabels.push(`<code>${key.substring(6)}=${value}</code>`);
      } else {
        buildAttrs.push(`<code>${key}=${value}</code>`);
      }
    });
    if (buildAttrs.length > 0) {
      sum.addHeading('Common attributes', 4).addList(buildAttrs, true);
    }
    if (buildArgs.length > 0) {
      sum.addHeading('Arguments', 4).addList(buildArgs, true);
    }
    if (buildLabels.length > 0) {
      sum.addHeading('Labels', 4).addList(buildLabels, true);
    }
  }

  // sources
  if (bi.sources.length > 0) {
    sum.addEOL().addHeading('Sources', 3);
    const buildSources: SummaryTableRow[] = [
      [
        {data: 'Type', header: true},
        {data: 'Ref', header: true}
      ]
    ];
    for (const source of bi.sources) {
      buildSources.push([source.type, `<code>${source.ref}</code>`]);
    }
    sum.addTable(buildSources);
  }
}
