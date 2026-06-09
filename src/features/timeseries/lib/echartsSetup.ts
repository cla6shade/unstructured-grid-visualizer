// echarts/core에 시계열 차트에 필요한 모듈만 등록한다(트리셰이킹). 전체 echarts import 금지.
import * as echarts from 'echarts/core';
import { LineChart, CustomChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  LineChart,
  CustomChart,
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

export { echarts };
