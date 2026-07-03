import { Layer, project32 } from '@deck.gl/core';
import type { DefaultProps, UpdateParameters } from '@deck.gl/core';
import { Model, Geometry } from '@luma.gl/engine';

// NOTE: DECKGL_FILTER_GL_POSITION / DECKGL_FILTER_COLOR 훅은 일부러 호출하지 않는다.
// struct(FragmentGeometry)를 인자로 넘기는 이 호출을 Adreno의 ANGLE 컴파일러가
// `type.getPrecision() != EvpqUndefined` assertion으로 거부해 셰이더 컴파일이 실패,
// contour가 통째로 안 그려진다(다른 GPU/데스크탑은 관대하게 통과). MaskExtension은
// 이 훅이 아니라 luma의 #main-start/#main-end 주입으로 동작하므로(mask/shader-module.js)
// 호출을 빼도 마스크 클리핑은 그대로 유지된다. geometry.worldPosition/geometry.position
// 세팅은 그 #main-end 주입이 참조하므로 남겨둔다. picking은 이 레이어에서 미사용.
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
    return super.getShaders({ vs, fs, modules: [project32] });
  }

  initializeState() {
    this._buildModel();
  }

  updateState(params: UpdateParameters<this>) {
    super.updateState(params);
    const { props, oldProps, changeFlags } = params;
    // extensions(MaskExtension) 추가/제거는 셰이더 코드 자체를 바꾸므로 모델을 다시 만들어야
    // 마스크 GLSL이 (재)주입된다. 이걸 빼먹으면 positions가 바뀌기 전까지 마스크가 안 먹는다
    // (항구 첫 진입 시 겹침/줌아웃 시 통째 사라짐의 원인).
    if (
      changeFlags.extensionsChanged ||
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
