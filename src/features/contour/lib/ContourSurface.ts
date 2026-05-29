import { Layer, project32, picking } from '@deck.gl/core';
import type { DefaultProps, UpdateParameters } from '@deck.gl/core';
import { Model, Geometry } from '@luma.gl/engine';

const vs = `\
#version 300 es
#define SHADER_NAME contour-surface-vs

in vec3 positions;
in vec4 vertexColors;
out vec4 vColor;

void main(void) {
  geometry.worldPosition = positions;
  gl_Position = project_position_to_clipspace(positions, vec3(0.0), vec3(0.0), geometry.position);
  vColor = vertexColors;
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  DECKGL_FILTER_COLOR(vColor, geometry);
}
`;

const fs = `\
#version 300 es
#define SHADER_NAME contour-surface-fs

precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main(void) {
  fragColor = vColor;
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;

export interface ContourSurfaceProps {
  id: string;
  positions: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
  extensions?: unknown[];
  maskId?: string;
  maskInverted?: boolean;
}

type InternalContourSurfaceProps = ContourSurfaceProps & { data: never[] };

const defaultProps: DefaultProps<InternalContourSurfaceProps> = {
  positions: { type: 'object' as const, value: new Float32Array(0) },
  colors: { type: 'object' as const, value: new Float32Array(0) },
  indices: { type: 'object' as const, value: new Uint32Array(0) },
};

export class ContourSurface extends Layer<InternalContourSurfaceProps> {
  static defaultProps = defaultProps;
  static layerName = 'ContourSurface';

  declare state: { model?: Model };

  getShaders() {
    return super.getShaders({ vs, fs, modules: [project32, picking] });
  }

  initializeState() {
    this._buildModel();
  }

  updateState(params: UpdateParameters<this>) {
    super.updateState(params);
    const { props, oldProps } = params;
    if (
      props.positions !== oldProps.positions ||
      props.colors !== oldProps.colors ||
      props.indices !== oldProps.indices
    ) {
      this._buildModel();
    }
  }

  draw() {
    this.state.model?.draw(this.context.renderPass);
  }

  finalizeState() {
    super.finalizeState(this.context);
    this.state.model?.destroy();
  }

  private _buildModel() {
    this.state.model?.destroy();

    const { positions, colors, indices } = this.props;
    if (!positions.length || !indices.length) {
      this.state.model = undefined;
      return;
    }

    this.state.model = new Model(this.context.device, {
      ...this.getShaders(),
      id: this.props.id,
      geometry: new Geometry({
        topology: 'triangle-list',
        attributes: {
          positions: { size: 3, value: positions },
          vertexColors: { size: 4, value: colors },
        },
        indices: { size: 1, value: indices },
      }),
      isInstanced: false,
    });
  }
}
