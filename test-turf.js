import * as turf from '@turf/turf';
import { bboxPolygon } from '@turf/turf';

console.log('turf.bboxPolygon:', typeof turf.bboxPolygon);
console.log('bboxPolygon directo:', typeof bboxPolygon);
console.log('Son iguales?', turf.bboxPolygon === bboxPolygon);
