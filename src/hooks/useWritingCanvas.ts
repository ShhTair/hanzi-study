import { useState, useRef, useEffect } from 'react';
import { PanResponder } from 'react-native';

// Simple Dynamic Time Warping (DTW) implementation
function euclideanDistance(p1: number[], p2: number[]) {
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

export function calculateDTW(path1: number[][], path2: number[][]) {
  const n = path1.length;
  const m = path2.length;
  if (n === 0 || m === 0) return Infinity;

  const dtw = Array(n + 1).fill(null).map(() => Array(m + 1).fill(Infinity));
  dtw[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = euclideanDistance(path1[i - 1], path2[j - 1]);
      dtw[i][j] = cost + Math.min(
        dtw[i - 1][j],    // insertion
        dtw[i][j - 1],    // deletion
        dtw[i - 1][j - 1] // match
      );
    }
  }

  return dtw[n][m] / Math.max(n, m);
}

export function normalizePath(points: number[][], size: number = 900) {
  if (points.length === 0) return [];
  
  // Find bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  
  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  const scaleX = size / width;
  const scaleY = size / height;
  const scale = Math.min(scaleX, scaleY) * 0.8; // 80% of size
  
  const cx = minX + width / 2;
  const cy = minY + height / 2;
  
  return points.map(([x, y]) => [
    (x - cx) * scale + size / 2,
    (y - cy) * scale + size / 2
  ]);
}

export function useWritingCanvas(medians: number[][][], canvasSize: number, mode: 'auto' | 'self_check' = 'auto') {
  const [paths, setPaths] = useState<string[][]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [rawPoints, setRawPoints] = useState<number[][]>([]);
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [strokeFeedback, setStrokeFeedback] = useState<'none' | 'correct' | 'wrong'>('none');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath([`${locationX},${locationY}`]);
        setRawPoints([[locationX, locationY]]);
        setStrokeFeedback('none');
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prev) => [...prev, `${locationX},${locationY}`]);
        setRawPoints((prev) => [...prev, [locationX, locationY]]);
      },
      onPanResponderRelease: () => {
        if (rawPoints.length < 3) {
           setCurrentPath([]);
           setRawPoints([]);
           return;
        }

        // Evaluate stroke
        if (medians && medians.length > currentStrokeIndex) {
          const expectedMedian = medians[currentStrokeIndex];
          // Scale user points from canvasSize to 0-900 MakeMeAHanzi coordinates
          // Also apply Y inversion since MakeMeAHanzi is bottom-left origin
          const scaledUserPoints = rawPoints.map(([x, y]) => [
            (x / canvasSize) * 900,
            900 - ((y / canvasSize) * 900)
          ]);
          
          const normUser = normalizePath(scaledUserPoints);
          const normExpected = normalizePath(expectedMedian);
          
          const distance = calculateDTW(normUser, normExpected);
          
          // Threshold for distance
          const threshold = 150; 
          
          if (distance < threshold) {
            setStrokeFeedback('correct');
            setPaths((prev) => [...prev, currentPath]);
            setCurrentStrokeIndex(prev => prev + 1);
            
            setTimeout(() => {
              setStrokeFeedback('none');
            }, 600);
          } else {
            setStrokeFeedback('wrong');
            setWrongAttempts(prev => prev + 1);
            
            setTimeout(() => {
              setStrokeFeedback('none');
              setCurrentPath([]);
            }, 400);
          }
        } else {
            // No medians left, just accept
            setPaths((prev) => [...prev, currentPath]);
        }
        
        setCurrentPath([]);
        setRawPoints([]);
      },
    })
  ).current;

  const resetCanvas = () => {
    setPaths([]);
    setCurrentPath([]);
    setRawPoints([]);
    setCurrentStrokeIndex(0);
    setWrongAttempts(0);
    setStrokeFeedback('none');
  };

  return {
    panResponder,
    paths,
    currentPath,
    currentStrokeIndex,
    wrongAttempts,
    strokeFeedback,
    resetCanvas
  };
}
