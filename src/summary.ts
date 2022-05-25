import * as core from '@actions/core';
import {SummaryTableRow} from '@actions/core/lib/summary';

interface Metadata {
  'containerimage.buildinfo': BuildInfo;
}

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

export async function gen(metadata: string | undefined) {
  if (metadata === undefined) {
    return;
  }

  // buildinfo summary
  const mobj = <Metadata>(JSON.parse(metadata) as unknown);
  if (mobj['containerimage.buildinfo'] !== undefined) {
    const buildInfo = mobj['containerimage.buildinfo'];

    // prettier-ignore
    let sum = core.summary
      .addHeading('Docker build information', 2)
      .addRaw(`Build dependencies have been generated when your image has been built. These dependencies include versions of used images, git repositories and HTTP URLs as well as build request attributes as described below.`, true)
      .addRaw(`More information: https://github.com/moby/buildkit/blob/master/docs/build-repro.md`, true);

    // attrs
    if (buildInfo.attrs !== undefined) {
      sum = sum.addHeading('Request attributes', 3);
      let buildAttrs = '';
      let buildArgs = '';
      for (const [key, value] of buildInfo.attrs) {
        if (key.startsWith('build-arg:')) {
          buildArgs += `  * \`${key.substring(10)}=${value}\`\n`;
        } else {
          buildAttrs += `* \`${key}=${value}\` `;
        }
      }
      sum = sum.addRaw(buildAttrs + buildArgs, true);
    }

    // sources
    if (buildInfo.sources.length > 0) {
      sum = sum.addHeading('Sources', 3);
      const buildSources: SummaryTableRow[] = [
        [
          {data: 'Type', header: true},
          {data: 'Ref', header: true}
        ]
      ];
      for (const source of buildInfo.sources) {
        buildSources.push([source.type, source.ref]);
      }
      sum = sum.addTable(buildSources);
    }

    await sum.write();
  }
}
